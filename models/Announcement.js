import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        targetRole: {
            type: String,
            enum: ["student", "admin", "all"],
            default: "student",
        },
        block: {
            type: String,
            default: null, // optional block targeting
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Announcement", announcementSchema);