"use client";

import type { ReactNode } from "react";

export function Panel({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`panel overflow-hidden ${className}`}>
      {children}
    </section>
  );
}

export function PanelHeading({
  kicker,
  title,
  extra,
}: {
  kicker?: string;
  title: string;
  extra?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {kicker ? <span className="text-nexus-mute">/</span> : null}
        <h2 className="panel-title">{title}</h2>
      </div>
      {extra}
    </div>
  );
}

export function GreenDot({ className = "" }: { className?: string }) {
  return (
    <span
      className={`status-dot inline-block h-1.5 w-1.5 rounded-full bg-nexus-green ${className}`}
    />
  );
}
