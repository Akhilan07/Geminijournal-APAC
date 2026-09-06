import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Production Directive 6.2: Top-Level Request Deserialization (Ordering Guarantee)
// Always mount body parser middleware before defining any endpoint routes
app.use(express.json({ limit: "5mb" }));

// Initialize Google GenAI client lazily or securely
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    googleMapsConfigured: Boolean(process.env.GOOGLE_MAPS_API_KEY),
  });
});

// App configuration endpoint (Secure env disclosure)
app.get("/api/config", (_req: Request, res: Response) => {
  res.json({
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",
  });
});

/**
 * Resilient & Ultra-Fast Model Fallback Ladder
 * Ordered by real-time speed and low latency:
 * 1. Primary Ultra-Fast: "gemini-2.0-flash" (sub-second response)
 * 2. Instant Lite: "gemini-2.0-flash-lite"
 * 3. High Availability: "gemini-1.5-flash"
 * 4. Dynamic Alias: "gemini-flash-latest"
 */
const MODEL_FALLBACK_LADDER = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-flash-latest",
] as const;

interface GeminiRequestPayload {
  prompt: string;
  mode?: "reflection" | "summary" | "brainstorm" | "chat";
  title?: string;
  previousTurns?: Array<{ role: "user" | "model"; text: string }>;
}

async function generateContentWithFallback(
  contents: any,
  systemInstruction: string
): Promise<{ text: string; modelUsed: string }> {
  const ai = getGenAI();
  let lastError: any = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
          maxOutputTokens: 850,
        },
      });

      const text = response.text;
      if (text && text.trim().length > 0) {
        return { text: text.trim(), modelUsed: model };
      }
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.statusCode || 0;
      const message = String(err?.message || "");

      // Catch recoverable HTTP status codes: 503, 429, 404, 500 or network timeouts
      const isRecoverable =
        [503, 429, 404, 500].includes(status) ||
        message.includes("UNAVAILABLE") ||
        message.includes("RESOURCE_EXHAUSTED") ||
        message.includes("NOT_FOUND") ||
        message.includes("INTERNAL") ||
        message.includes("fetch failed");

      console.warn(`Model ${model} failed with status ${status}. Recoverable: ${isRecoverable}. Trying next fallback.`);

      if (!isRecoverable) {
        // If not standard recoverable code, continue through ladder as safety net
        continue;
      }
    }
  }

  throw new Error(
    `All Gemini fallback models exhausted. Last error: ${lastError?.message || "Unknown error"}`
  );
}

// POST /api/gemini/reflect - Core reflection & AI assistance endpoint
app.post("/api/gemini/reflect", async (req: Request, res: Response) => {
  try {
    // Production Directive 6.2: Defensive Payload Ingestion (Null-Safe Destructuring)
    const body = (req.body && typeof req.body === "object") ? req.body : {};
    const payload = body as Partial<GeminiRequestPayload>;

    const prompt = typeof payload.prompt === "string" ? payload.prompt.trim() : "";
    const mode = payload.mode || "reflection";
    const previousTurns = Array.isArray(payload.previousTurns) ? payload.previousTurns : [];

    if (!prompt) {
      res.status(400).json({ error: "Prompt is required and cannot be empty." });
      return;
    }

    if (prompt.length > 15000) {
      res.status(400).json({ error: "Prompt exceeds maximum allowed length of 15,000 characters." });
      return;
    }

    let systemInstruction = "";
    switch (mode) {
      case "summary":
        systemInstruction =
          "You are an insightful summarization assistant for personal journal entries. " +
          "Your goal is to extract the central themes, emotional nuances, key takeaways, and constructive reflections. " +
          "Structure your response clearly with brief headings or bullet points where helpful.";
        break;
      case "brainstorm":
        systemInstruction =
          "You are an inspiring creative brainstorming partner. " +
          "Based on the user's reflection, suggest 4-6 diverse, creative perspectives, actionable next steps, or thought experiments. " +
          "Be encouraging, imaginative, and practical.";
        break;
      case "chat":
        systemInstruction =
          "You are an empathetic, supportive, and perceptive conversational journal companion. " +
          "Converse naturally with the user, validate their feelings, offer gentle wisdom, and ask one thoughtful follow-up question.";
        break;
      case "reflection":
      default:
        systemInstruction =
          "You are a wise, mindful personal journaling guide and philosophical sounding board. " +
          "Acknowledge what the user shared with warmth and emotional intelligence. " +
          "Provide meaningful reflection, highlight strengths or patterns, and offer a calming, grounded perspective.";
        break;
    }

    // Build multi-turn content if previous conversation exists
    let contents: any;
    if (previousTurns.length > 0) {
      const parts = previousTurns.map((turn) => ({
        role: turn.role === "model" ? "model" : "user",
        parts: [{ text: turn.text }],
      }));
      parts.push({
        role: "user",
        parts: [{ text: prompt }],
      });
      contents = parts;
    } else {
      contents = prompt;
    }

    const { text, modelUsed } = await generateContentWithFallback(contents, systemInstruction);

    // Auto-generate title if not provided
    let titleSuggestion = payload.title;
    if (!titleSuggestion || titleSuggestion.trim().length === 0) {
      try {
        const titleRes = await getGenAI().models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: `Create a brief 3 to 6 word title summarizing this personal journal entry:\n\n"${prompt.slice(0, 300)}"`,
          config: {
            systemInstruction: "Output ONLY the concise 3-6 word title. Do not wrap in quotes or add punctuation.",
          },
        });
        titleSuggestion = titleRes.text?.trim().replace(/^["']|["']$/g, "") || "Untitled Reflection";
      } catch {
        titleSuggestion = prompt.slice(0, 40).trim() + "...";
      }
    }

    res.json({
      response: text,
      modelUsed,
      title: titleSuggestion,
      mode,
    });
  } catch (error: any) {
    console.error("Gemini reflection error:", error);
    res.status(500).json({
      error: error.message || "Failed to generate reflection from Gemini.",
    });
  }
});

async function startServer() {
  // Vite integration middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
