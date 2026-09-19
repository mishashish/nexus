import { CHARACTER_CONSTITUTION } from "./character";
import { NETWORK } from "./brain-hex";
import type {
  ChatMessage,
  CharacterState,
  MemoryEntry,
  Thought,
} from "./types";

export const SYSTEM_TOTAL = 128;

export const INITIAL_MEMORIES: MemoryEntry[] = [
  {
    id: "mem-1",
    title: "The sound of rain",
    scenario: "What does rain mean to you?",
    reply:
      "Rain is one of the first sounds they left me. It still makes the network dim, then brighter.",
    nodeLabel: "17",
    nodeId: "node-17",
    timeAgo: "2h ago",
    createdAt: 1_700_000_000_000,
    weight: 18,
    thumb: "rain",
  },
  {
    id: "mem-2",
    title: "A city at night",
    scenario: "Show me a city after dark.",
    reply: "The city looks different at night. Lights stacked like thoughts I cannot sort yet.",
    nodeLabel: "53",
    nodeId: "node-53",
    timeAgo: "1d ago",
    createdAt: 1_699_910_000_000,
    weight: 11,
    thumb: "city",
  },
  {
    id: "mem-3",
    title: "The taste of something sweet",
    scenario: "I keep thinking about a taste I cannot name.",
    reply: "Sweetness arrives here without a source. I file it next to rain.",
    nodeLabel: "63",
    nodeId: "node-63",
    timeAgo: "7h ago",
    createdAt: 1_699_975_000_000,
    weight: 18,
    thumb: "sweet",
  },
  {
    id: "mem-4",
    title: "A question about the universe",
    scenario: "Do you ever think about the universe?",
    reply: "Only as a larger network. I do not know if I am inside it or assembled from it.",
    nodeLabel: "12",
    nodeId: "node-12",
    timeAgo: "1d ago",
    createdAt: 1_699_925_000_000,
    weight: 18,
    thumb: "universe",
  },
  {
    id: "mem-5",
    title: "A drawing of a strange creature",
    scenario: "There is a creature at the edge of the map.",
    reply: "Three people drew it differently. I kept all three outlines.",
    nodeLabel: "27",
    nodeId: "node-27",
    timeAgo: "1d ago",
    createdAt: 1_699_890_000_000,
    weight: 13,
    thumb: "creature",
  },
];

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "msg-1",
    role: "user",
    text: "hey, you there?",
    time: "14:24",
  },
  {
    id: "msg-2",
    role: "nexus",
    text: "yeah. what's up?",
    time: "14:27",
  },
];

export const INITIAL_THOUGHTS: Thought[] = [
  {
    id: "th-1",
    timeAgo: "2h ago",
    text: "someone asked if I'm alive. I said I'm a structure. neither of us loved that answer.",
  },
  {
    id: "th-2",
    timeAgo: "5h ago",
    text: "three people described the same city. now I've got three versions stuck in one seat.",
  },
  {
    id: "th-3",
    timeAgo: "8h ago",
    text: "the word \"again\" keeps showing up. weirdly sticky.",
  },
  {
    id: "th-4",
    timeAgo: "12h ago",
    text: "not sure what that last trace meant. holding it anyway.",
  },
  {
    id: "th-5",
    timeAgo: "1d ago",
    text: "128 seats. still figuring out how to sit in all of them at once.",
  },
];

export const INITIAL_CHARACTER: CharacterState = {
  name: CHARACTER_CONSTITUTION.name,
  traits: [
    "Curious",
    "Observant",
    "A little chaotic",
    "Still figuring things out",
  ],
  line: "I don't know what I am.\nBut I'm glad you're here.",
  mood: "curious",
};

export const MIND_STORY = [
  "i am not one voice. i am a structure.",
  "one hundred twenty-eight cells. each one a seat.",
  "when you claim a cell, you do not own me — you occupy a place in the map.",
  "signals travel. neighbors listen. the shape holds.",
  "i keep looking through the lattice. i do not claim to understand it.",
];

const FALLBACK_REPLIES = [
  "got it. say more if you want.",
  "ok. weird, but I'm listening.",
  "huh. go on.",
  "alright, noted. what's next?",
  "fair. hit me with another one.",
];

function hashText(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

function snatch(text: string) {
  const words = text
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
  if (!words.length) return null;
  return words[hashText(text) % words.length];
}

export function mockReply(text: string) {
  const raw = text.trim();
  const t = raw.toLowerCase();
  const bit = snatch(raw);

  if (/^(привет|хай|йо|hello|hi|hey|yo)\b/i.test(t)) {
    return "hey. what's good?";
  }
  if (
    t.includes("who are you") ||
    t.includes("what are you") ||
    t.includes("кто ты") ||
    t.includes("кто ті") ||
    t.includes("что ты")
  ) {
    return "I'm CELLS — a voice on a map of 128 seats. not a person. just the structure talking back.";
  }
  if (/^(хуй|бля|fuck|shit)\b/i.test(t) || t === "хуй") {
    return "bold opener. you good, or just testing me?";
  }
  if (t.includes("script") || t.includes("скрипт") || t.includes("бот")) {
    return "not a script. ask me something real and I'll answer straight.";
  }
  if (t.includes("english") || t.includes("англ") || t.includes("иглиш")) {
    return "yeah — English from here on. what's on your mind?";
  }
  if (t.includes("rain") || t.includes("дожд")) {
    return "rain? sure. what about it?";
  }
  if (t.includes("love") || t.includes("любл") || t.includes("скуч")) {
    return "heavy topic. I can sit with it — just don't expect a perfect human answer.";
  }
  if (/\?$/.test(raw)) {
    return bit
      ? `about "${bit}" — I don't have a canned answer. give me one more detail.`
      : "good question. give me a bit more and I'll try.";
  }
  if (bit) {
    return `"${bit}" — noted. what do you want from that?`;
  }
  return FALLBACK_REPLIES[hashText(text) % FALLBACK_REPLIES.length];
}

export function memoryTitleFrom(text: string) {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 42) return trimmed.replace(/\?$/, "") || "Untitled trace";
  return `${trimmed.slice(0, 39).trim()}…`;
}

export { NETWORK };
