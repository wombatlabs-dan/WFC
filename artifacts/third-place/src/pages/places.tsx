import { useState } from "react";
import { useListVenues, Venue } from "@workspace/api-client-react";
import { VenueCard } from "@/components/venues/VenueCard";
import { useLocation } from "wouter";
import { Search } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  "coffee-only": "Coffee Only",
  "coffee-food": "Coffee + Food",
  "coworking": "Coworking",
  "sandwich-lunch": "Lunch Spots",
};

const CATEGORY_ORDER = ["coffee-only", "coffee-food", "coworking", "sandwich-lunch"];

export default function Places() {
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();
  const { data: venues, isLoading } = useListVenues({ search: search || undefined, status: "all" });

  const activeVenues = venues?.filter(v => v.status === "active" || v.status === "unverified") || [];
  const closedVenues = venues?.filter(v => v.status === "closed" || v.status === "temporarily-closed") || [];

  const byCategory = CATEGORY_ORDER.reduce<Record<string, Venue[]>>((acc, cat) => {
    acc[cat] = activeVenues.filter(v => v.category === cat);
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
    <div className="p-4 pt-6 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-ink mb-2">Places</h1>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-ink-muted" />
        </div>
        <input
          type="text"
          placeholder="Search places by name or neighborhood..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border-theme rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-accent text-ink placeholder:text-ink-muted/60"
        />
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {isLoading ? (
          <div className="text-center py-10 text-ink-muted">Loading places...</div>
        ) : venues?.length === 0 ? (
          <div className="text-center py-10 text-ink-muted">No places found.</div>
        ) : isSearching ? (
          <div className="space-y-4">
            {activeVenues.map(venue => <VenueRow key={venue.id} venue={venue} />)}
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
                    {group.map(venue => <VenueRow key={venue.id} venue={venue} />)}
                  </div>
                </section>
              );
            })}

            {closedVenues.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">
                  Closed & Temporarily Closed <span className="text-border-theme font-normal">({closedVenues.length})</span>
                </h2>
                <div className="space-y-4">
                  {closedVenues.map(venue => <VenueRow key={venue.id} venue={venue} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
