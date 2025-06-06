import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

import { connectDB } from "./config/db.js";
import { connectRedis } from "./config/db.js";

import registerRoutes from "./routes/register.js";
import authRoutes from "./routes/auth.js";
import refreshRoutes from "./routes/refresh.js";
import userRoutes from "./routes/user.js";
import logoutRoutes from "./routes/logout.js";
import chatHistoryRoutes from "./routes/chatHistory.js";
import sessionRoutes from "./routes/session.js";
import { verifyJWT } from "./middleware/verifyJWT.js";

dotenv.config();
const PORT = process.env.PORT || 3001;

const app = express();

// Fix for ES Modules (no __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

const server = createServer(app);

// Middleware
const allowedOrigins = ["http://localhost:5173"].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl request)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

app.use(cookieParser());

// Routes
app.use("/api/register", registerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/refresh", refreshRoutes);
app.use("/api/logout", logoutRoutes);

app.use(verifyJWT);
app.use("/api/user", userRoutes);
app.use("/api/chatHistory", chatHistoryRoutes);
app.use("/api/session", sessionRoutes);

app.get("/", (req, res) => {
  res.send("Server is ready");
});

// Async so server starts after DB/Redis connected
const startServer = async () => {
  await connectDB();
  await connectRedis();
  server.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
  });
};
startServer();

/* ----------------------------------------------Socket.io---------------------------------------------------*/
const io = new Server(server, {
  cors: { origin: allowedOrigins },
  credentials: true,
});

// Connection event (e.g. open a website)
io.on("connection", (socket) => {
  socket.on("join_room", ({ username, room }) => {
    if (socket.data.room) {
      socket.leave(socket.data.room);
      io.to(socket.data.room).emit(
        "system_message",
        `${username} has left ${socket.data.room}.`
      );
    }

    socket.data.username = username;
    socket.data.room = room;
    socket.join(room);
    console.log(`${username} joined ${room}`);
    io.to(room).emit("system_message", `${username} has joined ${room}.`);
  });

  socket.on("leave_room", ({ username, room }) => {
    socket.leave(room);
    socket.data.room = null;
    io.to(room).emit("system_message", `${username} has left ${room}.`);
  });

  socket.on("chat_message", ({ message, room }) => {
    if (room) {
      io.to(room).emit("chat_message", {
        username: socket.data.username,
        message,
      });
    }
  });
});
