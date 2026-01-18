// server.js
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 8000;

// ---------- Middleware ----------
app.use(express.json());
app.use(express.static("public"));

// Hackathon CORS (dev-friendly)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ---------- Schemas ----------

// User Profile
const userProfileSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  demographics: {
    age_group: String, // e.g. "50-59", "70+"
    ethnicity: String,
    gender: String
  },
  medical_conditions: [String],
  current_medications: [String],
  health_metrics: {
    bmi: Number,
    blood_pressure: String,     // e.g. "145/92"
    last_hba1c_level: Number    // e.g. 8.1
  },
  anonymized_at: { type: Date, default: Date.now },
  wallet_address: { type: String, required: true }
});

// Trial Metadata
const trialMetadataSchema = new mongoose.Schema({
  trial_id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  sponsor: String,
  eligibility_criteria: {
    min_age: Number,
    max_age: Number,
    required_conditions: [String],
    excluded_conditions: [String]
  },
  location: String,
  reward_amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["Open", "Recruiting", "Closed"],
    default: "Open"
  }
});

// Matches
const matchSchema = new mongoose.Schema({
  match_id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  user_id: { type: String, required: true, ref: "UserProfile" },
  trial_id: { type: String, required: true, ref: "TrialMetadata" },
  match_score: { type: Number, min: 0, max: 100, required: true },
  match_reasoning: String,
  enrollment_status: {
    type: String,
    enum: ["Pending", "Matched", "Consent_Signed", "Rejected"],
    default: "Pending"
  },
  solana_tx_sig: String
});

matchSchema.index({ user_id: 1, trial_id: 1 }, { unique: true });

const UserProfile = mongoose.model("UserProfile", userProfileSchema);
const TrialMetadata = mongoose.model("TrialMetadata", trialMetadataSchema);
const Match = mongoose.model("Match", matchSchema);

// ---------- Helpers ----------
function normalizeStr(s) {
  return String(s || "").trim().toLowerCase();
}

function parseAgeGroup(ageGroup) {
  // "50-59" -> {min: 50, max: 59}
  // "70+" -> {min: 70, max: 200}
  const s = String(ageGroup || "").trim();
  if (!s) return null;

  if (s.endsWith("+")) {
    const n = Number(s.replace("+", ""));
    if (Number.isFinite(n)) return { min: n, max: 200 };
    return null;
  }

  const m = s.match(/^(\d+)\s*-\s*(\d+)$/);
  if (!m) return null;

  const min = Number(m[1]);
  const max = Number(m[2]);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;

  return { min, max };
}

function rangesOverlap(aMin, aMax, bMin, bMax) {
  return Math.max(aMin, bMin) <= Math.min(aMax, bMax);
}

function ethnicityGroupMatch(userEthnicity, group) {
  // Very lightweight mapping (hackathon style)
  const e = normalizeStr(userEthnicity);
  const g = normalizeStr(group);

  if (!g || g === "any") return true;
  if (!e) return false;

  if (g === "black") return e.includes("black") || e.includes("afric");
  if (g === "east asian") return e.includes("east") || e.includes("chinese") || e.includes("korean") || e.includes("japanese");
  if (g === "south asian") return e.includes("south") || e.includes("indian") || e.includes("pakistani") || e.includes("bangladeshi");
  if (g === "white") return e.includes("white") || e.includes("cauc");
  if (g === "hispanic") return e.includes("hisp") || e.includes("latino") || e.includes("latina");
  if (g === "indigenous") return e.includes("indigen") || e.includes("native");
  if (g === "middle eastern") return e.includes("middle") || e.includes("arab") || e.includes("persian");
  if (g === "mixed/other") return e.includes("mixed") || e.includes("other");

  return true;
}

// ---------- Routes ----------
app.get("/", (req, res) => res.json({ message: "PharmaCluster API is running!" }));
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    db: mongoose.connection.readyState === 1 ? "connected" : "not_connected"
  });
});

// Existing: patient upload
app.post("/api/upload-record", async (req, res) => {
  try {
    const userData = req.body || {};
    if (!userData.wallet_address) {
      return res.status(400).json({ error: "wallet_address is required" });
    }

    userData.user_id = userData.wallet_address;

    await UserProfile.create(userData);
    res.json({ success: true, message: "Record uploaded successfully" });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ error: "Duplicate user_id. This wallet already exists." });
    }
    console.error("Error saving user profile:", error);
    res.status(500).json({ error: "Failed to save record" });
  }
});

/**
 * ✅ NEW: Researcher criteria endpoint
 * Reads your form payload and returns candidates based on the MATCHES collection.
 *
 * Expects payload like (from your upload-record.js):
 * {
 *   limit: 25,
 *   demographics: { age_range: "50-59", gender:"Any", ethnicity_group:"Any" },
 *   clinical: { primary_condition:"Type 2 Diabetes", severity:"Any", ... },
 *   metrics: { bmi_range:"Any", bp_range:"Any", hba1c_range:"Any" }
 * }
 */
app.post("/api/find-candidates", async (req, res) => {
  try {
    const body = req.body || {};

    const limit = Math.max(1, Math.min(Number(body.limit) || 10, 200));

    const ageRange = body?.demographics?.age_range || "";
    const gender = body?.demographics?.gender || "Any";
    const ethnicityGroup = body?.demographics?.ethnicity_group || "Any";

    const primaryCondition = body?.clinical?.primary_condition || "";
    const minScore = Number(body.min_score) || 0; // optional

    if (!ageRange || !primaryCondition) {
      return res.status(400).json({
        error: "Missing required fields. Please provide demographics.age_range and clinical.primary_condition."
      });
    }

    // 1) Decide which trials to consider based on primaryCondition
    // We'll match trial title loosely (hackathon-style).
    const conditionRegex = new RegExp(primaryCondition.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    const matchingTrials = await TrialMetadata.find({
      status: { $in: ["Open", "Recruiting"] },
      $or: [
        { title: { $regex: conditionRegex } },
        { "eligibility_criteria.required_conditions": { $elemMatch: { $regex: conditionRegex } } }
      ]
    }).lean();

    const trialIds = matchingTrials.map(t => t.trial_id);

    // If no trials match the condition, short-circuit
    if (!trialIds.length) {
      console.log("🔎 find-candidates: no trials matched condition:", primaryCondition);
      return res.json({ ok: true, count: 0, candidates: [] });
    }

    // 2) Query matches for those trials, and optionally enforce min match_score
    const matches = await Match.find({
      trial_id: { $in: trialIds },
      match_score: { $gte: minScore }
    })
      .sort({ match_score: -1 })
      .limit(5000) // we'll filter in JS then apply `limit`
      .lean();

    // 3) Pull corresponding userprofiles
    const userIds = [...new Set(matches.map(m => m.user_id))];

    const users = await UserProfile.find({ user_id: { $in: userIds } }).lean();
    const userById = new Map(users.map(u => [u.user_id, u]));

    // 4) Filter based on demographics (since matches doesn't store these)
    const ageReq = parseAgeGroup(ageRange);

    const filtered = [];
    for (const m of matches) {
      const u = userById.get(m.user_id);
      if (!u) continue;

      // Gender filter
      if (gender !== "Any" && String(u?.demographics?.gender || "") !== String(gender)) continue;

      // Ethnicity group filter
      if (!ethnicityGroupMatch(u?.demographics?.ethnicity, ethnicityGroup)) continue;

      // Age range overlap filter
      const userAge = parseAgeGroup(u?.demographics?.age_group);
      if (ageReq && userAge) {
        if (!rangesOverlap(ageReq.min, ageReq.max, userAge.min, userAge.max)) continue;
      } else if (ageReq && !userAge) {
        // if researcher asks for age but user has none, exclude (more strict)
        continue;
      }

      // This is the "collected candidate object"
      filtered.push({
        user_id: m.user_id,
        trial_id: m.trial_id,
        score: m.match_score,
        status: m.enrollment_status,
        reasoning: m.match_reasoning,
        demographics: u.demographics,
        medical_conditions: u.medical_conditions,
        health_metrics: u.health_metrics
      });

      if (filtered.length >= limit) break;
    }

    // 5) Store collected data into an array (already `filtered`)
    // And print to console
    console.log("✅ Collected candidate results (first 5 shown):");
    console.log(filtered.slice(0, 5));
    console.log(`Total candidates returned: ${filtered.length}`);

    // 6) Return to frontend
    return res.json({
      ok: true,
      count: filtered.length,
      candidates: filtered
    });
  } catch (err) {
    console.error("❌ /api/find-candidates error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

// ---------- DB Connect + Start ----------
async function start() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI missing in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB Atlas connected");

    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().command({ ping: 1 });
      console.log("✅ Ping ok");
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

start();

module.exports = { UserProfile, TrialMetadata, Match };
