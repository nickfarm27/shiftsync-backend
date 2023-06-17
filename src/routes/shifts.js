import { Router } from "express";
import {
  createShift,
  getShift,
  getShifts,
  getShiftsByDate,
  updateShift,
} from "../services/shifts/index.js";

const router = Router();

router.post("/", createShift);
router.get("/", getShifts);
router.get("/:date", getShiftsByDate);
router.get("/:id", getShift);
router.put("/:id", updateShift);

export default router;
