import express from "express";
import {
  uploadPrescription,
  getMyPrescriptions,
  getPrescriptionById,
  getPrescriptionDocument,
} from "../controllers/prescriptionController.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadPrescriptionFile } from "../middleware/prescriptionUpload.js";

const router = express.Router();

// GET /api/prescriptions/my-prescriptions - Retrieve authenticated buyer's prescriptions
router.get("/my-prescriptions", protect, getMyPrescriptions);

// GET /api/prescriptions/:id - Retrieve single prescription metadata
router.get("/:id", protect, getPrescriptionById);

// GET /api/prescriptions/:id/document - Securely stream prescription document
router.get("/:id/document", protect, getPrescriptionDocument);

// POST /api/prescriptions - Upload a new prescription document
router.post("/", protect, uploadPrescriptionFile, uploadPrescription);

export default router;

