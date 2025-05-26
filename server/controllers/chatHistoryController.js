import ChatHistory from "../model/chatHistory.model.js";

export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const messages = await ChatHistory.find({ user_id: userId }).sort({
      timestamp: 1,
    });
    if (!messages)
      return res.status(204).json({ message: "No messages found" });
    res.status(200).json(messages);
  } catch (err) {
    console.error("Error in getChatHistory:", err);
    res.status(500).json({ message: "Failed to fetch messages." });
  }
};

export const updateChatHistory = async (req, res) => {
  try {
    console.log("Received request body:", req.body);
    console.log("User from request:", req.user);

    const userId = req.user._id;
    console.log(req.user._id);
    const { role, content, session_id } = req.body;

    if (!role || !content) {
      console.log("Missing required fields:", { role, content });
      return res.status(400).json({ message: "Role and content are required" });
    }

    if (!userId) {
      console.log("No user ID found in request");
      return res.status(401).json({ message: "User not authenticated" });
    }

    const messageData = {
      user_id: userId,
      role,
      content,
      session_id,
    };

    console.log("Creating message with data:", messageData);

    const msg = await ChatHistory.create(messageData);
    console.log("Message created successfully:", msg);

    res.status(201).json({ message: msg });
  } catch (err) {
    console.error("Error saving message:", err);
    console.error("Error details:", {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({
      error: "Failed to send message",
      details: err.message,
    });
  }
};
