import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
    monthlyRent: {
        type: Number,
        required: true,
    },
});

export default mongoose.model("Settings", settingsSchema);