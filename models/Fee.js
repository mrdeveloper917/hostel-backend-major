import mongoose from "mongoose";

const feeSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        month: {
            type: String,
            required: true,
            default: () => new Date().toISOString().slice(0, 7), // ✅ AUTO MONTH
        },

        totalAmount: {
            type: Number,
            required: true,
        },

        paidAmount: {
            type: Number,
            default: 0,
        },

        status: {
            type: String,
            enum: ["paid", "partial", "unpaid"],
            default: "unpaid",
        },

        dueDate: {
            type: Date,
        },
    },
    { timestamps: true }
);

feeSchema.index({ student: 1, month: 1 }, { unique: true });
feeSchema.index({ month: 1 });
feeSchema.index({ student: 1, createdAt: -1 });

export default mongoose.model("Fee", feeSchema);
