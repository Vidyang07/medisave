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
} from "../controllers/medicineController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// AI Smart Suggestion & Market Pricing endpoint
router.post("/ai-suggest", getAiMedicineSuggestion);

// MEDISAVE Deterministic Pricing Policy endpoint
router.post("/calculate-pricing", calculatePricingProposal);

// Public routes
router.get("/", getMedicines);
router.get("/my-listings", protect, getMyListings);
router.get("/:id", getMedicineById);

// Protected routes
router.post("/", protect, createMedicine);
router.put("/:id", protect, updateMedicine);
router.delete("/:id", protect, deleteMedicine);

export default router;