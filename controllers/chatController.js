import mongoose from "mongoose";
import Message from "../models/Message.js";

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const receiverId = String(req.body.receiverId || "").trim();
    const message = String(req.body.message || "").trim();

    if (!receiverId || !message) {
      return res.status(400).json({
        success: false,
        message: "Receiver and message are required.",
      });
    }

    if (!isValidObjectId(receiverId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid receiver id.",
      });
    }

    const chatMessage = await Message.create({
      senderId,
      receiverId,
      message,
      status: "sent",
      timestamp: new Date(),
    });

    const populatedMessage = await Message.findById(chatMessage._id)
      .populate("senderId", "name profileImage role")
      .populate("receiverId", "name profileImage role");

    const io = req.app.get("io");
    if (io) {
      io.to(receiverId).emit("receiveMessage", populatedMessage);
      io.to(senderId).emit("messageSent", populatedMessage);
    }

    return res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      data: populatedMessage,
    });
  } catch (error) {
    console.error("SEND MESSAGE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to send message right now.",
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const receiverId = String(req.params.receiverId || "").trim();

    if (!isValidObjectId(receiverId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid receiver id.",
      });
    }

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId },
        { senderId: receiverId, receiverId: userId },
      ],
    })
      .populate("senderId", "name profileImage role")
      .populate("receiverId", "name profileImage role")
      .sort({ timestamp: 1, createdAt: 1 });

    return res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("GET MESSAGES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch messages right now.",
    });
  }
};
