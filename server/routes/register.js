import express from "express";
import { handleNewUser } from "../controllers/registerController.js";

const router = express.Router();

// API Refix: '/api/register'
router.post("/", handleNewUser);

export default router;
