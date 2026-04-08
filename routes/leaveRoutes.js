import express from "express";
import Leave from "../models/Leave.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

const parseLeavePayload = (body = {}) => {
    const fromDateRaw =
        body.fromDate ||
        body.startDate ||
        body.leaveFrom ||
        body.from ||
        "";
    const toDateRaw =
        body.toDate ||
        body.endDate ||
        body.leaveTo ||
        body.to ||
        "";
    const reason = (body.reason || body.message || body.description || "")
        .toString()
        .trim();

    return {
        fromDateRaw,
        toDateRaw,
        reason,
    };
};

/* ================= STUDENT APPLY LEAVE ================= */
router.post("/", protect, async (req, res) => {
    try {
        const { fromDateRaw, toDateRaw, reason } = parseLeavePayload(req.body);

        if (!fromDateRaw || !toDateRaw || !reason) {
            return res.status(400).json({ message: "All fields required" });
        }

        const fromDate = new Date(fromDateRaw);
        const toDate = new Date(toDateRaw);

        if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
            return res.status(400).json({ message: "Invalid leave dates" });
        }

        if (fromDate > toDate) {
            return res
                .status(400)
                .json({ message: "From date cannot be after to date" });
        }

        const overlappingLeave = await Leave.findOne({
            student: req.user.id,
            status: { $in: ["pending", "approved"] },
            fromDate: { $lte: toDate },
            toDate: { $gte: fromDate },
        }).lean();

        if (overlappingLeave) {
            return res.status(400).json({
                message: "You already have a leave request for these dates",
            });
        }

        const leave = await Leave.create({
            student: req.user.id,
            fromDate,
            toDate,
            reason,
        });

        res.status(201).json({ message: "Leave applied", leave });

    } catch (error) {
        console.error("Leave submit error:", error);
        res.status(500).json({
            message: error.message || "Leave submission failed",
        });
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
