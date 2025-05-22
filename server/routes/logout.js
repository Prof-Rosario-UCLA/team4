import express from "express";
import { handleLogout } from "../controllers/logoutController.js";

const router = express.Router();

// API Refix: '/api/logout'
router.get("/", handleLogout);

export default router;
