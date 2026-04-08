import express from "express";
import RoomChangeRequest from "../models/RoomChangeRequest.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { findRoomByStudentDetails, syncStudentRoom } from "../utils/roomSync.js";

const router = express.Router();

/* ================= STUDENT REQUEST ================= */
router.post("/", protect, async (req, res) => {
    try {
        const { preferredBlock, preferredFloor, reason } = req.body;
        const parsedFloor = Number(preferredFloor);

        if (!preferredBlock || Number.isNaN(parsedFloor) || !reason?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Preferred block, floor and reason are required",
            });
        }

        const student = await User.findById(req.user._id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
            });
        }

        if (!student.room) {
            const matchedRoom = await findRoomByStudentDetails(student);
            if (matchedRoom) {
                await syncStudentRoom(student);
                await student.save();
            }
        }

        const request = await RoomChangeRequest.create({
            studentId: req.user._id,
            currentRoom: student.room || null,
            preferredBlock: preferredBlock.trim(),
            preferredFloor: parsedFloor,
            reason: reason.trim(),
            status: "pending",
        });

        res.json({ success: true, request });
    } catch (error) {
        console.error("Room change create error:", error);
        res.status(500).json({
            success: false,
            message: "Room change request failed",
        });
    }
});

/* ================= STUDENT VIEW OWN ================= */
router.get("/my", protect, async (req, res) => {
    try {
        const requests = await RoomChangeRequest.find({
            studentId: req.user.id,
        })
            .populate("currentRoom", "block floor roomNumber")
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, requests });
    } catch (error) {
        console.error("Room change fetch error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch room change requests",
        });
    }
});

/* ================= ADMIN VIEW ================= */
router.get("/", protect, adminOnly, async (req, res) => {
    try {
        const requests = await RoomChangeRequest.find()
            .populate("studentId", "name email room")
            .populate("currentRoom", "block floor roomNumber")
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, requests });
    } catch (error) {
        console.error("Admin room change fetch error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch room change requests",
        });
    }
});

/* ================= ADMIN APPROVE ================= */
router.put("/:id/approve", protect, adminOnly, async (req, res) => {
    try {
        const request = await RoomChangeRequest.findById(req.params.id);
        if (!request || request.status !== "pending")
            return res.json({ success: false });

        const student = await User.findById(request.studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
            });
        }

        if (!student.room) {
            const matchedRoom = await findRoomByStudentDetails(student);
            if (matchedRoom) {
                await syncStudentRoom(student);
                await student.save();
            }
        }

        const newRoom = await Room.findOne({
            block: request.preferredBlock,
            floor: Number(request.preferredFloor),
            status: "available",
        });

        if (!newRoom)
            return res.json({ success: false, message: "No room available" });

        const oldRoom = await Room.findById(student.room);

        if (oldRoom) {
            oldRoom.occupants.pull(student._id);
            oldRoom.status =
                oldRoom.occupants.length >= oldRoom.capacity
                    ? "full"
                    : "available";
            await oldRoom.save();
        }

        newRoom.occupants.push(student._id);
        newRoom.status =
            newRoom.occupants.length >= newRoom.capacity ? "full" : "available";
        await newRoom.save();

        student.room = newRoom._id;
        student.hostelName = newRoom.block;
        student.floorNumber = String(newRoom.floor);
        student.roomNumber = newRoom.roomNumber;
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
        console.error("Room change approve error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to approve room change",
        });
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
        console.error("Room change reject error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to reject room change",
        });
    }
});

export default router;
