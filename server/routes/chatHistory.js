import express from "express";
import { getChatHistory, updateChatHistory } from "../controllers/chatHistoryController.js";

const router = express.Router();

// API Prefix: '/api/chatHistory'
router.get("/:sessionId", getChatHistory);
router.post("/", updateChatHistory);

export default router;