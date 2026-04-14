import { Venue } from "@workspace/api-client-react";
import { MapPin, Coffee, ExternalLink, Navigation } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";

interface VenueCardProps {
  venue: Venue;
}

export function VenueCard({ venue }: VenueCardProps) {
  const isClosed = venue.status === "closed" || venue.status === "temporarily-closed";
  
  return (
    <div className={`p-4 bg-surface border border-border-theme rounded-lg relative overflow-hidden transition-all ${isClosed ? "opacity-60 grayscale hover:grayscale-0" : ""}`}>
      {/* Decorative grain */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")" }} />
      
      <div className="flex justify-between items-start gap-4 mb-2 relative z-10">
        <h3 className="font-display text-xl text-ink leading-tight">{venue.name}</h3>
        {venue.status === "closed" && (
          <span className="text-[10px] uppercase tracking-wider font-bold text-destructive bg-destructive/10 px-2 py-1 rounded-sm shrink-0">Closed</span>
        )}
        {venue.status === "temporarily-closed" && (
          <span className="text-[10px] uppercase tracking-wider font-bold text-accent bg-accent/10 px-2 py-1 rounded-sm shrink-0">Temp Closed</span>
        )}
        {venue.status === "unverified" && (
          <span className="text-[10px] uppercase tracking-wider font-bold text-ink-muted bg-ink-muted/10 px-2 py-1 rounded-sm shrink-0">Unverified</span>
        )}
      </div>
      
      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted mb-4 relative z-10">
        {venue.neighborhood && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {venue.neighborhood}
          </span>
        )}
        <span>•</span>
        <span className="capitalize">{venue.category.replace("-", " ")}</span>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4 relative z-10">
        {venue.tags.map(tag => (
          <span key={tag} className="px-2 py-0.5 bg-sage-light text-sage text-xs rounded font-medium border border-sage/20">
            {tag}
          </span>
        ))}
      </div>
      
      <div className="flex items-center gap-4 text-sm mb-4 relative z-10">
        {venue.workRating && (
          <div className="flex items-center gap-1.5" title={`Work Rating: ${venue.workRating}/5`}>
            <span className="text-ink-muted text-xs uppercase tracking-wide font-semibold">Work</span>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i < venue.workRating! ? "text-accent" : "text-border-theme"}>★</span>
              ))}
            </div>
          </div>
        )}
        {venue.coffeeRating && (
          <div className="flex items-center gap-1.5" title={`Coffee Rating: ${venue.coffeeRating}/5`}>
            <span className="text-ink-muted text-xs uppercase tracking-wide font-semibold">Coffee</span>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Coffee key={i} className={`w-3.5 h-3.5 ${i < venue.coffeeRating! ? "text-ink" : "text-border-theme"}`} strokeWidth={i < venue.coffeeRating! ? 2.5 : 1.5} />
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-theme relative z-10 text-xs text-ink-muted">
        <div>
          {venue.visitCount > 0 ? (
            <span className="font-medium text-ink">
              {venue.visitCount} {venue.visitCount === 1 ? "visit" : "visits"}
              {venue.lastVisited && ` • Last visited ${formatDistanceToNow(parseISO(venue.lastVisited))} ago`}
            </span>
          ) : (
            <span>Never visited</span>
          )}
        </div>
        
        <div className="flex gap-3">
          {venue.sourceUrl && (
            <a href={venue.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-hover transition-colors" title="Source Article" onClick={e => e.stopPropagation()}>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          {venue.mapsUrl && (
            <a href={venue.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-hover transition-colors" title="Google Maps" onClick={e => e.stopPropagation()}>
              <Navigation className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
