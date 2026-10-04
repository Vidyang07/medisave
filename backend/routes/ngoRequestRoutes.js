import express from "express";
import { getNgoRequests, fulfillNgoRequest } from "../controllers/ngoRequestController.js";

const router = express.Router();

router.get("/", getNgoRequests);
router.post("/:id/fulfill", fulfillNgoRequest);

export default router;
