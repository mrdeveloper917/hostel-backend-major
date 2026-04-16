import User from "../models/User.js";
import Complaint from "../models/Complaint.js";
import Leave from "../models/Leave.js";
import Fee from "../models/Fee.js";
import Room from "../models/Room.js";
import Attendance from "../models/Attendance.js";
import Payment from "../models/Payment.js";
import RoomChangeRequest from "../models/RoomChangeRequest.js";
import Message from "../models/Message.js";

export const deleteUserByAdmin = async (req, res) => {
  try {
    const student = await User.findOne({
      _id: req.params.id,
      role: "student",
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (student.room) {
      const room = await Room.findById(student.room);

      if (room) {
        room.occupants = room.occupants.filter(
          (occupantId) => occupantId.toString() !== student._id.toString()
        );
        room.status = room.occupants.length >= room.capacity ? "full" : "available";
        await room.save();
      }
    }

    await Promise.all([
      Complaint.deleteMany({ student: student._id }),
      Leave.deleteMany({ student: student._id }),
      Fee.deleteMany({ student: student._id }),
      Attendance.deleteMany({ studentId: student._id }),
      Payment.deleteMany({ student: student._id }),
      RoomChangeRequest.deleteMany({ studentId: student._id }),
      Message.deleteMany({
        $or: [
          { senderId: student._id.toString() },
          { receiverId: student._id.toString() },
        ],
      }),
      student.deleteOne(),
    ]);

    return res.json({
      success: true,
      message: "User deleted",
      deletedUserId: req.params.id,
    });
  } catch (error) {
    console.error("Admin Delete User Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};
