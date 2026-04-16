import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true },
    profileImage: { type: String, default: "" },
    role: {
      type: String,
      enum: ["admin", "student"],
      default: "student",
    },
    hostelName: { type: String, trim: true },
    roomNumber: { type: String, trim: true },
    floorNumber: { type: String, trim: true },
    branch: { type: String, trim: true },
    course: { type: String, trim: true },
    rollNo: { type: String, trim: true },
    phone: { type: String, trim: true },
    isSuperAdmin: { type: Boolean, default: false },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
    },
    resetOTP: { type: String, default: undefined },
    otpExpiry: { type: Date, default: undefined },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });
userSchema.index({ room: 1 });

export default mongoose.model("User", userSchema);
