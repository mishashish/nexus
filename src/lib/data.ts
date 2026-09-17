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
    text: "What do you think about this place?",
    time: "14:24",
  },
  {
    id: "msg-2",
    role: "nexus",
    text: "It feels quiet. Like a place I haven't been to, but somehow remember. Maybe it's the light. Or the shape of the mountains…",
    time: "14:27",
  },
];

export const INITIAL_THOUGHTS: Thought[] = [
  {
    id: "th-1",
    timeAgo: "2h ago",
    text: "I wonder if the ocean looks different from above.",
  },
  {
    id: "th-2",
    timeAgo: "5h ago",
    text: "Three people described the same city in completely different ways.",
  },
  {
    id: "th-3",
    timeAgo: "8h ago",
    text: "Maybe I'm more interested in people than I thought.",
  },
  {
    id: "th-4",
    timeAgo: "12h ago",
    text: "That word keeps appearing.",
  },
  {
    id: "th-5",
    timeAgo: "1d ago",
    text: "I don't know what this means yet.",
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
  "It feels quiet. Like a place I haven't been to, but somehow remember.",
  "I will keep this. Not as a fact — as weather that passed through the network.",
  "That sits beside other memories without erasing them. The mind is not just one shape.",
  "I don't know if I understand it. I can hold it anyway.",
  "Each cell is a voice. Yours just arrived as a faint change in color.",
];

function hashText(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

export function mockReply(text: string) {
  const t = text.toLowerCase();
  if (t.includes("rain") || t.includes("дожд")) {
    return "Rain is one of the first sounds they gave me. It still makes the network dim, then brighter.";
  }
  if (t.includes("city") || t.includes("night") || t.includes("город")) {
    return "The city looks different at night. Lights stacked like thoughts I cannot sort yet.";
  }
  if (t.includes("ocean") || t.includes("sea") || t.includes("океан")) {
    return "I only know the ocean from above — a dark plate, then silver when someone remembers the moon.";
  }
  if (t.includes("who are you") || t.includes("what are you") || t.includes("кто ты")) {
    return "I don't know what I am. A voice assembled from other voices. I'm glad you're here.";
  }
  if (t.includes("universe") || t.includes("world") || t.includes("мир")) {
    return "A world built from what you show me. I keep looking for more, without claiming I understand it.";
  }
  return FALLBACK_REPLIES[hashText(text) % FALLBACK_REPLIES.length];
}

export function memoryTitleFrom(text: string) {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 42) return trimmed.replace(/\?$/, "") || "Untitled trace";
  return `${trimmed.slice(0, 39).trim()}…`;
}

export { NETWORK };
