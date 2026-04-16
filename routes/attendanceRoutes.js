import express from "express";
import Attendance from "../models/Attendance.js";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/*
📱 SCAN QR
POST /api/attendance/scan
*/
/* ================= SCAN ATTENDANCE ================= */

router.post("/scan", protect, async (req, res) => {
    try {
        const { studentId } = req.body;

        if (!studentId) {
            return res.status(400).json({ message: "studentId is required" });
        }

        const student = await User.findById(studentId).select("_id role name");

        if (!student || student.role !== "student") {
            return res.status(404).json({ message: "Student not found" });
        }

        const lastRecord = await Attendance.findOne({ studentId }).sort({
            createdAt: -1,
        });

        const nextType = lastRecord?.type === "entry" ? "exit" : "entry";

        const attendance = await Attendance.create({
            studentId,
            type: nextType,
            scannedBy: req.user._id,
            timestamp: new Date(),
        });

        res.json({
            success: true,
            message: `${nextType === "entry" ? "Entry" : "Exit"} recorded`,
            attendance,
        });
    } catch (error) {
        console.log("Attendance Error:", error);
        res.status(500).json({ message: "Attendance failed" });
    }
});

/* ================= GET STUDENT ATTENDANCE ================= */

router.get("/my", protect, async (req, res) => {
    try {
        const records = await Attendance.find({
            studentId: req.user._id,
        }).sort({ createdAt: -1 });

        res.json({ records });
    } catch (error) {
        res.status(500).json({ message: "Fetch failed" });
    }
});

router.get("/analytics", protect, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const entriesToday = await Attendance.countDocuments({
            type: "entry",
            createdAt: { $gte: today },
        });

        const exitsToday = await Attendance.countDocuments({
            type: "exit",
            createdAt: { $gte: today },
        });

        // Students currently inside
        const students = await Attendance.aggregate([
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: "$studentId",
                    lastType: { $first: "$type" },
                },
            },
            {
                $match: { lastType: "entry" },
            },
        ]);

        res.json({
            success: true,
            entriesToday,
            exitsToday,
            currentlyInside: students.length,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});

export default router;
