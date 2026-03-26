import express from "express";
import Fee from "../models/Fee.js";
import Payment from "../models/Payment.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Settings from "../models/Settings.js";

const router = express.Router();

// 📊 Get Dashboard Stats
router.get("/stats", protect, adminOnly, async (req, res) => {
    const totalFees = await Fee.aggregate([
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const totalPaid = await Payment.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.json({
        totalFees: totalFees[0]?.total || 0,
        totalPaid: totalPaid[0]?.total || 0,
    });
});

// Set Monthly Rent
router.post("/set-monthly-rent", protect, adminOnly, async (req, res) => {
    const { amount } = req.body;

    let settings = await Settings.findOne();

    if (!settings) {
        settings = await Settings.create({ monthlyRent: amount });
    } else {
        settings.monthlyRent = amount;
        await settings.save();
    }

    res.json({ message: "Monthly rent updated" });
});

router.post("/generate-monthly-fees", protect, adminOnly, async (req, res) => {
    const settings = await Settings.findOne();
    if (!settings) return res.status(400).json({ message: "Monthly rent not set" });

    const month = new Date().toISOString().slice(0, 7); // YYYY-MM

    const students = await User.find({ role: "student" });

    for (let student of students) {
        const existing = await Fee.findOne({ student: student._id, month });

        if (!existing) {
            await Fee.create({
                student: student._id,
                month,
                totalAmount: settings.monthlyRent,
                dueDate: new Date(new Date().setDate(10)),
            });
        }
    }

    res.json({ message: "Monthly fees generated successfully" });
});

// 📋 Get All Students Fee
router.get("/all", protect, adminOnly, async (req, res) => {
    const fees = await Fee.find().populate("student", "name email");
    res.json({ fees });
});

// 💰 Get All Payments
router.get("/payments", protect, adminOnly, async (req, res) => {
    const payments = await Payment.find()
        .populate("student", "name email")
        .sort({ createdAt: -1 });

    res.json({ payments });
});

// 🔎 Search Students
router.get("/students", protect, adminOnly, async (req, res) => {
    const { search } = req.query;

    const students = await User.find({
        role: "student",
        $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
        ],
    }).select("name email");

    res.json({ students });
});


// ➕ Assign Fee Manually
router.post("/assign", protect, adminOnly, async (req, res) => {
    const { studentId, totalAmount, dueDate } = req.body;

    const existing = await Fee.findOne({ student: studentId });

    if (existing) {
        existing.totalAmount = totalAmount;
        existing.dueDate = dueDate;
        await existing.save();
        return res.json({ message: "Fee updated successfully" });
    }

    await Fee.create({
        student: studentId,
        totalAmount,
        paidAmount: 0,
        dueDate,
    });

    res.json({ message: "Fee assigned successfully" });
});

export default router;