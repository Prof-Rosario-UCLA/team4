import express from "express";
import { getAllUsers, getUserByID } from "../controllers/userController.js";

const router = express.Router();

// API Refix: '/api/user'
router.get("/", getAllUsers);
router.get("/:id", getUserByID);

export default router;