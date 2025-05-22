import express from "express";
import { handleRefreshToken } from "../controllers/refreshTokenController.js";

const router = express.Router();

// API Refix: '/api/refresh'
router.get("/", handleRefreshToken);

export default router;
