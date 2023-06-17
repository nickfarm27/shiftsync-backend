import { Router } from "express";
import { requestAvailabilities } from "../services/availabilities/index.js";

const router = Router();

router.post("/:date/request_availabilities", requestAvailabilities);

export default router;
