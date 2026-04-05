import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            enum: ["Electricity", "Water", "Room", "Food", "Other"],
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "in-progress", "resolved"],
            default: "pending",
        },
    },
    { timestamps: true }
);

complaintSchema.index({ student: 1, createdAt: -1 });
complaintSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Complaint", complaintSchema);
