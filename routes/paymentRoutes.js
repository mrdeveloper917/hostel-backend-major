import express from "express";
import Payment from "../models/Payment.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/history", protect, async (req, res) => {
    const payments = await Payment.find({
        student: req.user.id,
    }).sort({ date: -1 });

    res.json({ payments });
});

export default router;