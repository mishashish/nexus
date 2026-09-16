import { Lock, MessageSquare, Sparkles } from "lucide-react";
import { Panel } from "./ui";

const STEPS = [
  {
    n: "01",
    title: "Lock",
    icon: Lock,
    text: "Living cells bloom. Click one, then tap the flare three times — or hold until it fills.",
  },
  {
    n: "02",
    title: "Stir",
    icon: Sparkles,
    text: "The chamber is yours. Paint the sigil. Tap the pad when it lights. Neighbors feel it.",
  },
  {
    n: "03",
    title: "Speak",
    icon: MessageSquare,
    text: "Send a public scenario. The honeycomb jumps. The next thought has to carry it.",
  },
];

export function HowItWorks() {
  return (
    <section id="about" className="mt-10">
      <p className="kicker">the ritual</p>
      <h2 className="section-title">How it works</h2>
      <p className="sub">A seat is something you lock, not a form you submit.</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <Panel key={step.n} className="p-6">
              <p className="card-head mb-5">
                <Icon size={16} strokeWidth={1.5} />
                {step.n}
              </p>
              <h3 className="mb-2 text-xl font-extrabold tracking-[-0.03em]">{step.title}</h3>
              <p className="m-0 max-w-[36ch] text-sm leading-6 text-nexus-mute">{step.text}</p>
            </Panel>
          );
        })}
      </div>
    </section>
  );
}
