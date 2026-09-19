import { NextResponse } from "next/server";
import {
  buildGeminiContents,
  buildSystemPrompt,
  type ChatContext,
} from "@/lib/cells-prompt";
import { mockReply } from "@/lib/data";

export const runtime = "nodejs";

type Body = {
  message?: string;
  region?: string;
  nodeLabel?: string;
  mood?: string;
  history?: Array<{ role: "user" | "nexus"; text: string }>;
};

const MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-3.6-flash",
  "gemini-flash-latest",
  "gemini-3.5-flash",
  "gemini-2.5-flash-lite",
].filter(Boolean) as string[];

async function callGemini(model: string, apiKey: string, ctx: ChatContext) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: buildSystemPrompt(ctx) }],
      },
      contents: buildGeminiContents(ctx),
      generationConfig: {
        temperature: 1.05,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 512,
      },
    }),
  });

  const data = (await res.json()) as {
    error?: { message?: string };
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  if (!res.ok) {
    throw new Error(data.error?.message || `Gemini ${model} failed (${res.status})`);
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) throw new Error("Empty Gemini reply");
  return text;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = body.message?.trim() ?? "";
  if (!message || message.length > 500) {
    return NextResponse.json({ error: "Message required (max 500)" }, { status: 400 });
  }

  const ctx: ChatContext = {
    message,
    region: body.region,
    nodeLabel: body.nodeLabel,
    mood: body.mood,
    history: Array.isArray(body.history) ? body.history.slice(-10) : [],
  };

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({
      reply: mockReply(message),
      source: "mock",
      hint: "Set GEMINI_API_KEY for live CELLS replies.",
    });
  }

  let lastError = "Gemini unavailable";
  for (const model of MODELS) {
    try {
      const reply = await callGemini(model, apiKey, ctx);
      return NextResponse.json({ reply, source: "gemini", model });
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  return NextResponse.json({
    reply: mockReply(message),
    source: "mock",
    error: lastError,
  });
}
