import express from "express";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/my-fee", protect, async (req, res) => {
    try {
        // Example dummy data
        res.json({
            fee: {
                totalAmount: 50000,
                paidAmount: 20000,
                dueDate: "30-03-2026",
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;