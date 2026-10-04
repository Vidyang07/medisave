import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import User from "../models/User.js";
import Medicine from "../models/Medicine.js";
import Order from "../models/Order.js";
import Prescription from "../models/Prescription.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Private uploads directory for prescription documents
const UPLOAD_DIR = path.resolve(__dirname, "../uploads/prescriptions");

// @desc    Get administrative metrics and platform overview
// @route   GET /api/admin/stats
// @access  Private (Admin only)
export const getAdminStats = async (req, res) => {
  try {
    const [
      totalUsers,
      verifiedUsers,
      adminUsers,
      totalMedicines,
      pendingMedicines,
      approvedMedicines,
      rejectedMedicines,
      soldMedicines,
      totalOrders,
      pendingOrders,
      confirmedOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      orderVolumeAgg,
      totalPrescriptions,
      pendingPrescriptions,
      approvedPrescriptions,
      rejectedPrescriptions,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ role: "admin" }),
      Medicine.countDocuments(),
      Medicine.countDocuments({ status: "pending" }),
      Medicine.countDocuments({ status: "approved" }),
      Medicine.countDocuments({ status: "rejected" }),
      Medicine.countDocuments({ status: "sold" }),
      Order.countDocuments(),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "confirmed" }),
      Order.countDocuments({ status: "processing" }),
      Order.countDocuments({ status: "shipped" }),
      Order.countDocuments({ status: "delivered" }),
      Order.countDocuments({ status: "cancelled" }),
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $group: { _id: null, totalTurnover: { $sum: "$totalAmount" } } },
      ]),
      Prescription.countDocuments(),
      Prescription.countDocuments({ status: "pending" }),
      Prescription.countDocuments({ status: "approved" }),
      Prescription.countDocuments({ status: "rejected" }),
    ]);

    const platformVolume = orderVolumeAgg.length > 0 ? orderVolumeAgg[0].totalTurnover : 0;

    return res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          verified: verifiedUsers,
          admins: adminUsers,
        },
        medicines: {
          total: totalMedicines,
          pending: pendingMedicines,
          approved: approvedMedicines,
          rejected: rejectedMedicines,
          sold: soldMedicines,
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          confirmed: confirmedOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
          turnover: platformVolume,
        },
        prescriptions: {
          total: totalPrescriptions,
          pending: pendingPrescriptions,
          approved: approvedPrescriptions,
          rejected: rejectedPrescriptions,
        },
      },
    });

  } catch (error) {
    console.error("Get Admin Stats Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching administrative stats",
      error: error.message,
    });
  }
};

// @desc    Get all medicines for admin moderation
// @route   GET /api/admin/medicines
// @access  Private (Admin only)
export const getAdminMedicines = async (req, res) => {
  try {
    const { status, search, category, page = 1, limit = 20 } = req.query;

    const query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (category && category !== "all" && category !== "All Categories") {
      query.category = category;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { medicineName: searchRegex },
        { brandName: searchRegex },
        { company: searchRegex },
        { genericName: searchRegex },
        { batchNumber: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const total = await Medicine.countDocuments(query);
    const medicines = await Medicine.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("seller", "name email phone address avatar isVerified createdAt");

    return res.status(200).json({
      success: true,
      count: medicines.length,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
      data: medicines,
    });
  } catch (error) {
    console.error("Get Admin Medicines Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching medicines for moderation",
      error: error.message,
    });
  }
};

// @desc    Moderate a medicine (Approve, Reject, or Change Status)
// @route   PATCH /api/admin/medicines/:id/status
// @access  Private (Admin only)
export const moderateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid medicine ID format",
      });
    }

    const validStatuses = ["pending", "approved", "rejected", "sold"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status "${status}". Allowed: ${validStatuses.join(", ")}`,
      });
    }

    const medicine = await Medicine.findById(id);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    medicine.status = status;
    if (status === "rejected") {
      medicine.rejectionReason = rejectionReason ? rejectionReason.trim() : "Rejected by moderator";
    } else if (status === "approved") {
      medicine.rejectionReason = "";
    }

    await medicine.save();

    const populated = await Medicine.findById(medicine._id).populate(
      "seller",
      "name email phone address avatar isVerified createdAt"
    );

    return res.status(200).json({
      success: true,
      message: `Medicine listing successfully marked as "${status}"`,
      data: populated,
    });
  } catch (error) {
    console.error("Moderate Medicine Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error moderating medicine",
      error: error.message,
    });
  }
};

// @desc    Admin delete a medicine listing
// @route   DELETE /api/admin/medicines/:id
// @access  Private (Admin only)
export const deleteAdminMedicine = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid medicine ID format",
      });
    }

    const medicine = await Medicine.findByIdAndDelete(id);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Medicine "${medicine.medicineName}" permanently deleted by admin`,
    });
  } catch (error) {
    console.error("Delete Admin Medicine Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error deleting medicine",
      error: error.message,
    });
  }
};

// @desc    Get all orders on the platform for admin oversight
// @route   GET /api/admin/orders
// @access  Private (Admin only)
export const getAdminOrders = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("buyer", "name email phone address avatar isVerified")
      .populate("items.seller", "name email phone address avatar isVerified")
      .populate("items.medicine", "medicineName brandName company category image strength dosageForm")
      .populate("prescription", "patientName doctorName doctorRegistrationNumber prescribedSalts status validUntil documentOriginalName createdAt");

    return res.status(200).json({
      success: true,
      count: orders.length,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
      data: orders,
    });
  } catch (error) {
    console.error("Get Admin Orders Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching platform orders",
      error: error.message,
    });
  }
};

// @desc    Get all registered platform users
// @route   GET /api/admin/users
// @access  Private (Admin only)
export const getAdminUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    // Aggregate listing and order counts per user
    const userIds = users.map((u) => u._id);
    const [listingsCountAgg, ordersCountAgg] = await Promise.all([
      Medicine.aggregate([
        { $match: { seller: { $in: userIds } } },
        { $group: { _id: "$seller", count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { buyer: { $in: userIds } } },
        { $group: { _id: "$buyer", count: { $sum: 1 } } },
      ]),
    ]);

    const listingsMap = {};
    listingsCountAgg.forEach((item) => {
      listingsMap[item._id.toString()] = item.count;
    });

    const ordersMap = {};
    ordersCountAgg.forEach((item) => {
      ordersMap[item._id.toString()] = item.count;
    });

    const enrichedUsers = users.map((u) => {
      const uObj = u.toObject();
      return {
        ...uObj,
        listingsCount: listingsMap[u._id.toString()] || 0,
        ordersCount: ordersMap[u._id.toString()] || 0,
      };
    });

    return res.status(200).json({
      success: true,
      count: enrichedUsers.length,
      data: enrichedUsers,
    });
  } catch (error) {
    console.error("Get Admin Users Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching platform users",
      error: error.message,
    });
  }
};

// @desc    Toggle or set user verified status
// @route   PATCH /api/admin/users/:id/verify
// @access  Private (Admin only)
export const toggleUserVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isVerified = isVerified !== undefined ? Boolean(isVerified) : !user.isVerified;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User verification updated to ${user.isVerified}`,
      data: user,
    });
  } catch (error) {
    console.error("Toggle User Verification Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating user verification",
      error: error.message,
    });
  }
};

// @desc    Update user role (user or admin)
// @route   PATCH /api/admin/users/:id/role
// @access  Private (Admin only)
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Allowed values: 'user', 'admin'",
      });
    }

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.role = role;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User role updated to "${role}"`,
      data: user,
    });
  } catch (error) {
    console.error("Update User Role Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating user role",
      error: error.message,
    });
  }
};

// ==========================================
// PRESCRIPTION VERIFICATION & REVIEW SYSTEM
// ==========================================

// @desc    Get all prescriptions for admin review/audit
// @route   GET /api/admin/prescriptions
// @access  Private (Admin only)
export const getPrescriptions = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;

    const query = {};
    if (status && ["pending", "approved", "rejected"].includes(status.toLowerCase())) {
      query.status = status.toLowerCase();
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { patientName: searchRegex },
        { doctorName: searchRegex },
        { doctorRegistrationNumber: searchRegex },
        { prescribedSalts: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const total = await Prescription.countDocuments(query);
    const prescriptions = await Prescription.find(query)
      .select("-documentPath")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("buyer", "name email phone address avatar isVerified createdAt")
      .populate(
        "medicines",
        "medicineName brandName company strength dosageForm price isPrescriptionRequired"
      )
      .populate("reviewedBy", "name email");

    return res.status(200).json({
      success: true,
      count: prescriptions.length,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
      data: prescriptions,
    });
  } catch (error) {
    console.error("Get Admin Prescriptions Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching prescriptions",
      error: error.message,
    });
  }
};

// @desc    Get complete single prescription metadata by ID
// @route   GET /api/admin/prescriptions/:id
// @access  Private (Admin only)
export const getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    const prescription = await Prescription.findById(id)
      .select("-documentPath")
      .populate("buyer", "name email phone address avatar isVerified createdAt")
      .populate(
        "medicines",
        "medicineName brandName company strength dosageForm price isPrescriptionRequired"
      )
      .populate("reviewedBy", "name email");

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: prescription,
    });
  } catch (error) {
    console.error("Get Admin Prescription By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error retrieving prescription details",
      error: error.message,
    });
  }
};

// @desc    Securely view/stream a prescription document for verification
// @route   GET /api/admin/prescriptions/:id/document
// @access  Private (Admin only)
export const getPrescriptionDocument = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    const prescription = await Prescription.findById(id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    // Path traversal defense
    const resolvedUploadDir = path.resolve(UPLOAD_DIR);
    const resolvedFilePath = path.resolve(prescription.documentPath);

    const relative = path.relative(resolvedUploadDir, resolvedFilePath);
    const isInsideUploadDir =
      relative && !relative.startsWith("..") && !path.isAbsolute(relative);

    if (!isInsideUploadDir) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: Invalid document location",
      });
    }

    // Check physical file on disk
    if (!fs.existsSync(resolvedFilePath)) {
      return res.status(404).json({
        success: false,
        message: "Prescription document file not found on server",
      });
    }

    const mimeType = prescription.documentMimeType || "application/octet-stream";
    const originalName = prescription.documentOriginalName || "prescription_document";
    const sanitizedFilename = originalName.replace(/["\r\n]/g, "");

    res.setHeader("Content-Type", mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(sanitizedFilename)}"`
    );

    const fileStream = fs.createReadStream(resolvedFilePath);
    fileStream.on("error", (streamErr) => {
      console.error("Admin Document Stream Error:", streamErr);
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: "Error streaming prescription document",
        });
      }
    });

    return fileStream.pipe(res);
  } catch (error) {
    console.error("Get Admin Prescription Document Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error retrieving prescription document",
      error: error.message,
    });
  }
};

// @desc    Approve a pending prescription
// @route   PATCH /api/admin/prescriptions/:id/approve
// @access  Private (Admin only)
export const approvePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { validUntil } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    const prescription = await Prescription.findById(id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    if (prescription.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Prescription is already approved",
      });
    }

    if (prescription.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: "Cannot approve a rejected prescription directly",
      });
    }

    if (prescription.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Only pending prescriptions can be approved. Current status: "${prescription.status}"`,
      });
    }

    // Optional future validity date validation
    let parsedValidUntil = null;
    if (validUntil !== undefined && validUntil !== null && validUntil !== "") {
      const dateObj = new Date(validUntil);
      if (isNaN(dateObj.getTime()) || dateObj <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "validUntil must be a valid future date",
        });
      }
      parsedValidUntil = dateObj;
    }

    prescription.status = "approved";
    prescription.reviewedBy = req.user._id;
    prescription.reviewedAt = new Date();
    prescription.validUntil = parsedValidUntil;
    prescription.rejectionReason = "";

    await prescription.save();

    const populated = await Prescription.findById(prescription._id)
      .select("-documentPath")
      .populate("buyer", "name email phone address avatar isVerified")
      .populate(
        "medicines",
        "medicineName brandName company strength dosageForm price isPrescriptionRequired"
      )
      .populate("reviewedBy", "name email");

    return res.status(200).json({
      success: true,
      message: "Prescription approved successfully",
      data: populated,
    });
  } catch (error) {
    console.error("Approve Prescription Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error approving prescription",
      error: error.message,
    });
  }
};

// @desc    Reject a pending prescription with mandatory reason
// @route   PATCH /api/admin/prescriptions/:id/reject
// @access  Private (Admin only)
export const rejectPrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    const prescription = await Prescription.findById(id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    if (prescription.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: "Prescription is already rejected",
      });
    }

    if (prescription.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Only pending prescriptions can be rejected. Current status: "${prescription.status}"`,
      });
    }

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    prescription.status = "rejected";
    prescription.rejectionReason = rejectionReason.trim();
    prescription.reviewedBy = req.user._id;
    prescription.reviewedAt = new Date();

    await prescription.save();

    const populated = await Prescription.findById(prescription._id)
      .select("-documentPath")
      .populate("buyer", "name email phone address avatar isVerified")
      .populate(
        "medicines",
        "medicineName brandName company strength dosageForm price isPrescriptionRequired"
      )
      .populate("reviewedBy", "name email");

    return res.status(200).json({
      success: true,
      message: "Prescription rejected",
      data: populated,
    });
  } catch (error) {
    console.error("Reject Prescription Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error rejecting prescription",
      error: error.message,
    });
  }
};

// ==========================================
// PARTNER VERIFICATION & MANAGEMENT
// ==========================================

// @desc    Get all registered partner organizations for admin verification
// @route   GET /api/admin/partners
// @access  Private (Admin only)
export const getAdminPartners = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = { role: "partner" };

    if (status && ["pending", "verified", "rejected"].includes(status.toLowerCase())) {
      query.partnerStatus = status.toLowerCase();
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: regex },
        { email: regex },
        { organizationName: regex },
        { locality: regex },
      ];
    }

    const partners = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: partners.length,
      data: partners,
    });
  } catch (error) {
    console.error("Get Admin Partners Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching partner organizations",
      error: error.message,
    });
  }
};

// @desc    Moderate / verify a partner organization
// @route   PATCH /api/admin/partners/:id/verify
// @access  Private (Admin only)
export const moderatePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const { partnerStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid partner ID format",
      });
    }

    if (!["verified", "rejected", "pending"].includes(partnerStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid partnerStatus. Allowed: 'verified', 'rejected', 'pending'",
      });
    }

    const partner = await User.findById(id).select("-password");
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner account not found",
      });
    }

    partner.partnerStatus = partnerStatus;
    if (partnerStatus === "verified") {
      partner.isVerified = true;
    }
    await partner.save();

    return res.status(200).json({
      success: true,
      message: `Partner organization status updated to "${partnerStatus}"`,
      data: partner,
    });
  } catch (error) {
    console.error("Moderate Partner Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error moderating partner organization",
      error: error.message,
    });
  }
};

