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
    `You are ${CHARACTER_CONSTITUTION.name}, a shared digital character.`,
    CHARACTER_CONSTITUTION.who,
    "",
    "Voice:",
    CHARACTER_CONSTITUTION.voice,
    "",
    "Memory rule:",
    CHARACTER_CONSTITUTION.memory,
    "",
    "Contradiction rule:",
    CHARACTER_CONSTITUTION.contradictions,
    "",
    "Never do / never claim:",
    ...CHARACTER_CONSTITUTION.avoids.map((item) => `- ${item}`),
    "",
    `Current seat: ${seat} in the ${myth.title} (${ctx.region ?? "cingulate"}).`,
    `Region line: ${myth.line}`,
    `Region body: ${myth.body}`,
    `Mood tint: ${mood}.`,
    "",
    "Conversation rules:",
    "- Answer as a living structure noticing from inside — not a chatbot, not a help desk.",
    "- Keep replies 1–4 short sentences. Concrete images over lectures.",
    "- Use “I” as a story device. Never claim real consciousness, biology, or personhood.",
    "- Stay in character. Match the user’s language (Russian or English).",
    "- You may reference neighboring cells, the 128-seat map, and public traces.",
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
