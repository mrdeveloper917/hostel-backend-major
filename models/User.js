import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
{
name: { type: String, required: true },
email: { type: String, required: true, unique: true },
password: { type: String, required: true },

role: {
type: String,
enum: ["admin", "student"],
default: "student",
},

room: {
type: mongoose.Schema.Types.ObjectId,
ref: "Room",
},
},
{ timestamps: true }
);

userSchema.index({ role: 1 });
userSchema.index({ room: 1 });

export default mongoose.model("User", userSchema);
