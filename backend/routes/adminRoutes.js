import express from "express";
import {
  getAdminStats,
  getAdminMedicines,
  moderateMedicine,
  deleteAdminMedicine,
  getAdminOrders,
  getAdminUsers,
  toggleUserVerification,
  updateUserRole,
  getPrescriptions,
  getPrescriptionById,
  getPrescriptionDocument,
  approvePrescription,
  rejectPrescription,
  getAdminPartners,
  moderatePartner,
  unlockMedicineHandover,
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";

const router = express.Router();

// All admin routes require both JWT authentication and admin role
router.use(protect, admin);

router.get("/stats", getAdminStats);
router.get("/medicines", getAdminMedicines);
router.patch("/medicines/:id/status", moderateMedicine);
router.delete("/medicines/:id", deleteAdminMedicine);
router.post("/medicines/:id/unlock-handover", unlockMedicineHandover);
router.patch("/medicines/:id/unlock-handover", unlockMedicineHandover);
router.get("/orders", getAdminOrders);
router.get("/users", getAdminUsers);
router.patch("/users/:id/verify", toggleUserVerification);
router.patch("/users/:id/role", updateUserRole);

// Partner verification routes
router.get("/partners", getAdminPartners);
router.patch("/partners/:id/verify", moderatePartner);

// Prescription verification & review routes
router.get("/prescriptions", getPrescriptions);
router.get("/prescriptions/:id", getPrescriptionById);
router.get("/prescriptions/:id/document", getPrescriptionDocument);
router.patch("/prescriptions/:id/approve", approvePrescription);
router.patch("/prescriptions/:id/reject", rejectPrescription);

export default router;

