"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Panel } from "./ui";
import { useNexus } from "@/lib/nexus-store";

export function ActiveNodeCard() {
  const { selected, yours, messages, busy, sendScenario, yoursId, enterNode } =
    useNexus();
  const [draft, setDraft] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const node = yours ?? selected;

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages, busy]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const ok = await sendScenario(draft);
    if (ok) setDraft("");
  }

  return (
    <Panel id="active-node" className="flex min-h-[240px] flex-col p-5 sm:p-6">
      <p className="kicker mb-1">seat</p>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="m-0 text-xl font-extrabold tracking-[-0.03em]">
          Node {node?.label ?? "—"}
        </h2>
        <p className="font-mono text-[11px] text-nexus-mute">
          {yoursId ? "yours" : "visitor"}
        </p>
      </div>

      <div ref={scroller} className="seat-thread flex-1 space-y-3 overflow-auto pr-1">
        {messages.map((message) =>
          message.role === "user" ? (
            <p
              key={message.id}
              className="seat-bubble seat-bubble-user ml-auto max-w-[85%] px-3 py-2 text-[13px] leading-5"
            >
              {message.text}
            </p>
          ) : (
            <p key={message.id} className="seat-bubble seat-bubble-mind max-w-[90%] text-[13px] leading-5">
              {message.text}
              <span className="mt-1 block font-mono text-[10px] text-nexus-mute">
                {message.time}
              </span>
            </p>
          ),
        )}
        {busy ? (
          <p className="font-mono text-[11px] text-nexus-mute">listening through the lattice…</p>
        ) : null}
      </div>

      {yoursId ? (
        <form onSubmit={onSubmit} className="mt-3 flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Speak to the structure…"
            className="h-10 flex-1 border border-nexus-line bg-transparent px-3 text-[13px] text-nexus-text outline-none placeholder:text-nexus-mute/70 focus:border-nexus-violet"
            maxLength={500}
            disabled={busy}
          />
          <button
            type="submit"
            className="btn-primary h-10 px-4"
            aria-label="Send scenario"
            disabled={busy || !draft.trim()}
          >
            Send
          </button>
        </form>
      ) : (
        <button type="button" onClick={enterNode} className="btn-ghost mt-3">
          Claim a lot to speak
        </button>
      )}
    </Panel>
  );
}
