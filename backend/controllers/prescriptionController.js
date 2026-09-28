import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Prescription from "../models/Prescription.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Private uploads directory for prescription documents
const UPLOAD_DIR = path.resolve(__dirname, "../uploads/prescriptions");

// Helper to safely delete an uploaded file
const cleanupFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.warn("Failed to cleanup file:", err.message);
    }
  }
};

// @desc    Upload a new prescription document
// @route   POST /api/prescriptions
// @access  Private (Authenticated User)
export const uploadPrescription = async (req, res) => {
  try {
    // 1. Verify file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a prescription document (PDF, JPG, or PNG under 5 MB)",
      });
    }

    const {
      patientName,
      doctorName,
      doctorRegistrationNumber,
      prescribedSalts,
      medicines,
    } = req.body;

    // 2. Validate required patient name
    if (!patientName || !patientName.trim()) {
      cleanupFile(req.file.path);
      return res.status(400).json({
        success: false,
        message: "Patient name is required as stated on the prescription",
      });
    }

    // 3. Parse optional medicine references if provided
    let linkedMedicines = [];
    if (medicines) {
      if (Array.isArray(medicines)) {
        linkedMedicines = medicines.filter((m) =>
          mongoose.Types.ObjectId.isValid(m)
        );
      } else if (typeof medicines === "string") {
        try {
          const parsed = JSON.parse(medicines);
          if (Array.isArray(parsed)) {
            linkedMedicines = parsed.filter((m) =>
              mongoose.Types.ObjectId.isValid(m)
            );
          } else if (mongoose.Types.ObjectId.isValid(medicines)) {
            linkedMedicines = [medicines];
          }
        } catch {
          if (mongoose.Types.ObjectId.isValid(medicines.trim())) {
            linkedMedicines = [medicines.trim()];
          }
        }
      }
    }

    // 4. Create Prescription record with strict server-side overrides
    const prescription = await Prescription.create({
      buyer: req.user._id, // Enforce authenticated buyer ID strictly from JWT
      patientName: patientName.trim(),
      doctorName: doctorName ? doctorName.trim() : "",
      doctorRegistrationNumber: doctorRegistrationNumber
        ? doctorRegistrationNumber.trim()
        : "",
      prescribedSalts: prescribedSalts ? prescribedSalts.trim() : "",
      medicines: linkedMedicines,
      documentPath: req.file.path,
      documentOriginalName: req.file.originalname,
      documentMimeType: req.file.mimetype,
      fileSize: req.file.size,
      status: "pending", // Strictly defaults to pending; client input ignored
      rejectionReason: "",
      reviewedBy: null,
      reviewedAt: null,
      validUntil: null,
    });

    return res.status(201).json({
      success: true,
      message: "Prescription document uploaded successfully and submitted for coordinator verification",
      data: prescription,
    });
  } catch (error) {
    if (req.file) {
      cleanupFile(req.file.path);
    }
    console.error("Upload Prescription Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error processing prescription upload",
      error: error.message,
    });
  }
};

// @desc    Get prescriptions belonging to the authenticated buyer
// @route   GET /api/prescriptions/my-prescriptions
// @access  Private (Authenticated User)
export const getMyPrescriptions = async (req, res) => {
  try {
    // Strictly query by authenticated user ID from JWT; never from query parameters
    const prescriptions = await Prescription.find({ buyer: req.user._id })
      .select("-documentPath")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (error) {
    console.error("Get My Prescriptions Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error retrieving prescriptions",
      error: error.message,
    });
  }
};

// @desc    Get a single prescription by ID (metadata only)
// @route   GET /api/prescriptions/:id
// @access  Private (Authenticated Buyer Only)
export const getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    const prescription = await Prescription.findById(id).select("-documentPath");

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    // Strictly enforce buyer ownership (Admin access will be handled in Step 4)
    if (prescription.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to view this prescription",
      });
    }

    return res.status(200).json({
      success: true,
      data: prescription,
    });
  } catch (error) {
    console.error("Get Prescription By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error retrieving prescription",
      error: error.message,
    });
  }
};

// @desc    Securely access and stream a prescription document
// @route   GET /api/prescriptions/:id/document
// @access  Private (Authenticated Buyer Only)
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

    // Strictly enforce buyer ownership (Admin access will be handled in Step 4)
    if (prescription.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to access this prescription document",
      });
    }

    // Prevent path traversal and verify path is strictly inside UPLOAD_DIR
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

    // Check if physical file exists on disk
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
      console.error("Document Stream Error:", streamErr);
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: "Error streaming prescription document",
        });
      }
    });

    return fileStream.pipe(res);
  } catch (error) {
    console.error("Get Prescription Document Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error retrieving prescription document",
      error: error.message,
    });
  }
};

