import express from "express";
import { getChatHistory, updateChatHistory } from "../controllers/chatHistoryController.js";

const router = express.Router();

// API Refix: '/api/chatHistory'
router.get("/", getChatHistory);
router.post("/", updateChatHistory);

export default router;