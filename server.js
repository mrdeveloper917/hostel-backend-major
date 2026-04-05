import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

/* ================= LOAD ENV ================= */
dotenv.config();

/* ================= CONNECT DB ================= */
connectDB();

/* ================= IMPORT ROUTES ================= */
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
import announcementRoutes from "./routes/announcementRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import roomChangeRoutes from "./routes/roomChangeRoutes.js";

/* 🔥 IMPORT MESSAGE MODEL */
import Message from "./models/Message.js";

/* ================= APP INIT ================= */
const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

/* ================= ROUTES ================= */
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/razorpay", razorpayRoutes);
app.use("/api/admin/fees", adminFeeRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/admin/rooms", adminRoomRoutes);
app.use("/api", announcementRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/room-change", roomChangeRoutes);

/* ================= CHAT HISTORY API ================= */
app.get("/api/messages/:receiverId", async (req, res) => {
    try {
        const userId = req.user?.id || req.headers.userid; // fallback
        const { receiverId } = req.params;

        const messages = await Message.find({
            $or: [
                { senderId: userId, receiverId },
                { senderId: receiverId, receiverId: userId },
            ],
        }).sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: "Error fetching messages" });
    }
});

app.get("/", (req, res) => {
    res.send("Hostel Management Backend Running...");
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

/* ================= SOCKET.IO ================= */
const io = new Server(server, {
    cors: { origin: "*" },
});

/* 🔐 SOCKET AUTH (JWT) */
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) return next(new Error("Authentication error"));

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        next();
    } catch {
        next(new Error("Authentication error"));
    }
});

/* ================= SOCKET CONNECTION ================= */
io.on("connection", (socket) => {
    console.log("User connected:", socket.userId);

    // Join personal room
    socket.join(socket.userId);

    /* 💬 SEND MESSAGE */
    socket.on("sendMessage", async ({ receiverId, message }) => {
        try {
            const newMessage = new Message({
                senderId: socket.userId,
                receiverId,
                message,
            });

            await newMessage.save();

            // Send to receiver
            io.to(receiverId).emit("receiveMessage", newMessage);

            // Send back to sender (optional for sync)
            socket.emit("messageSent", newMessage);

        } catch (error) {
            console.error("Message error:", error);
        }
    });

    /* 🔵 TYPING INDICATOR */
    socket.on("typing", ({ receiverId }) => {
        socket.to(receiverId).emit("typing", {
            senderId: socket.userId,
        });
    });

    socket.on("stopTyping", ({ receiverId }) => {
        socket.to(receiverId).emit("stopTyping");
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.userId);
    });
});

/* ================= MAKE IO GLOBAL ================= */
app.set("io", io);