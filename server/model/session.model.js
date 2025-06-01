import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema(
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
    session_name: {
      type: String,
      required: true,
    },
    lastTimeStamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Session = mongoose.model("Session", SessionSchema);
export default Session;
