import express from "express";
import {
  getAllSessions,
  createSession,
} from "../controllers/sessionController.js";

const router = express.Router();

// API prefix: '/api/session'
router.get("/", getAllSessions);
router.post("/", createSession);

export default router;
