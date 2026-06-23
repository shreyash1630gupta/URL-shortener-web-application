const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/url_shortener";
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// ---------- Middleware ----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ---------- MongoDB Connection ----------
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    console.error("Set MONGO_URI in .env and make sure MongoDB is running.");
    process.exit(1);
  }
}

// ---------- Schema ----------
const Url = require("./models/Url");

// ---------- Helpers ----------
function isValidHttpUrl(urlString) {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function generateShortCode(length = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

async function createUniqueShortCode() {
  let shortCode = generateShortCode();
  while (await Url.findOne({ shortCode })) {
    shortCode = generateShortCode();
  }
  return shortCode;
}

// ---------- API Routes ----------
app.post("/api/shorten", async (req, res) => {
  try {
    const { originalUrl } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ message: "URL is required." });
    }

    if (!isValidHttpUrl(originalUrl)) {
      return res.status(400).json({ message: "Please enter a valid http/https URL." });
    }

    // Reuse an existing short link if the same URL was already shortened.
    const existing = await Url.findOne({ originalUrl });
    if (existing) {
      return res.json({
        message: "URL already shortened.",
        originalUrl: existing.originalUrl,
        shortCode: existing.shortCode,
        shortUrl: `${BASE_URL}/${existing.shortCode}`,
      });
    }

    const shortCode = await createUniqueShortCode();

    const saved = await Url.create({
      originalUrl,
      shortCode,
    });

    return res.status(201).json({
      message: "Short URL created successfully.",
      originalUrl: saved.originalUrl,
      shortCode: saved.shortCode,
      shortUrl: `${BASE_URL}/${saved.shortCode}`,
    });
  } catch (error) {
    console.error("Shorten API error:", error);
    return res.status(500).json({ message: "Server error while creating short URL." });
  }
});

app.get("/api/history", async (_req, res) => {
  try {
    const links = await Url.find().sort({ createdAt: -1 }).limit(20);
    return res.json(links);
  } catch (error) {
    console.error("History API error:", error);
    return res.status(500).json({ message: "Server error while fetching history." });
  }
});
app.delete("/api/clear", async (req, res) => {
  try {
    await Url.deleteMany({});
    return res.json({ message: "History cleared successfully." });
  } catch (error) {
    console.error("Clear history error:", error);
    return res.status(500).json({ message: "Server error while clearing history." });
  }
});
// ---------- Redirect Route ----------
// Works when someone opens: http://localhost:5000/abc123
app.get("/:shortCode", async (req, res, next) => {
  try {
    const { shortCode } = req.params;

    // Keep API routes safe.
    if (shortCode === "api") {
      return next();
    }

    const found = await Url.findOne({ shortCode });
    if (!found) {
      return res.status(404).send("Short URL not found.");
    }

    found.clicks += 1;
    await found.save();

    return res.redirect(found.originalUrl);
  } catch (error) {
    console.error("Redirect error:", error);
    return res.status(500).send("Server error during redirect.");
  }
});

// ---------- Frontend Route ----------
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ---------- Start Server ----------
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on ${BASE_URL}`);
  });
});
