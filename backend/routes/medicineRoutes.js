import express from "express";
import {
  getMedicines,
  getMedicineById,
  getMyListings,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getAiMedicineSuggestion,
  calculatePricingProposal,
  getPartnerAvailableDonations,
  acceptDonationByPartner,
  rejectDonationByPartner,
  verifyDonationHandover,
  getPartnerAcceptedDonations,
} from "../controllers/medicineController.js";
import { protect, verifiedPartnerOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// AI Smart Suggestion & Market Pricing endpoint
router.post("/ai-suggest", getAiMedicineSuggestion);

// MEDISAVE Deterministic Pricing Policy endpoint
router.post("/calculate-pricing", calculatePricingProposal);

// Partner endpoints (Verified Partner only)
router.get("/partner/available", protect, verifiedPartnerOnly, getPartnerAvailableDonations);
router.get("/partner/my-accepted", protect, verifiedPartnerOnly, getPartnerAcceptedDonations);
router.post("/:id/accept-donation", protect, verifiedPartnerOnly, acceptDonationByPartner);
router.post("/:id/reject-donation", protect, verifiedPartnerOnly, rejectDonationByPartner);
router.post("/:id/verify-handover", protect, verifiedPartnerOnly, verifyDonationHandover);

// Donor listings & donations
router.get("/my-listings", protect, getMyListings);
router.get("/my-donations", protect, getMyListings);

// Public routes
router.get("/", getMedicines);
router.get("/:id", getMedicineById);

// Protected routes (Listing owner / admin)
router.post("/", protect, createMedicine);
router.put("/:id", protect, updateMedicine);
router.delete("/:id", protect, deleteMedicine);

export default router;