import express from "express";
import Room from "../models/Room.js";
import User from "../models/User.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ============================================================
   1️⃣ ASSIGN ROOM BY ROOM ID
============================================================ */
router.post("/assign", protect, adminOnly, async (req, res) => {
    try {
        const { studentId, roomId } = req.body;

        if (!studentId || !roomId)
            return res.status(400).json({ message: "All fields required" });

        const student = await User.findById(studentId);
        const room = await Room.findById(roomId);

        if (!student)
            return res.status(404).json({ message: "Student not found" });

        if (!room)
            return res.status(404).json({ message: "Room not found" });

        if (room.occupants.length >= room.capacity)
            return res.status(400).json({ message: "Room is full" });

        /* ===== REMOVE FROM OLD ROOM ===== */
        if (student.room) {
            const oldRoom = await Room.findById(student.room);
            if (oldRoom) {
                oldRoom.occupants = oldRoom.occupants.filter(
                    (id) => id.toString() !== studentId
                );

                oldRoom.status =
                    oldRoom.occupants.length >= oldRoom.capacity
                        ? "full"
                        : "available";

                await oldRoom.save();
            }
        }

        /* ===== ASSIGN NEW ROOM ===== */
        student.room = room._id;
        await student.save();

        room.occupants.push(student._id);

        room.status =
            room.occupants.length >= room.capacity ? "full" : "available";

        await room.save();

        res.json({ message: "Room assigned successfully" });

    } catch (error) {
        console.error("Assign Error:", error);
        res.status(500).json({ message: "Assignment failed" });
    }
});

/* ============================================================
   2️⃣ MANUAL ROOM ASSIGN (AUTO CREATE IF NOT EXISTS)
============================================================ */
router.post("/manual-assign", protect, adminOnly, async (req, res) => {
    try {
        const { studentId, block, floor, roomNumber, capacity } = req.body;

        if (!studentId || !block || !floor || !roomNumber)
            return res.status(400).json({ message: "All fields required" });

        const student = await User.findById(studentId);
        if (!student)
            return res.status(404).json({ message: "Student not found" });

        /* ===== FIND EXISTING ROOM ===== */
        let room = await Room.findOne({ block, floor, roomNumber });

        /* ===== CREATE ROOM IF NOT EXISTS ===== */
        if (!room) {
            room = await Room.create({
                block,
                floor,
                roomNumber,
                capacity: capacity || 4,
                occupants: [],
                status: "available",
            });
        }

        if (room.occupants.length >= room.capacity)
            return res.status(400).json({ message: "Room is full" });

        /* ===== REMOVE FROM OLD ROOM ===== */
        if (student.room) {
            const oldRoom = await Room.findById(student.room);
            if (oldRoom) {
                oldRoom.occupants = oldRoom.occupants.filter(
                    (id) => id.toString() !== studentId
                );

                oldRoom.status =
                    oldRoom.occupants.length >= oldRoom.capacity
                        ? "full"
                        : "available";

                await oldRoom.save();
            }
        }

        /* ===== ASSIGN NEW ROOM ===== */
        student.room = room._id;
        await student.save();

        room.occupants.push(student._id);

        room.status =
            room.occupants.length >= room.capacity ? "full" : "available";

        await room.save();

        res.json({
            message: "Room manually assigned successfully",
            room,
        });

    } catch (error) {
        console.error("Manual Assign Error:", error);
        res.status(500).json({ message: "Manual assignment failed" });
    }
});

/* ============================================================
   3️⃣ REMOVE STUDENT FROM ROOM
============================================================ */
router.post("/remove", protect, adminOnly, async (req, res) => {
    try {
        const { studentId } = req.body;

        const student = await User.findById(studentId);
        if (!student || !student.room)
            return res.status(404).json({ message: "Student not assigned" });

        const room = await Room.findById(student.room);

        if (room) {
            room.occupants = room.occupants.filter(
                (id) => id.toString() !== studentId
            );

            room.status =
                room.occupants.length >= room.capacity
                    ? "full"
                    : "available";

            await room.save();
        }

        student.room = null;
        await student.save();

        res.json({ message: "Student removed from room" });

    } catch (error) {
        console.error("Remove Error:", error);
        res.status(500).json({ message: "Remove failed" });
    }
});

export default router;