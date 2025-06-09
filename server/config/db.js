import mongoose from "mongoose";
import redis from "redis";
import dotenv from "dotenv";

dotenv.config({ path: '../.env' });

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

// Create Redis client with better error handling
export const redisClient = redis.createClient({
  username: process.env.REDIS_USERNAME || 'default',
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  }
});

export const connectRedis = async () => {
  // Check if Redis config is available
  if (!process.env.REDIS_HOST || !process.env.REDIS_PORT || !process.env.REDIS_PASSWORD) {
    console.log('⚠️ Redis configuration incomplete - skipping Redis connection');
    console.log('Missing:', {
      host: !process.env.REDIS_HOST,
      port: !process.env.REDIS_PORT,
      password: !process.env.REDIS_PASSWORD
    });
    return;
  }

  try {
    await redisClient.connect();
    console.log(`Redis (Server) Connected: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
  } catch (error) {
    console.log(`❌ Redis connection error: ${error.message}`);
    console.log('Continuing without Redis cache...');
  }
};