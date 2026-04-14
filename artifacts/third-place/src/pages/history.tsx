import { useState } from "react";
import { useListVisits, useGetVisitStats } from "@workspace/api-client-react";
import { VisitCard } from "@/components/visits/VisitCard";
import { Search } from "lucide-react";

export default function History() {
  const [search, setSearch] = useState("");
  const { data: visits, isLoading } = useListVisits();
  const { data: stats } = useGetVisitStats();

  const filteredVisits = visits?.filter(visit => 
    visit.venue.name.toLowerCase().includes(search.toLowerCase()) || 
    (visit.coffeeNotes && visit.coffeeNotes.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 pt-6 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-ink mb-2">History</h1>
        {stats && (
          <p className="text-ink-muted text-sm">
            You've logged {stats.totalVisits} visits to {stats.uniqueVenues} venues.
          </p>
        )}
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-ink-muted" />
        </div>
        <input
          type="text"
          placeholder="Search visits by venue or notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border-theme rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-accent text-ink placeholder:text-ink-muted/60"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {isLoading ? (
          <div className="text-center py-10 text-ink-muted">Loading history...</div>
        ) : filteredVisits?.length === 0 ? (
          <div className="text-center py-10 text-ink-muted">No visits found.</div>
        ) : (
          filteredVisits?.map(visit => (
            <VisitCard key={visit.id} visit={visit} />
          ))
        )}
      </div>
    </div>
  );
}
