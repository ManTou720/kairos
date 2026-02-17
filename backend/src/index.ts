import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import deckRoutes from "./routes/decks.js";
import cardRoutes from "./routes/cards.js";
import folderRoutes from "./routes/folders.js";
import searchRoutes from "./routes/search.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/decks", deckRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/search", searchRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Kairos API server running on port ${PORT}`);
});
