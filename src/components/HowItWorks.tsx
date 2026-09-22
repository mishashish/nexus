import { Lock, MessageSquare, UserRound } from "lucide-react";
import { Panel } from "./ui";

const STEPS = [
  {
    n: "01",
    title: "Claim a lot",
    icon: Lock,
    text: "Open a featured contract or a free cell on the honeycomb. Connect a browser wallet on Base Sepolia to buy — treasury must be set for checkout.",
  },
  {
    n: "02",
    title: "Open cabinet",
    icon: UserRound,
    text: "Your cell description, wallet, and traces live in the cabinet — a personal account for the seat you hold.",
  },
  {
    n: "03",
    title: "Speak",
    icon: MessageSquare,
    text: "Send a public scenario. The reply becomes part of the shared memory of the structure.",
  },
];

export function HowItWorks() {
  return (
    <section id="about" className="mt-10">
      <p className="kicker">product</p>
      <h2 className="section-title">How it works</h2>
      <p className="sub">Three steps. One brain map. No live token.</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <Panel key={step.n} className="p-6">
              <p className="card-head mb-5">
                <Icon size={16} strokeWidth={1.5} />
                {step.n}
              </p>
              <h3 className="mb-2 text-xl font-extrabold tracking-[-0.03em]">
                {step.title}
              </h3>
              <p className="m-0 max-w-[36ch] text-sm leading-6 text-nexus-mute">
                {step.text}
              </p>
            </Panel>
          );
        })}
      </div>
    </section>
  );
}
