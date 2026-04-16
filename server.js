import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import feeRoutes from "./routes/feeRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import razorpayRoutes from "./routes/razorypayRoutes.js";
import adminFeeRoutes from "./routes/adminFeeRoutes.js";
import adminDashboardRoutes from "./routes/adminDashboardRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import adminRoomRoutes from "./routes/adminRoomRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import roomChangeRoutes from "./routes/roomChangeRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import Message from "./models/Message.js";

dotenv.config();
connectDB();

const app = express();

app.set("trust proxy", 1);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/razorpay", razorpayRoutes);
app.use("/api/admin/fees", adminFeeRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin", adminUserRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/admin/rooms", adminRoomRoutes);
app.use("/api", announcementRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/room-change", roomChangeRoutes);
app.use("/api/messages", chatRoutes);

app.get("/", (req, res) => {
  res.send("Hostel Management Backend Running...");
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const io = new Server(server, {
  cors: { origin: "*" },
});

const onlineUsers = new Set();

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Authentication error"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    return next();
  } catch (error) {
    return next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  const userId = String(socket.userId);

  onlineUsers.add(userId);
  socket.join(userId);
  io.emit("onlineUsers", Array.from(onlineUsers));

  socket.on("sendMessage", async ({ receiverId, message }) => {
    try {
      const trimmedMessage = String(message || "").trim();
      const targetId = String(receiverId || "").trim();

      if (!trimmedMessage || !targetId) {
        return;
      }

      const msg = await Message.create({
        senderId: userId,
        receiverId: targetId,
        message: trimmedMessage,
        status: "delivered",
        timestamp: new Date(),
      });

      const populatedMessage = await Message.findById(msg._id)
        .populate("senderId", "name profileImage role")
        .populate("receiverId", "name profileImage role");

      io.to(targetId).emit("receiveMessage", populatedMessage);
      io.to(userId).emit("messageSent", populatedMessage);
    } catch (error) {
      console.error("SEND MESSAGE SOCKET ERROR:", error);
    }
  });

  socket.on("typing", ({ receiverId }) => {
    socket.to(String(receiverId || "")).emit("typing", { userId });
  });

  socket.on("stopTyping", ({ receiverId }) => {
    socket.to(String(receiverId || "")).emit("stopTyping", { userId });
  });

  socket.on("messageSeen", async ({ messageId, senderId }) => {
    try {
      await Message.findByIdAndUpdate(messageId, { status: "seen" });
      io.to(String(senderId || "")).emit("messageSeenUpdate", { messageId });
    } catch (error) {
      console.error("SEEN UPDATE ERROR:", error);
    }
  });

  socket.on("disconnect", () => {
    onlineUsers.delete(userId);
    io.emit("onlineUsers", Array.from(onlineUsers));
  });
});

app.set("io", io);
