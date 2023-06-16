import { Router } from "express";
import {
  createShift,
  getShift,
  getShifts,
  updateShift,
} from "../services/shifts/index.js";

const router = Router();

router.post("/", createShift);
router.get("/", getShifts);
router.get("/:id", getShift);
router.put("/:id", updateShift);

export default router;
