import { useState, useRef, useEffect } from "react";
import { useGetRandomVenue, useCreateVisit, useUpdateVisit, GetRandomVenueMode, getGetRandomVenueQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, ExternalLink, Coffee, Check, ArrowRight, X } from "lucide-react";

const NEIGHBORHOODS = [
  "Anywhere in SF", "Castro", "Dogpatch", "Financial District", "Haight", 
  "Hayes Valley", "Mission", "NoPa", "North Beach", "Outer Richmond", 
  "Outer Sunset", "Pacific Heights", "Russian Hill", "SoMa", "Union Square"
];

const MODES: { value: GetRandomVenueMode, label: string }[] = [
  { value: "coffee-only", label: "Coffee Only" },
  { value: "coffee-food", label: "Coffee + Food" },
  { value: "lunch-spot", label: "Lunch Spot" }
];

export default function Today() {
  const [neighborhood, setNeighborhood] = useState("Anywhere in SF");
  const [mode, setMode] = useState<GetRandomVenueMode>("coffee-only");
  
  const [appState, setAppState] = useState<"randomizer" | "heading-out" | "journal">("randomizer");
  const [currentVisitId, setCurrentVisitId] = useState<number | null>(null);

  const queryClient = useQueryClient();

  const { data: venue, refetch, isFetching, isError, error } = useGetRandomVenue({
    mode,
    neighborhood: neighborhood === "Anywhere in SF" ? undefined : neighborhood
  }, {
    query: {
      enabled: false,
      queryKey: getGetRandomVenueQueryKey({ mode, neighborhood: neighborhood === "Anywhere in SF" ? undefined : neighborhood })
    }
  });

  const createVisit = useCreateVisit();
  const updateVisit = useUpdateVisit();

  const handleRandomize = () => {
    refetch();
  };

  const handleGoingHere = () => {
    setAppState("heading-out");
  };

  const handleImHere = () => {
    if (!venue) return;
    createVisit.mutate({ data: { venueId: venue.id } }, {
      onSuccess: (visit) => {
        setCurrentVisitId(visit.id);
        setAppState("journal");
      }
    });
  };

  // Journal form state
  const [workedOn, setWorkedOn] = useState("");
  const [accomplished, setAccomplished] = useState("");
  const [whoSaw, setWhoSaw] = useState("");
  const [coffeeNotes, setCoffeeNotes] = useState("");

  const handleSaveJournal = () => {
    if (!currentVisitId) return;
    updateVisit.mutate({
      id: currentVisitId,
      data: { workedOn, accomplished, whoSaw, coffeeNotes }
    }, {
      onSuccess: () => {
        // Reset state
        setAppState("randomizer");
        setWorkedOn("");
        setAccomplished("");
        setWhoSaw("");
        setCoffeeNotes("");
        queryClient.invalidateQueries({ queryKey: ["/api/visits"] });
      }
    });
  };

  const handleSkipJournal = () => {
    setAppState("randomizer");
  };

  return (
    <div className="p-4 pt-8 h-full flex flex-col max-w-md mx-auto relative min-h-full">
      <AnimatePresence mode="wait">
        {appState === "randomizer" && (
          <motion.div 
            key="randomizer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col"
          >
            <div className="mb-8">
              <h1 className="font-display text-3xl text-ink mb-6 text-center">Where to today?</h1>
              
              <div className="space-y-4">
                <div className="relative">
                  <select 
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full appearance-none bg-surface border border-border-theme text-ink px-4 py-3 rounded-md font-sans focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent shadow-sm text-center font-medium"
                  >
                    {NEIGHBORHOODS.map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none border-l border-b border-ink-muted w-2.5 h-2.5 -rotate-45 transform translate-y-[-70%]" />
                </div>

                <div className="flex p-1 bg-surface border border-border-theme rounded-md shadow-sm">
                  {MODES.map(m => (
                    <button
                      key={m.value}
                      onClick={() => setMode(m.value)}
                      className={`flex-1 py-2 text-xs font-medium rounded transition-colors ${mode === m.value ? 'bg-sage-light text-sage border border-sage/20' : 'text-ink-muted hover:text-ink'}`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-auto mb-8 flex flex-col items-center">
              <button
                onClick={handleRandomize}
                disabled={isFetching}
                className="w-full bg-accent hover:bg-accent-hover text-surface font-display text-xl py-4 rounded-md shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {isFetching ? "Finding a spot..." : "Take me somewhere"}
                {!isFetching && <ArrowRight className="w-5 h-5" />}
              </button>
            </div>

            {isError && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-surface border border-border-theme rounded-md text-center text-ink-muted text-sm mt-4">
                No venues match these filters — try a different neighborhood or mode.
              </motion.div>
            )}

            {venue && !isFetching && !isError && (
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="fixed inset-x-4 bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)] z-40 max-w-md mx-auto"
              >
                <div className="bg-surface rounded-lg border border-border-theme p-6 md:p-8 shadow-[0_20px_40px_rgba(44,24,16,0.15)] relative overflow-hidden flex flex-col gap-5">
                  <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")" }} />
                  
                  <motion.button 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                    onClick={() => queryClient.setQueryData(getGetRandomVenueQueryKey({ mode, neighborhood: neighborhood === "Anywhere in SF" ? undefined : neighborhood }), null)}
                    className="absolute top-4 right-4 text-ink-muted hover:text-ink p-1 z-10"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <h2 className="font-display text-3xl leading-tight text-ink mb-2">{venue.name}</h2>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                      {venue.neighborhood && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{venue.neighborhood}</span>}
                      <span>•</span>
                      <span className="capitalize">{venue.category.replace("-", " ")}</span>
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex flex-wrap gap-2">
                    {venue.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-sage-light text-sage text-xs rounded font-medium border border-sage/20">{tag}</span>
                    ))}
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex items-center gap-6 text-sm py-3 border-y border-border-theme/50">
                    {venue.workRating && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-ink-muted text-xs uppercase tracking-wide font-bold">Work</span>
                        <div className="flex">{[...Array(5)].map((_, i) => <span key={i} className={i < venue.workRating! ? "text-accent" : "text-border-theme"}>★</span>)}</div>
                      </div>
                    )}
                    {venue.coffeeRating && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-ink-muted text-xs uppercase tracking-wide font-bold">Coffee</span>
                        <div className="flex">{[...Array(5)].map((_, i) => <Coffee key={i} className={`w-3.5 h-3.5 ${i < venue.coffeeRating! ? "text-ink" : "text-border-theme"}`} strokeWidth={i < venue.coffeeRating! ? 2.5 : 1.5} />)}</div>
                      </div>
                    )}
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="flex flex-col gap-1 text-sm text-ink-muted">
                    {venue.hours && <div className="text-ink">{venue.hours}</div>}
                    <div>
                      {venue.visitCount > 0 ? (
                        <span className="font-medium text-ink">{venue.visitCount} visits • {venue.lastVisited ? 'Been awhile' : ''}</span>
                      ) : (
                        <span className="text-accent font-medium">First visit!</span>
                      )}
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex gap-3 mt-2 relative z-10">
                    <button onClick={handleRandomize} className="flex-1 py-3 text-sm font-medium text-ink bg-surface border border-border-theme rounded hover:bg-base transition-colors">
                      Somewhere else
                    </button>
                    <button onClick={handleGoingHere} className="flex-1 py-3 text-sm font-medium text-surface bg-ink rounded hover:bg-ink/90 transition-colors flex items-center justify-center gap-1">
                      I'm going here <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {appState === "heading-out" && venue && (
          <motion.div 
            key="heading-out"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col justify-center py-12"
          >
            <div className="text-center mb-10">
              <h2 className="text-sm font-bold uppercase tracking-widest text-ink-muted mb-4">Heading to</h2>
              <h1 className="font-display text-4xl text-ink mb-3">{venue.name}</h1>
              {venue.address && <p className="text-ink/80 max-w-xs mx-auto">{venue.address}</p>}
            </div>

            <div className="space-y-4 max-w-sm mx-auto w-full mb-12">
              {venue.mapsUrl && (
                <a href={venue.mapsUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 py-3 bg-surface border border-border-theme rounded text-ink font-medium hover:bg-base transition-colors">
                  <Navigation className="w-4 h-4" /> Open in Maps
                </a>
              )}
              {venue.sourceUrl && (
                <a href={venue.sourceUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 py-3 bg-surface border border-border-theme rounded text-ink font-medium hover:bg-base transition-colors">
                  <ExternalLink className="w-4 h-4" /> Read article
                </a>
              )}
            </div>

            <div className="mt-auto flex flex-col items-center gap-6">
              <button 
                onClick={handleImHere}
                disabled={createVisit.isPending}
                className="w-full bg-accent hover:bg-accent-hover text-surface font-display text-xl py-4 rounded-md shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {createVisit.isPending ? "Logging..." : "I'm here — log my visit"}
                {!createVisit.isPending && <Check className="w-5 h-5" />}
              </button>
              
              <button onClick={() => setAppState("randomizer")} className="text-sm text-ink-muted hover:text-ink underline underline-offset-4 decoration-ink-muted/30">
                Actually, let me pick again
              </button>
            </div>
          </motion.div>
        )}

        {appState === "journal" && venue && (
          <motion.div 
            key="journal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col py-6"
          >
            <div className="mb-6 text-center">
              <h1 className="font-display text-2xl text-ink">Journal Entry</h1>
              <p className="text-sm text-ink-muted">{venue.name}</p>
            </div>

            <div className="space-y-5 flex-1 overflow-y-auto px-1 pb-20">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-ink-muted">What I worked on</label>
                <textarea 
                  value={workedOn} onChange={e => setWorkedOn(e.target.value)}
                  placeholder="Projects, tasks, client work..."
                  className="w-full bg-surface border border-border-theme rounded p-3 text-sm min-h-[80px] focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-ink-muted">What I accomplished</label>
                <textarea 
                  value={accomplished} onChange={e => setAccomplished(e.target.value)}
                  placeholder="Shipped, decided, made progress on..."
                  className="w-full bg-surface border border-border-theme rounded p-3 text-sm min-h-[80px] focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-ink-muted">Who I saw</label>
                <textarea 
                  value={whoSaw} onChange={e => setWhoSaw(e.target.value)}
                  placeholder="Notable conversations, chance encounters..."
                  className="w-full bg-surface border border-border-theme rounded p-3 text-sm min-h-[80px] focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-ink-muted">How was the coffee?</label>
                <textarea 
                  value={coffeeNotes} onChange={e => setCoffeeNotes(e.target.value)}
                  placeholder="What you ordered, quality, anything memorable..."
                  className="w-full bg-surface border border-border-theme rounded p-3 text-sm min-h-[80px] focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <div className="mt-auto pt-4 bg-base border-t border-border-theme flex flex-col gap-4 fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 p-4 max-w-md mx-auto z-20 shadow-[0_-10px_20px_rgba(245,240,232,0.9)]">
              <button 
                onClick={handleSaveJournal}
                disabled={updateVisit.isPending}
                className="w-full bg-ink hover:bg-ink/90 text-surface font-medium py-3.5 rounded-md transition-all flex items-center justify-center gap-2"
              >
                {updateVisit.isPending ? "Saving..." : "Save entry"}
              </button>
              <button onClick={handleSkipJournal} className="text-sm text-ink-muted hover:text-ink text-center pb-2">
                Skip for now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
