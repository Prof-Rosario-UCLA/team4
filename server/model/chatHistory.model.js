import mongoose from "mongoose";

const chatHistorySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    session_id: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["user", "agent", "system"], // Only allow these roles
        required: true,
    },
    content: { type: String, required: true }, // message content
    timestamp: { type: Date, default: Date.now }, // message time
  },
  { timestamps: true }
);

const ChatHistory = mongoose.model("ChatHistory", chatHistorySchema);
export default ChatHistory;
