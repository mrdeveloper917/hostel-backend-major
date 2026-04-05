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

roomSchema.index({ block: 1, floor: 1, roomNumber: 1 }, { unique: true });
roomSchema.index({ occupants: 1 });
roomSchema.index({ status: 1 });

export default mongoose.model("Room", roomSchema);
