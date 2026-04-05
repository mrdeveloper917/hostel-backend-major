import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        fromDate: {
            type: Date,
            required: true,
        },
        toDate: {
            type: Date,
            required: true,
        },
        reason: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
    },
    { timestamps: true }
);

leaveSchema.index({ student: 1, createdAt: -1 });
leaveSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Leave", leaveSchema);
