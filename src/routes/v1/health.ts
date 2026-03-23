import express from "express";
import { check } from "../../middlewares/check";
import { healCheck } from "../../controllers/HealthController";

const router = express.Router();

router.get("/health", check, healCheck);

export default router;
