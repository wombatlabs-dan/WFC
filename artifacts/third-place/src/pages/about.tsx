import { HelpCircle } from "lucide-react";

export default function About() {
  return (
    <div className="p-4 pt-16 h-full flex flex-col overflow-y-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-ink flex items-center gap-3">
          <HelpCircle className="w-6 h-6" /> About
        </h1>
      </div>

      <div className="bg-surface border border-border-theme rounded-lg p-5 space-y-4 text-ink leading-relaxed">
        <p className="font-display text-lg">
          Instead of work-from-home (wfh), you can work-from-coffeehouse (wfc).
        </p>
        <p className="text-sm">
          Right now this app is built for a party of one (me!), so it's specifically tailored to my requirements and interests.
        </p>
        <p className="text-sm">
          The venues shown in this app are hand-curated third wave coffee shops, all-day cafés, and casual lunch spots in San Francisco selected for their specialty coffee programs (pour-over bars, rotating single-origin beans, and serious sourcing) paired with genuine laptop-friendliness (wifi, outlets, and comfortable multi-hour stays).
        </p>
        <p className="text-sm">
          Chains, matcha-first spots, tourist-facing counters, and grab-and-go-only spots are excluded, as are any venues confirmed closed.
        </p>
        <p className="text-sm">
          Once a week, I work with my AI to update the list with any promising new coffee places, as well as update/remove any places that have closed or moved or are no longer open.
        </p>
        <p className="text-sm">
          Any suggestions/feedback? Email me at <a href="mailto:dan@wombatlabs.ai" className="text-accent underline underline-offset-2">dan@wombatlabs.ai</a>
        </p>
      </div>
    </div>
  );
}
