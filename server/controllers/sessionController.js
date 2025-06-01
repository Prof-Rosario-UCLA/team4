import Session from "../model/session.model.js";
import { redisClient } from "../config/db.js";

const getAllSessionsKey = (userId) => `sessions_list:${userId}`;
const getSessionInfoKey = (userId, sessionId) =>
  `sessionInfo:${userId}:${sessionId}`;

/*
Session structure:
  session_id: newSessionId,
  session_name: autoSessionName,
  lastTimestamp: new Date(),
  messageCount: 0,
*/

export const getAllSessions = async (req, res) => {
  try {
    const userId = req.user._id;
    const cacheKey = getAllSessionsKey(userId);

    // Check cache first
    const cachedSessions = await redisClient.get(cacheKey);
    if (cachedSessions) return res.status(200).json(JSON.parse(cachedSessions));

    // Get unique sessions with latest message from each
    const sessions = await Session.find({ user_id: userId })
      .sort({ lastTimeStamp: -1 })
      .select("-__v");

    // Cache for 5 minutes
    await redisClient.set(cacheKey, JSON.stringify(sessions), { EX: 900 });

    // Return
    res.status(200).json(sessions);
  } catch (err) {
    console.error("Error in getAllSessions:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch sessions.", error: err.message });
  }
};

export const createSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { newSession } = req.body;

    if (!newSession) {
      console.log("Missing session data!", { newsession: !!newSession });
      return res.status(400).json({ message: "Session data is required." });
    }

    // Update mongoDB
    // Add userid to the session data
    const sessionData = {
      user_id: userId,
      ...newSession,
    };

    const createdSession = await Session.create(sessionData);

    // Update cache
    const allSessionsKey = getAllSessionsKey(userId);

    try {
      const cachedSessions = await redisClient.get(allSessionsKey);
      if (cachedSessions) {
        const sessions = JSON.parse(cachedSessions);
        sessions.unshift(createdSession); // Add new session to the beginning of the cache

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
        console.log("📝 No existing session info cache found!");
      }
    } catch (err) {
      console.warn("⚠️ Cache update failed:", err);
      await redisClient.del(allSessionsKey);
    }

    //
    res.status(201).json({ message: "Session created successfully" });
  } catch (err) {
    console.error("💥 Error in createSession:", err);
    res
      .status(500)
      .json({ message: "Failed to create session", error: err.message });
  }
};
