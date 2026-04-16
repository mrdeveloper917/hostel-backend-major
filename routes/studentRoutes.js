import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Complaint from "../models/Complaint.js";
import Leave from "../models/Leave.js";
import Fee from "../models/Fee.js";
import Room from "../models/Room.js";
import Attendance from "../models/Attendance.js";
import Payment from "../models/Payment.js";
import RoomChangeRequest from "../models/RoomChangeRequest.js";
import Message from "../models/Message.js";
import { deleteUserByAdmin } from "../controllers/adminUserController.js";

const router = express.Router();

const normalizeProfileImage = (profileImage = "") => {
    if (!profileImage) return "";
    if (profileImage.startsWith("http://") || profileImage.startsWith("https://")) {
        return profileImage;
    }

    return `/${profileImage.replace(/^\/+/, "")}`;
};

const formatStudentProfile = (student) => ({
    _id: student._id,
    name: student.name,
    email: student.email,
    role: student.role,
    phone: student.phone || "",
    hostelName: student.hostelName || "",
    roomNumber: student.roomNumber || "",
    floorNumber: student.floorNumber || "",
    branch: student.branch || "",
    course: student.course || "",
    rollNo: student.rollNo || "",
    profileImage: normalizeProfileImage(student.profileImage),
    room: student.room || null,
    createdAt: student.createdAt,
    updatedAt: student.updatedAt,
});

/* ============================================================
   STUDENT DASHBOARD (STUDENT SIDE)
============================================================ */
router.get("/dashboard", protect, async (req, res) => {
    try {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const [student, complaintCount, leaveCount, fee] = await Promise.all([
            User.findById(req.user.id)
                .select(
                    "name email role phone hostelName roomNumber floorNumber branch course rollNo room profileImage createdAt updatedAt"
                )
                .populate("room", "roomNumber floor block capacity")
                .lean(),
            Complaint.countDocuments({
                student: req.user.id,
            }),
            Leave.countDocuments({
                student: req.user.id,
            }),
            Fee.findOne({
                student: req.user.id,
                month: currentMonth,
            }).lean(),
        ]);

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        res.json({
            user: {
                ...formatStudentProfile(student),
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

router.delete("/:id", protect, adminOnly, deleteUserByAdmin);

/* ============================================================
   GET ALL STUDENTS (ADMIN SIDE)
   ⚠️ IMPORTANT: This must be AFTER :id routes
============================================================ */
router.get("/", protect, adminOnly, async (req, res) => {
    try {
        const students = await User.find({ role: "student" })
            .select("name email role room profileImage createdAt updatedAt")
            .populate("room", "roomNumber floor block")
            .lean();

        const studentIds = students.map((student) => student._id);

        const [complaintCounts, leaveCounts, latestFees] = await Promise.all([
            Complaint.aggregate([
                { $match: { student: { $in: studentIds } } },
                { $group: { _id: "$student", count: { $sum: 1 } } },
            ]),
            Leave.aggregate([
                { $match: { student: { $in: studentIds } } },
                { $group: { _id: "$student", count: { $sum: 1 } } },
            ]),
            Fee.aggregate([
                { $match: { student: { $in: studentIds } } },
                { $sort: { createdAt: -1 } },
                {
                    $group: {
                        _id: "$student",
                        status: { $first: "$status" },
                    },
                },
            ]),
        ]);

        const complaintCountMap = new Map(
            complaintCounts.map((item) => [item._id.toString(), item.count])
        );
        const leaveCountMap = new Map(
            leaveCounts.map((item) => [item._id.toString(), item.count])
        );
        const feeStatusMap = new Map(
            latestFees.map((item) => [item._id.toString(), item.status])
        );

        const formattedStudents = students.map((student) => ({
            ...student,
            complaints: complaintCountMap.get(student._id.toString()) || 0,
            leaves: leaveCountMap.get(student._id.toString()) || 0,
            feeStatus: feeStatusMap.get(student._id.toString()) || "unpaid",
        }));

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
            .select(
                "name email role phone hostelName roomNumber floorNumber branch course rollNo room profileImage createdAt updatedAt"
            )
            .populate("room", "roomNumber floor block")
            .lean();

        if (!student) {
            return res.status(404).json({ message: "Profile not found" });
        }

        res.json({ student: formatStudentProfile(student) });
    } catch (error) {
        res.status(500).json({ message: "Profile fetch failed" });
    }
});

router.get("/support-admins", protect, async (req, res) => {
    try {
        const admins = await User.find({ role: "admin" })
            .select("name email role profileImage")
            .lean();

        res.json({ admins });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch admins" });
    }
});

export default router;
