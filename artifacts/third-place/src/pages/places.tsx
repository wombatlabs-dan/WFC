import { useState } from "react";
import { useListVenues } from "@workspace/api-client-react";
import { VenueCard } from "@/components/venues/VenueCard";
import { useLocation } from "wouter";
import { Search } from "lucide-react";

export default function Places() {
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();
  const { data: venues, isLoading } = useListVenues({ search: search || undefined, status: "all" });

  const activeVenues = venues?.filter(v => v.status === "active" || v.status === "unverified") || [];
  const closedVenues = venues?.filter(v => v.status === "closed" || v.status === "temporarily-closed") || [];

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

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {isLoading ? (
          <div className="text-center py-10 text-ink-muted">Loading places...</div>
        ) : venues?.length === 0 ? (
          <div className="text-center py-10 text-ink-muted">No places found.</div>
        ) : (
          <>
            {activeVenues.map(venue => (
              <div key={venue.id} onClick={() => navigate(`/places/${venue.id}`)} className="block cursor-pointer">
                <VenueCard venue={venue} />
              </div>
            ))}
            
            {closedVenues.length > 0 && (
              <div className="mt-8 pt-6 border-t border-border-theme">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4">Closed & Temporarily Closed</h3>
                <div className="space-y-4">
                  {closedVenues.map(venue => (
                    <div key={venue.id} onClick={() => navigate(`/places/${venue.id}`)} className="block cursor-pointer">
                      <VenueCard venue={venue} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
