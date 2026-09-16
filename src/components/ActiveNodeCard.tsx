"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Radio } from "lucide-react";
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
    <Panel id="active-node" className="flex min-h-[280px] flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="card-head mb-0">
          <Radio size={16} strokeWidth={1.5} />
          Node {node?.label ?? "—"}
        </h2>
        <p className="font-mono text-[11px] text-nexus-mute">
          {yoursId ? "your seat" : "visitor"}
        </p>
      </div>

      <div ref={scroller} className="flex-1 space-y-3 overflow-auto pr-1">
        {messages.map((message) =>
          message.role === "user" ? (
            <div key={message.id} className="appear flex justify-end gap-2">
              <p className="max-w-[80%] border border-nexus-line px-3 py-2 text-[12px] leading-5">
                {message.text}
              </p>
            </div>
          ) : (
            <div key={message.id} className="appear">
              <p className="max-w-[90%] text-[12px] leading-5 text-nexus-text/90">
                {message.text}
                <span className="mt-1 block font-mono text-[10px] text-nexus-mute">
                  {message.time}
                </span>
              </p>
            </div>
          ),
        )}
        {busy ? (
          <p className="font-mono text-[11px] text-nexus-mute">the mind is writing…</p>
        ) : null}
      </div>

      {yoursId ? (
        <form onSubmit={onSubmit} className="mt-3 flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="A short public scenario…"
            className="h-10 flex-1 border border-nexus-line bg-transparent px-3 font-mono text-[12px] text-nexus-text outline-none placeholder:text-nexus-mute/70 focus:border-nexus-violet"
            maxLength={500}
            disabled={busy}
          />
          <button
            type="submit"
            className="flex h-10 w-10 items-center justify-center border border-nexus-line text-nexus-text hover:border-nexus-violet"
            aria-label="Send scenario"
            disabled={busy || !draft.trim()}
          >
            →
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={enterNode}
          className="mt-3 h-10 rounded-md border border-nexus-line font-mono text-[11px] tracking-[0.14em] text-nexus-mute hover:text-nexus-text"
        >
          Lock a cell to speak
        </button>
      )}
    </Panel>
  );
}
