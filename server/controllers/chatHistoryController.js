import ChatHistory from "../model/chatHistory.model.js";
import { redisClient } from "../config/db.js";

const getSessionCacheKey = (userId, sessionId) => `session:${userId}:${sessionId}`;
const getAllSessionsKey = (userId) => `sessions_list:${userId}`;

export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const { sessionId } = req.params; // Each chat is a session
    console.log("sessionID: ", sessionId);
    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required!" });
    }

    const sessionCacheKey = getSessionCacheKey(userId, sessionId);

    // Try to get from cache first
    const cachedMessages = await redisClient.get(sessionCacheKey);

    console.log("Cached messages: ", cachedMessages);
    if (cachedMessages) {
      return res.status(200).json(JSON.parse(cachedMessages));
    }

    // If not in cache, fetch from database
    const messages = await ChatHistory.find({
      user_id: userId,
      session_id: sessionId,
    }).sort({
      timestamp: 1,
    });

    if (!messages || messages.length === 0)
      return res
        .status(204)
        .json({ message: "No messages found for this session" });

    // Cache this results for 15 minutes
    await redisClient.set(sessionCacheKey, JSON.stringify(messages), { EX: 900 });

    console.log("Messages (not from cache: ", messages);
    // Return
    res.status(200).json(messages);
  } catch (err) {
    console.error("Error in getChatHistory:", err);
    res.status(500).json({ message: "Failed to fetch messages." });
  }
};

export const getAllSessions = async (req, res) => {
  try {
    const userId = req.user._id;
    const cacheKey = getAllSessionsKey(userId);

    // Check cache first
    const cachedSessions = await redisClient.get(cacheKey);
    if (cachedSessions) return res.status(200).json(JSON.parse(cachedSessions));

    // Get unique sessions with latest message from each
    const sessions = await ChatHistory.aggregate([
      { $match: { user_id: userId } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$session_id",
          lastMessage: { $first: "$content" },
          lastTimeStamp: { $first: "$timestamp" },
          messageCount: { $sum: 1 },
        },
      },
      { $sort: { lastTimeStamp: -1 } },
    ]);

    // Cache for 5 minutes
    await redisClient.set(cacheKey, JSON.stringify(sessions), { EX: 300 });

    // Return
    res.status(200).json(sessions);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch sessions." });
  }
};


export const updateChatHistory = async (req, res) => {
  console.log("🚀 updateChatHistory function called!");
  console.log("📝 Request method:", req.method);
  console.log("📍 Request URL:", req.originalUrl);
  
  try {
    const userId = req.user._id;
    console.log("👤 User ID:", userId);
    
    const { role, content, session_id, session_name } = req.body;
    console.log("📦 Full request body:", JSON.stringify(req.body, null, 2));
    console.log("🔍 Extracted fields:");
    console.log("  - role:", role);
    console.log("  - content:", content);
    console.log("  - session_id:", session_id);
    console.log("  - session_name:", session_name);

    if (!role || !content || !session_id || !session_name) {
      console.log("❌ Validation failed!");
      console.log("Missing required fields:", { 
        role: !!role, 
        content: !!content, 
        session_id: !!session_id, 
        session_name: !!session_name
      });
      return res.status(400).json({ 
        message: "Role, content, and session_id are required" 
      });
    }

    console.log("✅ Validation passed!");

    const messageData = {
      user_id: userId,
      role,
      content,
      session_id,
      session_name: session_name,
      timestamp: new Date(),
    };
    
    console.log("💾 Saving message data:", JSON.stringify(messageData, null, 2));

    // Save new message to database
    const newMessage = await ChatHistory.create(messageData);
    console.log("✅ Successfully created message with ID:", newMessage._id);

    // Update cache: Add new message to existing cache
    const sessionCacheKey = getSessionCacheKey(userId, session_id);
    console.log("🔄 Updating cache with key:", sessionCacheKey);

    try {
      const cachedMessages = await redisClient.get(sessionCacheKey);
      if (cachedMessages) {
        console.log("📤 Found existing cache, updating...");
        const messages = JSON.parse(cachedMessages);
        messages.push(newMessage);

        const ttl = await redisClient.ttl(sessionCacheKey);
        if (ttl > 0) {
          await redisClient.set(sessionCacheKey, JSON.stringify(messages), { EX: ttl });
        } else {
          await redisClient.set(sessionCacheKey, JSON.stringify(messages), { EX: 900 });
        }
        console.log("✅ Cache updated successfully");
      } else {
        console.log("📝 No existing cache found");
      }
    } catch (cacheError) {
      console.warn("⚠️ Cache update failed:", cacheError);
    }

    // For sessions list, we invalidate because aggregation is complex
    await redisClient.del(getAllSessionsKey(userId));
    console.log("🗑️ Invalidated sessions list cache");

    console.log("🎉 Sending successful response");
    res.status(201).json({ message: newMessage });
  } catch (err) {
    console.error("💥 Error in updateChatHistory:", err);
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
