import { Router } from "express";
import {
  createEmployee,
  getEmployee,
  getEmployees,
  updateEmployee,
} from "../services/employees/index.js";

const router = Router();

router.get("/", getEmployees);
router.post("/", createEmployee);
router.get("/:id", getEmployee);
router.put("/:id", updateEmployee);

export default router;
