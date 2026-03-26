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

export default mongoose.model("Payment", paymentSchema);