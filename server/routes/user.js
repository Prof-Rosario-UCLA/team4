import express from "express";
import { getAllUsers, getUserByID } from "../controllers/userController.js";

const router = express.Router();

router.get("/", getAllUsers);
router.get("/:id", getUserByID);

export default router;