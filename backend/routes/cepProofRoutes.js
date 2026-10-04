import express from "express";
import { getCepProofs } from "../controllers/cepProofController.js";

const router = express.Router();

router.get("/", getCepProofs);

export default router;
