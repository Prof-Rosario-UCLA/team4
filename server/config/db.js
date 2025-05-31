import mongoose from "mongoose";
import redis from "redis";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

// Create Redis client
export const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379
  }
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log(`Redis Connected: ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`);
  } catch (error) {
    console.log(`Redis connection error: ${error.message}`);
    process.exit(1);
  }
}