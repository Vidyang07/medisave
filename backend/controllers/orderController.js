import mongoose from "mongoose";
import Order from "../models/Order.js";
import Medicine from "../models/Medicine.js";
import Prescription from "../models/Prescription.js";
import { validatePrescriptionForOrder } from "../services/prescriptionValidation.js";

// Supported lifecycle status transitions
const VALID_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

// Helper to compute overall order.status from constituent items
const computeOrderStatus = (items) => {
  if (!items || items.length === 0) return "pending";

  const statuses = items.map((it) => it.status || "pending");

  // If all items are cancelled
  if (statuses.every((s) => s === "cancelled")) {
    return "cancelled";
  }

  // Active (non-cancelled) items
  const activeStatuses = statuses.filter((s) => s !== "cancelled");
  if (activeStatuses.length === 0) {
    return "cancelled";
  }

  // If all active items are delivered
  if (activeStatuses.every((s) => s === "delivered")) {
    return "delivered";
  }

  // If any active item is pending
  if (activeStatuses.some((s) => s === "pending")) {
    return "pending";
  }

  // If any active item is confirmed
  if (activeStatuses.some((s) => s === "confirmed")) {
    return "confirmed";
  }

  // If any active item is processing
  if (activeStatuses.some((s) => s === "processing")) {
    return "processing";
  }

  // If all active items are shipped or delivered
  if (activeStatuses.every((s) => s === "shipped" || s === "delivered")) {
    return "shipped";
  }

  return activeStatuses[0] || "pending";
};

// @desc    Create a new order from cart items
// @route   POST /api/orders
// @access  Private (Authenticated buyer)
export const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, prescriptionId, prescription } = req.body;

    // 1. Basic validation of payload
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one medicine item",
      });
    }

    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.phone ||
      !shippingAddress.address ||
      !shippingAddress.city
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a complete shipping address (fullName, phone, address, city)",
      });
    }

    const buyerId = req.user._id;

    // Consolidate items if duplicate medicine IDs are provided in items array
    const consolidatedMap = new Map();
    for (const item of items) {
      const medicineId = item.medicineId || item.medicine || item.id || item._id;
      const requestedQty = parseInt(item.quantity, 10);

      if (!medicineId || !mongoose.Types.ObjectId.isValid(medicineId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid medicine ID provided: ${medicineId}`,
        });
      }

      if (isNaN(requestedQty) || requestedQty <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for medicine item`,
        });
      }

      const idStr = medicineId.toString();
      consolidatedMap.set(idStr, (consolidatedMap.get(idStr) || 0) + requestedQty);
    }

    const validatedItems = [];
    let subtotal = 0;
    const medicinesToUpdate = [];
    const rxMedicines = [];
    let requiresPrescription = false;

    // 2. Validate each consolidated medicine item against database
    for (const [medicineId, requestedQty] of consolidatedMap.entries()) {
      // Fetch fresh record directly from DB
      const medicine = await Medicine.findById(medicineId);
      if (!medicine) {
        return res.status(404).json({
          success: false,
          message: `Medicine not found with ID ${medicineId}`,
        });
      }

      // Check listing availability and approval
      if (medicine.status !== "approved" || medicine.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: `"${medicine.medicineName}" is currently unavailable or sold out`,
        });
      }

      // Prevent seller from purchasing their own medicine listing
      if (medicine.seller.toString() === buyerId.toString()) {
        return res.status(400).json({
          success: false,
          message: `You cannot purchase your own medicine listing: "${medicine.medicineName}"`,
        });
      }

      // Verify stock availability
      if (requestedQty > medicine.quantity) {
        return res.status(400).json({
          success: false,
          message: `Requested quantity (${requestedQty}) exceeds available stock (${medicine.quantity}) for "${medicine.medicineName}"`,
        });
      }

      if (medicine.isPrescriptionRequired) {
        requiresPrescription = true;
        rxMedicines.push(medicine);
      }

      // Strictly take prices and seller details from MongoDB record
      const itemPrice = medicine.price;
      const itemOriginalMrp = medicine.originalMrp || itemPrice;
      const itemTotal = itemPrice * requestedQty;
      subtotal += itemTotal;

      validatedItems.push({
        medicine: medicine._id,
        medicineName: medicine.medicineName,
        brandName: medicine.brandName || medicine.medicineName,
        company: medicine.company,
        strength: medicine.strength,
        quantity: requestedQty,
        price: itemPrice,
        originalMrp: itemOriginalMrp,
        seller: medicine.seller,
        image: medicine.image,
        status: "pending",
      });

      medicinesToUpdate.push({
        doc: medicine,
        purchasedQty: requestedQty,
      });
    }

    // 3. Authoritative Prescription Verification via reusable service
    let verifiedPrescriptionId = null;

    if (requiresPrescription) {
      const targetPrescriptionId = prescriptionId || prescription;
      const rxValidation = await validatePrescriptionForOrder(
        buyerId,
        targetPrescriptionId,
        rxMedicines
      );

      if (!rxValidation.isValid) {
        return res.status(rxValidation.status).json({
          success: false,
          message: rxValidation.message,
        });
      }

      verifiedPrescriptionId = rxValidation.prescriptionDoc._id;
    }

    // 4. Server-side calculations
    const shippingFee = subtotal >= 200 ? 0 : 25;
    const totalAmount = subtotal + shippingFee;

    // 5. Update medicine inventory safely with rollback protection
    const updatedMedicines = [];
    try {
      for (const update of medicinesToUpdate) {
        const med = update.doc;
        med.quantity -= update.purchasedQty;
        if (med.quantity <= 0) {
          med.quantity = 0;
          med.status = "sold";
        }
        await med.save();
        updatedMedicines.push({ med, purchasedQty: update.purchasedQty });
      }

      // 6. Create Order document with initial 'pending' status
      const order = await Order.create({
        buyer: buyerId,
        items: validatedItems,
        subtotal,
        shippingFee,
        totalAmount,
        shippingAddress: {
          fullName: shippingAddress.fullName.trim(),
          phone: shippingAddress.phone.trim(),
          address: shippingAddress.address.trim(),
          city: shippingAddress.city.trim(),
          state: shippingAddress.state?.trim() || "Maharashtra",
          pincode: shippingAddress.pincode?.trim() || "",
        },
        paymentMethod: paymentMethod || "Cash on Delivery / Community Handover",
        prescription: verifiedPrescriptionId,
        status: "pending",
      });

      const populatedOrder = await Order.findById(order._id)
        .populate("prescription", "patientName doctorName doctorRegistrationNumber prescribedSalts status validUntil documentOriginalName createdAt");

      return res.status(201).json({
        success: true,
        message: "Order placed successfully",
        data: populatedOrder || order,
      });
    } catch (saveError) {
      // Rollback any partially decremented inventory in case of DB error
      for (const updated of updatedMedicines) {
        try {
          const m = await Medicine.findById(updated.med._id);
          if (m) {
            m.quantity += updated.purchasedQty;
            if (m.status === "sold" && m.quantity > 0) {
              m.status = "approved";
            }
            await m.save();
          }
        } catch (rollbackErr) {
          console.error("Rollback error:", rollbackErr.message);
        }
      }
      throw saveError;
    }
  } catch (error) {
    console.error("Create Order Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create order",
    });
  }
};

// @desc    Get all orders placed by currently authenticated buyer
// @route   GET /api/orders/my-orders
// @access  Private (Authenticated buyer)
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate("items.seller", "name email phone address")
      .populate("items.medicine", "medicineName brandName company category image strength dosageForm")
      .populate("prescription", "patientName doctorName doctorRegistrationNumber prescribedSalts status validUntil documentOriginalName createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Get My Orders Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve orders",
    });
  }
};

// @desc    Get orders containing medicines listed by authenticated seller
// @route   GET /api/orders/seller-orders
// @access  Private (Authenticated seller / Admin)
export const getSellerOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === "admin";

    // Query for orders containing items where seller is req.user._id (or all for admin)
    const query = isAdmin ? {} : { "items.seller": userId };

    const orders = await Order.find(query)
      .populate("buyer", "name email phone address")
      .populate("items.seller", "name email phone address")
      .populate("items.medicine", "medicineName brandName company category image strength dosageForm")
      .populate("prescription", "patientName doctorName doctorRegistrationNumber prescribedSalts status validUntil documentOriginalName createdAt")
      .sort({ createdAt: -1 });

    // Format output: For non-admins, filter items so they only see their own items
    const sellerOrders = orders
      .map((order) => {
        const orderObj = order.toObject();

        const sellerItems = isAdmin
          ? orderObj.items
          : orderObj.items.filter(
              (it) =>
                (it.seller?._id || it.seller)?.toString() === userId.toString()
            );

        const sellerSubtotal = sellerItems.reduce(
          (sum, it) => sum + (it.price || 0) * (it.quantity || 1),
          0
        );

        const sellerItemCount = sellerItems.reduce(
          (sum, it) => sum + (it.quantity || 1),
          0
        );

        // Determine seller-specific status
        const sellerItemStatuses = sellerItems.map(
          (it) => it.status || orderObj.status || "pending"
        );
        const sellerStatus =
          sellerItemStatuses.length > 0 &&
          sellerItemStatuses.every((s) => s === sellerItemStatuses[0])
            ? sellerItemStatuses[0]
            : orderObj.status;

        return {
          ...orderObj,
          items: sellerItems,
          sellerSubtotal,
          sellerItemCount,
          sellerStatus,
        };
      })
      .filter((order) => order.items.length > 0);

    return res.status(200).json({
      success: true,
      count: sellerOrders.length,
      data: sellerOrders,
    });
  } catch (error) {
    console.error("Get Seller Orders Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve seller orders",
      error: error.message,
    });
  }
};

// @desc    Get single order details by ID
// @route   GET /api/orders/:id
// @access  Private (Buyer, Item Seller, or Admin)
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }

    const order = await Order.findById(id)
      .populate("buyer", "name email phone address")
      .populate("items.seller", "name email phone address")
      .populate("items.medicine", "medicineName brandName company category image strength dosageForm")
      .populate("prescription", "patientName doctorName doctorRegistrationNumber prescribedSalts status validUntil documentOriginalName createdAt");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Authorization check
    const userId = req.user._id.toString();
    const isBuyer =
      order.buyer?._id?.toString() === userId || order.buyer?.toString() === userId;
    const isSeller = order.items.some(
      (it) =>
        it.seller?._id?.toString() === userId || it.seller?.toString() === userId
    );
    const isAdmin = req.user.role === "admin";

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this order",
      });
    }

    const orderObj = order.toObject();

    // If accessing as seller only (not buyer or admin), restrict items view to seller's own items
    if (isSeller && !isBuyer && !isAdmin) {
      orderObj.items = orderObj.items.filter(
        (it) => (it.seller?._id || it.seller)?.toString() === userId
      );
    }

    return res.status(200).json({
      success: true,
      data: orderObj,
    });
  } catch (error) {
    console.error("Get Order By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
    });
  }
};

// @desc    Update order/item lifecycle status
// @route   PATCH /api/orders/:id/status
// @access  Private (Seller of item in order, or Admin)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, itemId, medicineId, cancellationReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid status",
      });
    }

    const validStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status "${status}". Allowed statuses: ${validStatuses.join(", ")}`,
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const userId = req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    // Find all items belonging to this seller (or all items if admin)
    const sellerItems = order.items.filter(
      (it) => isAdmin || (it.seller && it.seller.toString() === userId)
    );

    if (sellerItems.length === 0 && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to modify status for this order",
      });
    }

    // Determine target items to update
    let targetItems = [];
    if (itemId) {
      const match = order.items.find(
        (it) =>
          (it._id && it._id.toString() === itemId) ||
          it.medicine?.toString() === itemId
      );
      if (!match) {
        return res.status(404).json({
          success: false,
          message: `Order item with ID ${itemId} not found in this order`,
        });
      }
      // Check seller ownership of the specific item
      if (!isAdmin && match.seller?.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update status for items belonging to another seller",
        });
      }
      targetItems = [match];
    } else if (medicineId) {
      const match = order.items.find(
        (it) => it.medicine?.toString() === medicineId
      );
      if (!match) {
        return res.status(404).json({
          success: false,
          message: `Medicine with ID ${medicineId} not found in this order`,
        });
      }
      if (!isAdmin && match.seller?.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update status for items belonging to another seller",
        });
      }
      targetItems = [match];
    } else {
      targetItems = sellerItems;
    }

    // Validate state transitions for all target items
    for (const item of targetItems) {
      const currentItemStatus = item.status || order.status || "pending";

      if (currentItemStatus === status) {
        return res.status(400).json({
          success: false,
          message: `Item "${item.medicineName}" is already marked as "${status}"`,
        });
      }

      const allowedNext = VALID_TRANSITIONS[currentItemStatus] || [];
      if (!allowedNext.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition: Cannot move "${item.medicineName}" from "${currentItemStatus}" to "${status}". Allowed transitions: ${
            allowedNext.length > 0 ? allowedNext.join(", ") : "None (terminal state)"
          }`,
        });
      }
    }

    // Apply status update and handle inventory if cancelling
    for (const item of targetItems) {
      const previousStatus = item.status || order.status || "pending";

      if (status === "cancelled" && previousStatus !== "cancelled") {
        const medicine = await Medicine.findById(item.medicine);
        if (medicine) {
          medicine.quantity += item.quantity;
          if (medicine.status === "sold" && medicine.quantity > 0) {
            medicine.status = "approved";
          }
          await medicine.save();
        }
      }

      item.status = status;
    }

    // Recompute overall order status
    order.status = computeOrderStatus(order.items);

    if (cancellationReason) {
      order.cancellationReason = cancellationReason.trim();
    }

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate("buyer", "name email phone address")
      .populate("items.seller", "name email phone address")
      .populate("items.medicine", "medicineName brandName company category image strength dosageForm");

    return res.status(200).json({
      success: true,
      message: `Order status updated to "${status}" successfully`,
      data: populatedOrder,
    });
  } catch (error) {
    console.error("Update Order Status Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update order status",
    });
  }
};

// @desc    Cancel an order and restore medicine inventory
// @route   PATCH /api/orders/:id/cancel
// @access  Private (Buyer or Admin)
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Authorization check: buyer or admin only
    const userId = req.user._id.toString();
    const isBuyer =
      order.buyer?._id?.toString() === userId || order.buyer?.toString() === userId;
    const isAdmin = req.user.role === "admin";

    if (!isBuyer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this order",
      });
    }

    // Check if order is in cancellable status
    const cancellableStatuses = ["pending", "confirmed", "processing"];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because it is already marked as "${order.status}"`,
      });
    }

    // Restore inventory for each item not already cancelled
    for (const item of order.items) {
      if (item.status !== "cancelled") {
        const medicine = await Medicine.findById(item.medicine);
        if (medicine) {
          medicine.quantity += item.quantity;
          if (medicine.status === "sold" && medicine.quantity > 0) {
            medicine.status = "approved";
          }
          await medicine.save();
        }
        item.status = "cancelled";
      }
    }

    // Update order status
    order.status = "cancelled";
    if (reason) {
      order.cancellationReason = reason.trim();
    }
    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate("buyer", "name email phone address")
      .populate("items.seller", "name email phone address");

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully and inventory restored",
      data: populatedOrder,
    });
  } catch (error) {
    console.error("Cancel Order Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel order",
    });
  }
};
