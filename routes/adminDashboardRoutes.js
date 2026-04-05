import express from "express";
import User from "../models/User.js";
import Room from "../models/Room.js";
import Complaint from "../models/Complaint.js";
import Fee from "../models/Fee.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, adminOnly, async (req, res) => {
    try {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const [
            totalStudents,
            totalRooms,
            pendingComplaints,
            inProgressComplaints,
            resolvedComplaints,
            monthlyRevenue,
        ] = await Promise.all([
            User.countDocuments({ role: "student" }),
            Room.countDocuments(),
            Complaint.countDocuments({ status: "pending" }),
            Complaint.countDocuments({ status: "in-progress" }),
            Complaint.countDocuments({ status: "resolved" }),
            Fee.aggregate([
                { $match: { month: currentMonth } },
                { $group: { _id: null, totalRevenue: { $sum: "$paidAmount" } } },
            ]),
        ]);

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
            revenue: monthlyRevenue[0]?.totalRevenue || 0,
        });
    } catch (error) {
        res.status(500).json({ message: "Dashboard fetch failed" });
    }
});

export default router;
