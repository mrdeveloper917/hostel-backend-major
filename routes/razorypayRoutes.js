import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import Payment from "../models/Payment.js";
import Fee from "../models/Fee.js";
import { protect } from "../middleware/authMiddleware.js";

dotenv.config();

const router = express.Router();

/* ================= Razorpay Setup ================= */

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET) {
    throw new Error("Razorpay keys missing in .env file");
}

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
});

/* ================= CREATE ORDER ================= */

router.post("/create-order", protect, async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid amount" });
        }

        const order = await razorpay.orders.create({
            amount: amount * 100,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        });

        res.json({ order });

    } catch (error) {
        console.error("Create Order Error:", error);
        res.status(500).json({ message: "Order creation failed" });
    }
});

/* ================= VERIFY PAYMENT ================= */

router.post("/verify", protect, async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            amount,
        } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_SECRET)
            .update(body)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Invalid signature",
            });
        }

        /* ========= SAVE PAYMENT ========= */

        await Payment.create({
            student: req.user.id,
            amount,
            paymentId: razorpay_payment_id,
            status: "success",
        });

        /* ========= UPDATE MONTHLY FEE ========= */

        const currentMonth = new Date().toISOString().slice(0, 7);

        const fee = await Fee.findOne({
            student: req.user.id,
            month: currentMonth,
        });

        if (fee) {
            fee.paidAmount += amount;

            if (fee.paidAmount >= fee.totalAmount) {
                fee.status = "paid";
            } else {
                fee.status = "partial";
            }

            await fee.save();
        }

        res.json({ success: true });

    } catch (error) {
        console.error("Payment Verify Error:", error);
        res.status(500).json({
            message: "Payment verification failed",
        });
    }
});

export default router;