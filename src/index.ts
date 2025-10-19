import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "../src/routes/authRoutes";
import promptRoutes from "../src/routes/promptRoutes";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Routes
app.get("/", (req, res) => {
  res.send("PromptVault Backend is running");
});

// Default API routes
app.use('/api/v1/auth', authRoutes);

// Prompt routes
app.use("/api/v1/prompts", promptRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL!)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
