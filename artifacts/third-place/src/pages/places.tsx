import { useState } from "react";
import { useListVenues, Venue } from "@workspace/api-client-react";
import { VenueCard } from "@/components/venues/VenueCard";
import { useLocation } from "wouter";
import { Search, MapPin, ChevronDown } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  "coffee-only": "Coffee Only",
  "coffee-food": "Coffee + Food",
  "coworking": "Coworking",
  "sandwich-lunch": "Lunch Spots",
};

const CATEGORY_ORDER = ["coffee-only", "coffee-food", "coworking", "sandwich-lunch"];

const FILTERS = [
  { value: "all", label: "All" },
  { value: "coffee-only", label: "Coffee Only" },
  { value: "coffee-food", label: "Coffee + Food" },
  { value: "sandwich-lunch", label: "Lunch Spot" },
];

const NEIGHBORHOODS = [
  "Anywhere in SF", "Bernal Heights", "Castro", "Cow Hollow", "Dogpatch",
  "Excelsior", "Financial District", "Haight", "Hayes Valley", "Inner Richmond",
  "Inner Sunset", "Lower Haight", "Marina", "Mission", "NoPa", "Nob Hill",
  "Noe Valley", "North Beach", "Outer Richmond", "Outer Sunset", "Pacific Heights",
  "Potrero Hill", "Russian Hill", "SoMa", "Tenderloin", "Union Square"
];

export default function Places() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [neighborhood, setNeighborhood] = useState("Anywhere in SF");
  const [, navigate] = useLocation();
  const { data: venues, isLoading } = useListVenues({ search: search || undefined });

  const activeVenues = venues?.filter(v => v.status === "active" || v.status === "unverified") || [];

  const neighborhoodFiltered = neighborhood === "Anywhere in SF"
    ? activeVenues
    : activeVenues.filter(v => v.neighborhood === neighborhood);

  const filteredActive = filter === "all"
    ? neighborhoodFiltered
    : neighborhoodFiltered.filter(v => v.category === filter);

  const byCategory = CATEGORY_ORDER.reduce<Record<string, Venue[]>>((acc, cat) => {
    acc[cat] = filteredActive.filter(v => v.category === cat);
    return acc;
  }, {});

  const isSearching = search.length > 0;

  function VenueRow({ venue }: { venue: Venue }) {
    return (
      <div onClick={() => navigate(`/places/${venue.id}`)} className="block cursor-pointer">
        <VenueCard venue={venue} />
      </div>
    );
  }

  return (
    <div className="p-4 pt-16 flex flex-col overflow-y-auto" style={{ height: '100%' }}>
      <div className="mb-6">
        <h1 className="font-display text-3xl text-ink mb-2">Places</h1>
      </div>

      <div className="flex items-stretch bg-surface border border-border-theme rounded-md mb-3 overflow-hidden focus-within:ring-1 focus-within:ring-accent">
        <div className="flex items-center pl-3 pointer-events-none flex-shrink-0">
          <Search className="h-4 w-4 text-ink-muted" />
        </div>
        <input
          type="text"
          placeholder="Search places..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-0 px-2 py-2.5 bg-transparent text-sm focus:outline-none text-ink placeholder:text-ink-muted/60"
        />
        <div className="w-px bg-border-theme self-stretch flex-shrink-0" />
        <div className="relative flex items-center flex-shrink-0">
          <MapPin className={`absolute left-3 h-3.5 w-3.5 pointer-events-none ${neighborhood !== "Anywhere in SF" ? "text-accent" : "text-ink-muted"}`} />
          <select
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            className="appearance-none bg-transparent pl-8 pr-7 py-2.5 text-xs font-semibold text-ink focus:outline-none cursor-pointer"
          >
            {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <ChevronDown className="absolute right-2 h-3 w-3 text-ink-muted pointer-events-none" />
        </div>
      </div>

      <div className="flex p-1 bg-surface border border-border-theme rounded-md shadow-sm mb-6">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`flex-1 py-2 text-xs font-medium rounded transition-colors ${filter === f.value ? 'bg-white/80 text-ink border border-border-theme shadow-sm' : 'text-ink-muted hover:text-ink'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="pb-24">
        {isLoading ? (
          <div className="text-center py-10 text-ink-muted">Loading places...</div>
        ) : filteredActive.length === 0 ? (
          <div className="text-center py-10 text-ink-muted">No places found.</div>
        ) : isSearching ? (
          <div className="space-y-4">
            {filteredActive.map(venue => <VenueRow key={venue.id} venue={venue} />)}
          </div>
        ) : filter === "all" ? (
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">
              All <span className="text-border-theme font-normal">({filteredActive.length})</span>
            </h2>
            {[...filteredActive].sort((a, b) => a.name.localeCompare(b.name)).map(venue => <VenueRow key={venue.id} venue={venue} />)}
          </div>
        ) : (
          <div className="space-y-8">
            {CATEGORY_ORDER.map(cat => {
              const group = byCategory[cat];
              if (!group || group.length === 0) return null;
              return (
                <section key={cat}>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">
                    {CATEGORY_LABELS[cat]} <span className="text-border-theme font-normal">({group.length})</span>
                  </h2>
                  <div className="space-y-4">
                    {[...group].sort((a, b) => a.name.localeCompare(b.name)).map(venue => <VenueRow key={venue.id} venue={venue} />)}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
