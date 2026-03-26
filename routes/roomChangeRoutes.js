import express from "express";
import RoomChangeRequest from "../models/RoomChangeRequest.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ================= STUDENT REQUEST ================= */
router.post("/", protect, async (req, res) => {
    try {
        const { preferredBlock, preferredFloor, reason } = req.body;

        const student = await User.findById(req.user.id);

        const request = await RoomChangeRequest.create({
            studentId: student._id,
            currentRoom: student.room,
            preferredBlock,
            preferredFloor: Number(preferredFloor),
            reason,
            status: "pending",
        });

        res.json({ success: true, request });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

/* ================= STUDENT VIEW OWN ================= */
router.get("/my", protect, async (req, res) => {
    const requests = await RoomChangeRequest.find({
        studentId: req.user.id,
    });

    res.json({ success: true, requests });
});

/* ================= ADMIN VIEW ================= */
router.get("/", protect, adminOnly, async (req, res) => {
    const requests = await RoomChangeRequest.find()
        .populate("studentId")
        .populate("currentRoom");

    res.json({ success: true, requests });
});

/* ================= ADMIN APPROVE ================= */
router.put("/:id/approve", protect, adminOnly, async (req, res) => {
    try {
        const request = await RoomChangeRequest.findById(req.params.id);
        if (!request || request.status !== "pending")
            return res.json({ success: false });

        const student = await User.findById(request.studentId);

        const newRoom = await Room.findOne({
            block: request.preferredBlock,
            floor: Number(request.preferredFloor),
            $expr: { $lt: ["$occupied", "$capacity"] },
        });

        if (!newRoom)
            return res.json({ success: false, message: "No room available" });

        const oldRoom = await Room.findById(student.room);

        if (oldRoom) {
            oldRoom.occupants.pull(student._id);
            oldRoom.occupied -= 1;
            oldRoom.status =
                oldRoom.occupied >= oldRoom.capacity ? "full" : "available";
            await oldRoom.save();
        }

        newRoom.occupants.push(student._id);
        newRoom.occupied += 1;
        newRoom.status =
            newRoom.occupied >= newRoom.capacity ? "full" : "available";
        await newRoom.save();

        student.room = newRoom._id;
        await student.save();

        request.status = "approved";
        await request.save();

        /* 🔥 REAL TIME EMIT */
        const io = req.app.get("io");
        io.to(student._id.toString()).emit("roomChangeStatus", {
            status: "approved",
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

/* ================= ADMIN REJECT ================= */
router.put("/:id/reject", protect, adminOnly, async (req, res) => {
    try {
        const request = await RoomChangeRequest.findById(req.params.id);
        if (!request || request.status !== "pending")
            return res.json({ success: false });

        request.status = "rejected";
        await request.save();

        /* 🔥 REAL TIME EMIT */
        const io = req.app.get("io");
        io.to(request.studentId.toString()).emit("roomChangeStatus", {
            status: "rejected",
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

export default router;