import { Router } from "express";
import { createRole, getRoles } from "../services/roles/index.js";

const router = Router();

router.get("/", getRoles);
router.post("/", createRole);

export default router;
