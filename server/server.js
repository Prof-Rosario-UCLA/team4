import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import { connectDB } from "./config/db.js";

import registerRoutes from "./routes/register.js";
import authRoutes from "./routes/auth.js";
import refreshRoutes from "./routes/refresh.js";
import userRoutes from "./routes/user.js";
import logoutRoutes from "./routes/logout.js";
import { verifyJWT } from "./middleware/verifyJWT.js";

dotenv.config();
const PORT = process.env.PORT || 4000;

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
app.use("/api/refresh", refreshRoutes );
app.use("/api/logout", logoutRoutes );

app.use(verifyJWT);
app.use("/api/user", userRoutes);

app.get("/", (req, res) => {
  res.send("Server is ready");
});

app.listen(PORT, () => {
  connectDB();
  console.log("Server started at http://localhost:3000");
});
