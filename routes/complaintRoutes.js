import express from "express";
import Complaint from "../models/Complaint.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =======================================================
   🧑‍🎓 STUDENT — CREATE COMPLAINT
======================================================= */
router.post("/", protect, async (req, res) => {
    try {
        const { title, category, description } = req.body;

        if (!title || !description) {
            return res.status(400).json({ message: "All fields required" });
        }

        const complaint = await Complaint.create({
            student: req.user.id,
            title,
            category,
            description,
            status: "pending",
        });

        res.status(201).json({
            message: "Complaint submitted",
            complaint,
        });

    } catch (error) {
        res.status(500).json({ message: "Submission failed" });
    }
});


/* =======================================================
   🧑‍🎓 STUDENT — GET MY COMPLAINTS
   ⚠ MUST BE ABOVE "/" ROUTE
======================================================= */
router.get("/my", protect, async (req, res) => {
    try {
        const complaints = await Complaint.find({
            student: req.user.id,
        }).sort({ createdAt: -1 });

        res.json({ complaints });

    } catch (error) {
        res.status(500).json({ message: "Failed to fetch complaints" });
    }
});


/* =======================================================
   👨‍💼 ADMIN — GET ALL COMPLAINTS
======================================================= */
router.get("/", protect, adminOnly, async (req, res) => {
    try {
        const complaints = await Complaint.find()
            .populate("student", "name email")
            .sort({ createdAt: -1 });

        res.json({ complaints });

    } catch (error) {
        res.status(500).json({ message: "Failed to fetch complaints" });
    }
});


/* =======================================================
   👨‍💼 ADMIN — UPDATE STATUS + SOCKET EMIT
======================================================= */
router.put("/:id", protect, adminOnly, async (req, res) => {
    try {
        const { status } = req.body;

        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: "Complaint not found" });
        }

        complaint.status = status;
        await complaint.save();

        /* 🔥 SOCKET EMIT TO SPECIFIC STUDENT */
        const io = req.app.get("io");

        io.to(complaint.student.toString()).emit(
            "complaintUpdated",
            complaint
        );

        res.json({
            message: "Complaint updated",
            complaint,
        });

    } catch (error) {
        res.status(500).json({ message: "Update failed" });
    }
});

router.delete("/:id", protect, async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: "Complaint not found" });
        }

        const isAdmin = req.user.role === "admin";
        const isOwner = complaint.student.toString() === req.user.id;

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: "Not allowed to delete this complaint" });
        }

        await complaint.deleteOne();

        res.json({ message: "Complaint deleted" });
    } catch (error) {
        res.status(500).json({ message: "Delete failed" });
    }
});

export default router;
