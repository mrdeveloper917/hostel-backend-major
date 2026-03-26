import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: ["entry", "exit"],
            required: true,
        },
        scannedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // staff/admin
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Attendance", attendanceSchema);