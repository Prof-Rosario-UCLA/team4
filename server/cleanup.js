import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function cleanupDatabases() {
  try {
    // General database
    await mongoose.connect(process.env.MONGO_URI);
    let db = mongoose.connection.db;
    await db.collection("sessions").deleteMany({});
    await db.collection("chathistories").deleteMany({});
    await db.collection("users").deleteMany({});

    await mongoose.connection.close();

    console.log("General database is cleaned.");

    // AI-service database
    const AI_SERVICE_MONGO_URL =
      "mongodb+srv://lin1jason8:cA2ImfE16GyotKZt@cluster0.uucmvfv.mongodb.net/AI-service?retryWrites=true&w=majority&appName=Cluster0";

    await mongoose.connect(AI_SERVICE_MONGO_URL);
    db = mongoose.connection.db;
    await db.collection("Messages").deleteMany({});
    await db.collection("Threads").deleteMany({});

    console.log("AI-service database is cleaned.");

    process.exit(0);
  } catch (err) {
    console.error("Database clean up error: ", err);
    process.exit(1);
  }
}

cleanupDatabases();