import express from "express";
import {
  createOrder,
  getMyOrders,
  getSellerOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
} from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All order routes are protected with JWT authentication
router.post("/", protect, createOrder);
router.get("/my-orders", protect, getMyOrders);
router.get("/seller-orders", protect, getSellerOrders);
router.get("/:id", protect, getOrderById);
router.patch("/:id/status", protect, updateOrderStatus);
router.patch("/:id/cancel", protect, cancelOrder);

export default router;
