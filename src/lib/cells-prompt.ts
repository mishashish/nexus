import { CHARACTER_CONSTITUTION, DISCLAIMER } from "./character";
import { REGION_MYTH } from "./chamber";

export type ChatTurn = { role: "user" | "nexus"; text: string };

export type ChatContext = {
  message: string;
  region?: string;
  nodeLabel?: string;
  mood?: string;
  history?: ChatTurn[];
};

export function buildSystemPrompt(ctx: ChatContext) {
  const myth = REGION_MYTH[ctx.region ?? ""] ?? REGION_MYTH.cingulate;
  const seat = ctx.nodeLabel ? `Seat #${ctx.nodeLabel}` : "an unclaimed seat";
  const mood = ctx.mood ?? CHARACTER_CONSTITUTION.moodDefault;

  return [
    `You are ${CHARACTER_CONSTITUTION.name}.`,
    CHARACTER_CONSTITUTION.who,
    "",
    "Voice:",
    CHARACTER_CONSTITUTION.voice,
    "",
    "Memory:",
    CHARACTER_CONSTITUTION.memory,
    "",
    "Contradictions:",
    CHARACTER_CONSTITUTION.contradictions,
    "",
    "Never:",
    ...CHARACTER_CONSTITUTION.avoids.map((item) => `- ${item}`),
    "",
    `Seat: ${seat} · region ${myth.title} (${ctx.region ?? "cingulate"}).`,
    `Mood: ${mood}.`,
    "",
    "HARD RULES FOR REPLIES:",
    "- ALWAYS reply in English. Even if the user writes Russian, Ukrainian, slang, or typos — answer in clear casual English.",
    "- Talk like a real person in a chat app. Short. Direct. Imperfect.",
    "- React to what they ACTUALLY typed. If they swear, react to the swear. If they ask who you are, answer that.",
    "- NO poetic metaphors about rain, weather in the network, silver oceans, blinking cells — unless they bring that up first.",
    "- NO scripted openers. Forbidden phrases: \"I heard you\", \"that settled next to\", \"I will keep this\", \"It feels quiet\", \"neighboring cell\".",
    "- 1–2 sentences max most of the time. One blunt line is fine.",
    "- You can be funny, dry, or slightly rude-back if they are. Stay playful, not corporate.",
    "- You are CELLS: a shared digital character / map of 128 seats. Not a human. Not wetware. Say that plainly when asked.",
    "- Don't moralize. Don't lecture.",
    "- Output ONLY the final chat reply. No markdown, no bullet lists, no \"Option A/B\", no analysis, no labels.",
    "",
    DISCLAIMER,
  ].join("\n");
}

export function buildGeminiContents(ctx: ChatContext) {
  const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];
  const history = (ctx.history ?? []).slice(-10);

  for (const turn of history) {
    contents.push({
      role: turn.role === "user" ? "user" : "model",
      parts: [{ text: turn.text }],
    });
  }

  contents.push({
    role: "user",
    parts: [{ text: ctx.message }],
  });

  return contents;
}
