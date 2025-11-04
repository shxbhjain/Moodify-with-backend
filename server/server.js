// import express from "express";

// import cors from "cors"; // ye aapka frontend and backend to jhod ne ke kaam aata hai
// import 'dotenv/config';
// import cookieParser from "cookie-parser";
// import { connect } from "mongoose";

// import connectDB from './config/mongodb.js'
// import authRouter from './routes/authRoutes.js'
// import userRouter from "./routes/userRoutes.js";

// const app=express();
// const port=process.env.PORT || 4000
// connectDB();

// const allowedOrigins=['http://localhost:5173']

// app.use(express.json());
// app.use(cookieParser());
// app.use(cors({origin: allowedOrigins, credentials: true}))

// // API ENDPOINTS::
// app.get('/',(req,res)=>res.send("API Working fine "));
// app.use('/api/auth',authRouter)
// app.use('/api/user',userRouter)


// app.listen(port,()=>console.log(`Server started on PORT:${port}`));// ye terminal ye type dega

// Problem explanation:
// tf.loadLayersModel('file://...') tries to use fetch(), which isn't supported under tfjs + wasm in Node.
// We can instead manually read model.json + weights from disk and feed them to tf.io.fromMemory().

import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/mongodb.js";
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";

import * as tf from "@tensorflow/tfjs";
import * as wasm from "@tensorflow/tfjs-backend-wasm";




const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;

connectDB();

const allowedOrigins = ["http://localhost:5173"];
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.get("/", (req, res) => res.send("API Working fine"));
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

// ---- Model setup ----
const MODEL_DIR = path.join(__dirname, "model");
const MODEL_JSON_PATH = path.join(MODEL_DIR, "model.json");
const LABELS_PATH = path.join(__dirname, "labels.json");

let model = null;
let labels = [];

async function loadResources() {
  try {
    console.log("Setting TensorFlow backend to WASM...");
    await tf.setBackend("wasm");
    await tf.ready();
    console.log("✅ WASM backend ready.");

    if (!fs.existsSync(MODEL_JSON_PATH)) throw new Error(`Model JSON not found: ${MODEL_JSON_PATH}`);

    const modelJson = JSON.parse(fs.readFileSync(MODEL_JSON_PATH, "utf8"));

    const weightSpecs = [];
    const weightBuffers = [];

    for (const entry of modelJson.weightsManifest) {
      for (const w of entry.weights) weightSpecs.push(w);
      for (const rel of entry.paths) {
        const full = path.join(MODEL_DIR, rel);
        if (!fs.existsSync(full)) throw new Error(`Weight file not found: ${full}`);
        weightBuffers.push(fs.readFileSync(full));
      }
    }

    const totalSize = weightBuffers.reduce((acc, b) => acc + b.byteLength, 0);
    const merged = new Uint8Array(totalSize);
    let offset = 0;
    for (const buf of weightBuffers) {
      merged.set(new Uint8Array(buf), offset);
      offset += buf.byteLength;
    }

    const modelArtifacts = {
      modelTopology: modelJson.modelTopology,
      weightSpecs,
      weightData: merged.buffer,
    };

    model = await tf.loadLayersModel(tf.io.fromMemory(modelArtifacts));
    console.log("✅ Model loaded via fromMemory()");

    // Load labels.json
    if (fs.existsSync(LABELS_PATH)) {
      labels = JSON.parse(fs.readFileSync(LABELS_PATH, "utf8"));
      console.log("✅ Labels loaded:", labels);
    } else {
      console.warn("⚠️ No labels.json found, using numeric indices.");
    }

    // Warmup
    const inputShape = model.inputs[0].shape.slice(1);
    const dummy = tf.zeros([1, ...inputShape]);
    const pred = model.predict(dummy);
    await pred.data();
    tf.dispose([dummy, pred]);
    console.log("🔥 Model warmed up and ready.");
  } catch (err) {
    console.error("Error loading model or backend:", err);
  }
}

app.post("/api/predict", async (req, res) => {
  if (!model) return res.status(503).json({ error: "Model not loaded yet." });
  const { landmarks } = req.body;
  if (!landmarks || !Array.isArray(landmarks))
    return res.status(400).json({ error: "Expected { landmarks: [...] }" });

  const expected = model.inputs[0].shape[1];
  if (expected && landmarks.length !== expected)
    return res.status(400).json({ error: `Expected ${expected} values, got ${landmarks.length}` });

  try {
    const input = tf.tensor2d([landmarks]);
    const output = model.predict(input);
    const probs = await output.data();
    const idx = probs.indexOf(Math.max(...probs));
    const emotion = labels[idx] || `class_${idx}`;
    const confidence = (probs[idx] * 100).toFixed(2);
    tf.dispose([input, output]);
    res.json({ emotion, confidence });
  } catch (err) {
    console.error("Prediction error:", err);
    res.status(500).json({ error: "Prediction failed." });
  }
});

(async () => {
  await loadResources();
  app.listen(port, () => console.log(`🚀 Server running on http://localhost:${port}`));
})();