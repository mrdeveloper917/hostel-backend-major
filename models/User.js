import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  // 🖼️ Profile Image
  profileImage: { type: String, default: "" },

  // 👤 Role
  role: {
    type: String,
    enum: ["admin", "student"],
    default: "student",
  },

  // 🏠 Hostel Details (ONLY for students)
  hostelName: { type: String },
  roomNumber: { type: String },
  floorNumber: { type: String },

  // 🎓 Academic Details (student)
  branch: { type: String },
  course: { type: String },
  rollNo: { type: String },

  // 📞 Extra
  phone: { type: String },

  // 🔥 Admin Features
  isSuperAdmin: { type: Boolean, default: false },

  // 🔗 Room Reference
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
  },
},
{ timestamps: true }
);

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ room: 1 });

export default mongoose.model("User", userSchema);