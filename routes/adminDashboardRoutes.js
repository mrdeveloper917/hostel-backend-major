import express from "express";
import User from "../models/User.js";
import Room from "../models/Room.js";
import Complaint from "../models/Complaint.js";
import Fee from "../models/Fee.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, adminOnly, async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({ role: "student" });
        const totalRooms = await Room.countDocuments();

        const pendingComplaints = await Complaint.countDocuments({
            status: "pending",
        });

        const inProgressComplaints = await Complaint.countDocuments({
            status: "in-progress",
        });

        const resolvedComplaints = await Complaint.countDocuments({
            status: "resolved",
        });

        const currentMonth = new Date().toISOString().slice(0, 7);

        const monthlyFees = await Fee.find({ month: currentMonth });

        const totalRevenue = monthlyFees.reduce(
            (sum, fee) => sum + fee.paidAmount,
            0
        );

        res.json({
            admin: {
                name: req.user.name,
                email: req.user.email,
                profileImage: req.user.profileImage,
            },
            totalStudents,
            totalRooms,
            complaints: {
                pending: pendingComplaints,
                inProgress: inProgressComplaints,
                resolved: resolvedComplaints,
            },
            revenue: totalRevenue,
        });
    } catch (error) {
        res.status(500).json({ message: "Dashboard fetch failed" });
    }
});

export default router;