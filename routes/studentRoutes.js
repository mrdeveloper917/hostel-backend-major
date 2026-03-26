import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Complaint from "../models/Complaint.js";
import Leave from "../models/Leave.js";
import Fee from "../models/Fee.js";

const router = express.Router();

/* ============================================================
   STUDENT DASHBOARD (STUDENT SIDE)
============================================================ */
router.get("/dashboard", protect, async (req, res) => {
    try {
        const student = await User.findById(req.user.id)
            .select("-password")
            .populate("room", "roomNumber floor block capacity");

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        const complaintCount = await Complaint.countDocuments({
            student: req.user.id,
        });

        const leaveCount = await Leave.countDocuments({
            student: req.user.id,
        });

        const currentMonth = new Date().toISOString().slice(0, 7);

        const fee = await Fee.findOne({
            student: req.user.id,
            month: currentMonth,
        });

        res.json({
            user: {
                _id: student._id,
                name: student.name,
                email: student.email,
                room: student.room || null,
                complaints: complaintCount,
                leaves: leaveCount,
                fee: fee || null,
            },
        });
    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ message: "Dashboard fetch failed" });
    }
});

/* ============================================================
   GET STUDENT COMPLAINTS (ADMIN SIDE)
============================================================ */
router.get("/:id/complaints", protect, adminOnly, async (req, res) => {
    try {
        const complaints = await Complaint.find({
            student: req.params.id,
        }).sort({ createdAt: -1 });

        res.json({ complaints });
    } catch (error) {
        console.error("Complaint Fetch Error:", error);
        res.status(500).json({ message: "Failed to fetch complaints" });
    }
});

/* ============================================================
   GET STUDENT LEAVES (ADMIN SIDE)
============================================================ */
router.get("/:id/leaves", protect, adminOnly, async (req, res) => {
    try {
        const leaves = await Leave.find({
            student: req.params.id,
        }).sort({ createdAt: -1 });

        res.json({ leaves });
    } catch (error) {
        console.error("Leave Fetch Error:", error);
        res.status(500).json({ message: "Failed to fetch leaves" });
    }
});

/* ============================================================
   GET ALL STUDENTS (ADMIN SIDE)
   ⚠️ IMPORTANT: This must be AFTER :id routes
============================================================ */
router.get("/", protect, adminOnly, async (req, res) => {
    try {
        const students = await User.find({ role: "student" })
            .select("-password")
            .populate("room", "roomNumber floor block");

        const formattedStudents = await Promise.all(
            students.map(async (student) => {
                const complaints = await Complaint.countDocuments({
                    student: student._id,
                });

                const leaves = await Leave.countDocuments({
                    student: student._id,
                });

                const fee = await Fee.findOne({
                    student: student._id,
                }).sort({ createdAt: -1 });

                return {
                    ...student._doc,
                    complaints,
                    leaves,
                    feeStatus: fee?.status || "unpaid",
                };
            })
        );

        res.json({ students: formattedStudents });
    } catch (error) {
        console.error("Student Fetch Error:", error);
        res.status(500).json({ message: "Failed to fetch students" });
    }
});

/* ============================================================
   GET MY PROFILE
============================================================ */
router.get("/me", protect, async (req, res) => {
    try {
        const student = await User.findById(req.user.id)
            .select("-password")
            .populate("room", "roomNumber floor block");

        res.json({ student });
    } catch (error) {
        res.status(500).json({ message: "Profile fetch failed" });
    }
});

export default router;