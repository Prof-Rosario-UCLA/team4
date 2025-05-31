import express from "express";
import { getChatHistory, getAllSessions, updateChatHistory } from "../controllers/chatHistoryController.js";

const router = express.Router();

// API Refix: '/api/chatHistory'
router.get("/sessions", getAllSessions);
router.get("/:sessionId", getChatHistory);
router.post("/", updateChatHistory);

export default router;