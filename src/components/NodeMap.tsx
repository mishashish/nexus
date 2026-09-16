"use client";

import { Panel } from "./ui";
import { Grid2x2 } from "lucide-react";
import { lotPrice, lotTag } from "@/lib/lots";
import { useNexus } from "@/lib/nexus-store";

export function NodeMap() {
  const { nodes, selectedId, selectNode, yoursId, startClaim } = useNexus();

  return (
    <section id="nodes" className="mt-10">
      <Panel className="p-6 sm:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="card-head mb-2">
              <Grid2x2 size={16} strokeWidth={1.5} />
              cortex map
            </p>
            <h2 className="section-title mb-0">The 128 lots</h2>
            <p className="sub mb-0 mt-2">
              Breathing squares are free. Click one — lock it with the pulse.
            </p>
          </div>
          <div className="flex gap-4 font-mono text-[11px] text-nexus-mute">
            <span className="flex items-center gap-2">
              <i className="lot-swatch lot-free" /> free
            </span>
            <span className="flex items-center gap-2">
              <i className="h-2 w-2 bg-[#db92ba]" /> claimed
            </span>
            <span className="flex items-center gap-2">
              <i className="h-2 w-2 bg-[#ec3f27]" /> yours
            </span>
            <span className="flex items-center gap-2">
              <i className="h-2 w-2 bg-[#fb67c5]" /> active
            </span>
          </div>
        </div>
        <div className="grid grid-cols-8 gap-px sm:grid-cols-[repeat(16,minmax(0,1fr))]">
          {nodes.map((node) => {
            const selected = node.id === selectedId;
            const yours = node.id === yoursId;
            const free = node.status === "available";
            let color = "bg-[#080601]";
            if (node.status === "claimed") color = "bg-[#db92ba]";
            if (node.status === "active") color = "bg-[#fb67c5]";
            if (yours) color = "bg-[#ec3f27]";
            if (free) color = "lot-free";
            const idx = node.index ?? 0;
            return (
              <button
                key={node.id}
                type="button"
                title={`${lotTag(idx)} · ${lotPrice(idx)} NX · ${node.status}`}
                onClick={() => {
                  if (free) startClaim(node.id);
                  else selectNode(node.id);
                  document.getElementById("network-panel")?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                }}
                className={`aspect-square ${color} ${
                  selected ? "outline outline-1 outline-offset-1 outline-[#f2f2f2]" : ""
                }`}
              />
            );
          })}
        </div>
      </Panel>
    </section>
  );
}
