import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  senderId: String,
  receiverId: String,
  message: String,

  status: {
    type: String,
    enum: ["sent", "delivered", "seen"],
    default: "sent",
  },

  isDeleted: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Message", messageSchema);