import express from "express";
import { runAIAgent } from "../services/aiAgent.service.js";

const router = express.Router();

router.post("/ask", async (req, res) => {
  try {
    const { question, model, apiKey } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const result = await runAIAgent(question, model, apiKey);

    console.log("RESULT : " , result);

    res.json(result);
  } catch (err) {
    console.error("AI Agent Error:", err);
    res.status(500).json({
      error: "AI Agent failed",
      details: err.message,
    });
  }
});

export default router;