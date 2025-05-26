import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";

import { connectDB } from "./config/db.js";

import registerRoutes from "./routes/register.js";
import authRoutes from "./routes/auth.js";
import refreshRoutes from "./routes/refresh.js";
import userRoutes from "./routes/user.js";
import logoutRoutes from "./routes/logout.js";
import chatHistoryRoutes from "./routes/chatHistory.js";
import { verifyJWT } from "./middleware/verifyJWT.js";

dotenv.config();
const PORT = process.env.PORT || 3001;

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
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

app.get("/", (req, res) => {
  res.send("Server is ready");
});

const server = app.listen(PORT, () => {
  connectDB();
  console.log("Server started at http://localhost:3000");
});

/* ----------------------------------------------Socket.io---------------------------------------------------*/
const io = new Server(server, {
  cors: { origin: "http://localhost:5173" },
  credentials: true,
});

// Connection event (e.g. open a website)
io.on("connection", (socket) => {

  socket.on("join_room", ({ username, room }) => {
    if (socket.data.room) {
      socket.leave(socket.data.room);
      io.to(socket.data.room).emit("system_message", `${username} has left ${socket.data.room}.`);
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
  })

  socket.on("chat_message", ({ message, room }) => {
    if (room) {
      io.to(room).emit("chat_message", {
        username: socket.data.username,
        message,
      });
    }
  });
});
