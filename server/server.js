import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import { createProxyMiddleware } from 'http-proxy-middleware';

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

dotenv.config({ path: '../.env' });
const PORT = process.env.PORT || 3000;

const app = express();

// Fix for ES Modules (no __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = createServer(app);

// Middleware
// Update the allowedOrigins array in server.js
const allowedOrigins = [
  "http://localhost:5173",
  "http://34.105.109.10",      // Add your LoadBalancer IP
  "http://35.233.161.58",       // Keep any other IPs
  "http://team4.cs144.org",     // Your domain
  "https://team4.cs144.org"     // HTTPS version
].filter(Boolean);

// Update CORS middleware to be more permissive for testing
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl request)
      if (!origin) return callback(null, true);

      // In production, you might want to be more permissive temporarily
      if (process.env.NODE_ENV === 'production') {
        // Allow any origin in production for testing
        return callback(null, true);
      }

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

// Health check endpoint for the Node.js server
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "healthy", 
    service: "oversea-server",
    timestamp: new Date().toISOString() 
  });
});

// Proxy AI service requests - Fixed routing
app.use('/chat', createProxyMiddleware({
  target: 'http://localhost:8000',
  changeOrigin: true,
  // Remove pathRewrite entirely - let it pass through as-is
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying ${req.method} ${req.path} to AI service`);
  },
  onError: (err, req, res) => {
    console.error('Proxy Error:', err);
    res.status(500).json({ error: 'Failed to connect to AI service' });
  }
}));

// Health check endpoint (no auth required)
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Also update the root endpoint to handle both GET and HEAD
app.all("/", (req, res) => {
  if (req.method === 'HEAD') {
    res.status(200).end();
  } else {
    res.send("Server is ready");
  }
});

// PUBLIC API Routes (NO AUTH REQUIRED)
app.use("/api/register", registerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/refresh", refreshRoutes);
app.use("/api/logout", logoutRoutes);

// Serve static files from React build
app.use(express.static(path.join(__dirname, "public")));

// PROTECTED API Routes (AUTH REQUIRED) - Apply verifyJWT per route instead of globally
app.use("/api/user", verifyJWT, userRoutes);
app.use("/api/chatHistory", verifyJWT, chatHistoryRoutes);
app.use("/api/session", verifyJWT, sessionRoutes);


// Async so server starts after DB/Redis connected
const startServer = async () => {
  await connectDB();
  await connectRedis();
  server.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
    console.log(`Proxying /chat requests to AI service at http://localhost:8000`);
  });
};
startServer();

/* ----------------------------------------------Socket.io---------------------------------------------------*/
const io = new Server(server, {
  cors: { origin: allowedOrigins },
  credentials: true,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Enhanced Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  
  socket.on("join_room", ({ username, room }) => {
    console.log(`${username} attempting to join room ${room}`);
    
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
    console.log(`${username} successfully joined ${room}`);
    io.to(room).emit("system_message", `${username} has joined ${room}.`);
  });

  socket.on("leave_room", ({ username, room }) => {
    console.log(`${username} leaving room ${room}`);
    socket.leave(room);
    socket.data.room = null;
    io.to(room).emit("system_message", `${username} has left ${room}.`);
  });

  socket.on("chat_message", ({ message, room }) => {
    if (room && socket.data.username) {
      console.log(`Message from ${socket.data.username} in room ${room}: ${message}`);
      io.to(room).emit("chat_message", {
        username: socket.data.username,
        message,
      });
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    if (socket.data.room && socket.data.username) {
      io.to(socket.data.room).emit("system_message", `${socket.data.username} disconnected.`);
    }
  });

  socket.on("error", (error) => {
    console.error(`Socket error: ${socket.id}`, error);
  });
});

// Log socket.io events for debugging
io.engine.on("connection_error", (err) => {
  console.log("Socket.io connection error:", err.req);
  console.log("Error code:", err.code);
  console.log("Error message:", err.message);
  console.log("Error context:", err.context);
});