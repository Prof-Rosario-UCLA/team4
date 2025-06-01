import ChatHistory from "../model/chatHistory.model.js";
import { redisClient } from "../config/db.js";

const getAllSessionsKey = (userId) => `sessions_list:${userId}`;
const getSessionMsgKey = (userId, sessionId) =>
  `sessionMsgs:${userId}:${sessionId}`; // Get the chatHistory belongs to this session

export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required!" });
    }

    const sessionCacheKey = getSessionMsgKey(userId, sessionId);

    // Try to get from cache first
    const cachedMessages = await redisClient.get(sessionCacheKey);

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
    await redisClient.set(sessionCacheKey, JSON.stringify(messages), {
      EX: 900,
    });

    // Return
    res.status(200).json(messages);
  } catch (err) {
    console.error("Error in getChatHistory:", err);
    res.status(500).json({ message: "Failed to fetch messages." });
  }
};

export const updateChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { role, content, session_id, session_name } = req.body;

    if (!role || !content || !session_id || !session_name) {
      return res.status(400).json({
        message: "Role, content, and session_id are required",
      });
    }

    const messageData = {
      user_id: userId,
      role,
      content,
      session_id,
      session_name: session_name,
      timestamp: new Date(),
    };

    // Save new message to database
    const newMessage = await ChatHistory.create(messageData);

    // Update cache: Add new message to existing cache
    const sessionCacheKey = getSessionMsgKey(userId, session_id);

    try {
      const cachedMessages = await redisClient.get(sessionCacheKey);
      if (cachedMessages) {
        const messages = JSON.parse(cachedMessages);
        messages.push(newMessage);

        const ttl = await redisClient.ttl(sessionCacheKey);
        if (ttl > 0) {
          await redisClient.set(sessionCacheKey, JSON.stringify(messages), {
            EX: ttl,
          });
        } else {
          await redisClient.set(sessionCacheKey, JSON.stringify(messages), {
            EX: 900,
          });
        }
      } else {
        console.log("📝 No existing session message cache found");
      }
    } catch (cacheError) {
      console.warn("⚠️ Cache update failed:", cacheError);
    }

    // Update sessions list cache
    const allSessionsKey = getAllSessionsKey(userId);
    try {
      const cachedSessions = await redisClient.get(allSessionsKey);

      if (cachedSessions) {
        const sessions = JSON.parse(cachedSessions);

        // Find and update the session
        const sessionIndex = sessions.findIndex(
          (s) => s.session_id === session_id
        );
        if (sessionIndex !== -1) {
          // Update session metadata
          sessions[sessionIndex].lastTimeStamp = newMessage.timestamp;

          // Move session to top (most recent)
          const updatedSession = sessions.splice(sessionIndex, 1)[0];
          sessions.unshift(updatedSession);

          const ttl = await redisClient.ttl(allSessionsKey);
          if (ttl > 0) {
            await redisClient.set(allSessionsKey, JSON.stringify(sessions), {
              EX: ttl,
            });
          } else {
            await redisClient.set(allSessionsKey, JSON.stringify(sessions), {
              EX: 900,
            });
          }
        } else {
          // Session not found in cache, invalidate to be safe
          await redisClient.del(allSessionsKey);
        }
      }
    } catch (cacheError) {
      console.warn(
        "Sessions list cache update failed, invalidating:",
        cacheError
      );
      // Fallback to invalidation if update fails
      await redisClient.del(allSessionsKey);
    }

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
