export type NodeStatus = "available" | "claimed" | "yours" | "active";

export type NodeKind = "idle" | "memory" | "signal" | "observation";

export interface NetworkNode {
  id: string;
  slug: string;
  label: string;
  status: NodeStatus;
  kind: NodeKind;
  q: number;
  r: number;
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
  tint: number;
  pulse: boolean;
  type: string;
  timeOnline: string;
  observation: string;
  description: string;
  region?: string;
  index?: number;
  halo?: boolean;
}

export interface HexLink {
  id: string;
  a: number;
  b: number;
  x1: number;
  y1: number;
  z1?: number;
  x2: number;
  y2: number;
  z2?: number;
}

export interface MemoryEntry {
  id: string;
  title: string;
  scenario: string;
  reply: string;
  nodeLabel: string;
  nodeId: string;
  timeAgo: string;
  createdAt: number;
  weight: number;
  thumb: "rain" | "city" | "sweet" | "universe" | "creature" | "trace";
  mine?: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "nexus";
  text: string;
  time: string;
}

export interface Thought {
  id: string;
  timeAgo: string;
  text: string;
}

export interface CharacterState {
  name: string;
  traits: string[];
  line: string;
  mood: string;
}

export interface SystemStats {
  total: number;
  active: number;
  yours: number;
  memory: number;
  idle: number;
  claimed: number;
}
