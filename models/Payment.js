import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    amount: Number,
    paymentId: String,
    status: {
        type: String,
        enum: ["success", "failed"],
        default: "success",
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

paymentSchema.index({ student: 1, date: -1 });

export default mongoose.model("Payment", paymentSchema);
