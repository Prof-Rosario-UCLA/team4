import express from "express";
import { handleLogin } from "../controllers/authController.js";

const router = express.Router();

// API Refix: '/api/auth'
router.post("/", handleLogin);

export default router;
