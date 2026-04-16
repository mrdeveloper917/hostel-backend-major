import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { deleteUserByAdmin } from "../controllers/adminUserController.js";

const router = express.Router();

router.delete("/delete-user/:id", protect, adminOnly, deleteUserByAdmin);

export default router;
