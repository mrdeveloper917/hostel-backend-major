import express from "express";
import { getMessages, sendMessage } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.post("/", sendMessage);
router.get("/:receiverId", getMessages);

export default router;
