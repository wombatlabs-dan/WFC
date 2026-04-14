import { VisitWithVenue } from "@workspace/api-client-react";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { MapPin, Calendar, CheckSquare, Users, Coffee } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

interface VisitCardProps {
  visit: VisitWithVenue;
  expanded?: boolean;
}

export function VisitCard({ visit, expanded = false }: VisitCardProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  
  const date = parseISO(visit.visitedAt);
  
  const hasNotes = visit.workedOn || visit.accomplished || visit.whoSaw || visit.coffeeNotes;

  return (
    <div 
      className={`bg-surface border border-border-theme rounded-lg overflow-hidden transition-all duration-200 cursor-pointer hover:border-accent/30`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="p-4">
        <div className="flex justify-between items-start gap-4 mb-2">
          <Link href={`/places/${visit.venueId}`} onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-lg text-ink hover:text-accent transition-colors">{visit.venue.name}</h3>
          </Link>
          <div className="text-right text-xs text-ink-muted">
            <span className="block font-medium text-ink">{format(date, "MMM d, yyyy")}</span>
            <span>{formatDistanceToNow(date)} ago</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 text-xs text-ink-muted mb-3">
          <MapPin className="w-3.5 h-3.5" />
          {visit.venue.neighborhood || "Unknown neighborhood"}
        </div>
        
        {!isExpanded && (
          <p className="text-sm text-ink/80 italic line-clamp-2 mt-2">
            {visit.coffeeNotes ? visit.coffeeNotes : hasNotes ? "Journal entry attached." : "No notes for this visit."}
          </p>
        )}
        
        {isExpanded && hasNotes && (
          <div className="mt-4 space-y-4 pt-4 border-t border-border-theme/50">
            {visit.workedOn && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> What I worked on
                </h4>
                <p className="text-sm text-ink whitespace-pre-wrap">{visit.workedOn}</p>
              </div>
            )}
            
            {visit.accomplished && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-1 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5" /> What I accomplished
                </h4>
                <p className="text-sm text-ink whitespace-pre-wrap">{visit.accomplished}</p>
              </div>
            )}
            
            {visit.whoSaw && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Who I saw
                </h4>
                <p className="text-sm text-ink whitespace-pre-wrap">{visit.whoSaw}</p>
              </div>
            )}
            
            {visit.coffeeNotes && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-1 flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5" /> How was the coffee
                </h4>
                <p className="text-sm text-ink whitespace-pre-wrap">{visit.coffeeNotes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
