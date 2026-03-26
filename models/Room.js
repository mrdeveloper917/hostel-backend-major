import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
    {
        block: {
            type: String,
            required: true,
        },

        floor: {
            type: Number,
            required: true,
        },

        roomNumber: {
            type: String,
            required: true,
        },

        capacity: {
            type: Number,
            required: true,
        },

        occupants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        status: {
            type: String,
            enum: ["available", "full"],
            default: "available",
        },
    },
    { timestamps: true }
);

export default mongoose.model("Room", roomSchema);