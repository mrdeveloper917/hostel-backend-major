import express from "express";
import Leave from "../models/Leave.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ================= STUDENT APPLY LEAVE ================= */
router.post("/", protect, async (req, res) => {
    try {
        const { fromDate, toDate, reason } = req.body;

        if (!fromDate || !toDate || !reason) {
            return res.status(400).json({ message: "All fields required" });
        }

        const leave = await Leave.create({
            student: req.user.id,
            fromDate,
            toDate,
            reason,
        });

        res.status(201).json({ message: "Leave applied", leave });

    } catch (error) {
        res.status(500).json({ message: "Leave submission failed" });
    }
});

/* ================= STUDENT MY LEAVES ================= */
router.get("/my", protect, async (req, res) => {
    const leaves = await Leave.find({ student: req.user.id })
        .sort({ createdAt: -1 });

    res.json({ leaves });
});

/* ================= ADMIN ALL LEAVES ================= */
router.get("/", protect, adminOnly, async (req, res) => {
    const leaves = await Leave.find()
        .populate("student", "name email")
        .sort({ createdAt: -1 });

    res.json({ leaves });
});

/* ================= ADMIN UPDATE STATUS ================= */
router.put("/:id", protect, adminOnly, async (req, res) => {
    const { status } = req.body;

    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Not found" });

    leave.status = status;
    await leave.save();

    // 🔥 Socket Emit
    const io = req.app.get("io");
    io.to(leave.student.toString()).emit("leaveUpdated", leave);

    res.json({ message: "Leave updated", leave });
});

export default router;