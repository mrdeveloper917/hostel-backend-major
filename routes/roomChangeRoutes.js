import mongoose from "mongoose";

const roomChangeSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        currentRoom: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
        },
        preferredBlock: String,
        preferredFloor: Number,
        reason: String,
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
    },
    { timestamps: true }
);

export default mongoose.model("RoomChangeRequest", roomChangeSchema);