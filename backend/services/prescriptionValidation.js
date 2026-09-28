import mongoose from "mongoose";
import Prescription from "../models/Prescription.js";

/**
 * Validates a prescription against an order's buyer and prescription-required medicine items.
 * 
 * Rules enforced:
 * 1. Prescription must be provided if order contains Rx medicine.
 * 2. Prescription ID must be a valid MongoDB ObjectId.
 * 3. Prescription document must exist in MongoDB.
 * 4. Prescription must belong strictly to the authenticated buyer (no cross-user usage).
 * 5. Prescription status must be exactly 'approved' (no pending, rejected, or tampered statuses).
 * 6. Prescription must not be expired if validUntil is set (timezone-safe date comparison).
 * 
 * @param {string|mongoose.Types.ObjectId} buyerId - Authenticated buyer user ID from JWT
 * @param {string|mongoose.Types.ObjectId} prescriptionId - Prescription ID submitted with order
 * @param {Array} rxMedicines - Array of medicine documents/items requiring prescription
 * @returns {Promise<{ isValid: boolean, status: number, message: string, prescriptionDoc: Object|null }>}
 */
export const validatePrescriptionForOrder = async (
  buyerId,
  prescriptionId,
  rxMedicines = []
) => {
  // Rule 1: Prescription must be provided
  if (!prescriptionId) {
    return {
      isValid: false,
      status: 400,
      message: "An approved prescription is required for this order.",
      prescriptionDoc: null,
    };
  }

  // Rule 2: Prescription ID format validation
  if (!mongoose.Types.ObjectId.isValid(prescriptionId)) {
    return {
      isValid: false,
      status: 400,
      message: "Prescription not found.",
      prescriptionDoc: null,
    };
  }

  // Rule 3: Prescription record must exist in MongoDB
  const prescriptionDoc = await Prescription.findById(prescriptionId);

  if (!prescriptionDoc) {
    return {
      isValid: false,
      status: 404,
      message: "Prescription not found.",
      prescriptionDoc: null,
    };
  }

  // Rule 4: Ownership verification (IDOR protection)
  if (prescriptionDoc.buyer.toString() !== buyerId.toString()) {
    return {
      isValid: false,
      status: 403,
      message: "You are not authorized to use this prescription.",
      prescriptionDoc: null,
    };
  }

  // Rule 5: Status verification (must be approved by coordinator)
  if (prescriptionDoc.status !== "approved") {
    return {
      isValid: false,
      status: 400,
      message: "Prescription has not been approved.",
      prescriptionDoc: null,
    };
  }

  // Rule 6: Temporal validity check (must not be expired)
  if (prescriptionDoc.validUntil !== null && prescriptionDoc.validUntil !== undefined) {
    const expiryDate = new Date(prescriptionDoc.validUntil);
    if (!isNaN(expiryDate.getTime()) && expiryDate <= new Date()) {
      return {
        isValid: false,
        status: 400,
        message: "Prescription has expired.",
        prescriptionDoc: null,
      };
    }
  }

  return {
    isValid: true,
    status: 200,
    message: "Prescription is valid and approved.",
    prescriptionDoc,
  };
};

export default validatePrescriptionForOrder;
