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

roomChangeSchema.index({ studentId: 1, createdAt: -1 });
roomChangeSchema.index({ status: 1, createdAt: -1 });
roomChangeSchema.index({ preferredBlock: 1, preferredFloor: 1, status: 1 });

export default mongoose.model("RoomChangeRequest", roomChangeSchema);
