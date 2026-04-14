import { useState } from "react";
import { useGetVenue, useUpdateVenue, useGetVenueVisits, UpdateVenueBodyStatus, getGetVenueQueryKey, getGetVenueVisitsQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { ArrowLeft, Edit2, MapPin, Navigation, ExternalLink, Save, X } from "lucide-react";
import { VisitCard } from "@/components/visits/VisitCard";
import { useQueryClient } from "@tanstack/react-query";

export default function PlaceDetail() {
  const { id } = useParams<{ id: string }>();
  const venueId = parseInt(id, 10);
  
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const { data: venue, isLoading } = useGetVenue(venueId, { 
    query: { enabled: !!venueId, queryKey: getGetVenueQueryKey(venueId) } 
  });
  
  const { data: visits } = useGetVenueVisits(venueId, {
    query: { enabled: !!venueId, queryKey: getGetVenueVisitsQueryKey(venueId) }
  });

  const updateVenue = useUpdateVenue();

  // Edit state
  const [editData, setEditData] = useState({
    hours: "",
    tags: "",
    workRating: "",
    coffeeRating: "",
    status: "active" as UpdateVenueBodyStatus,
    notes: ""
  });

  const startEditing = () => {
    if (!venue) return;
    setEditData({
      hours: venue.hours || "",
      tags: venue.tags.join(", "),
      workRating: venue.workRating?.toString() || "",
      coffeeRating: venue.coffeeRating?.toString() || "",
      status: venue.status as UpdateVenueBodyStatus,
      notes: venue.notes || ""
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateVenue.mutate({
      id: venueId,
      data: {
        hours: editData.hours || undefined,
        tags: editData.tags ? editData.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        workRating: editData.workRating ? parseInt(editData.workRating) : undefined,
        coffeeRating: editData.coffeeRating ? parseInt(editData.coffeeRating) : undefined,
        status: editData.status,
        notes: editData.notes || undefined
      }
    }, {
      onSuccess: () => {
        setIsEditing(false);
        queryClient.invalidateQueries({ queryKey: getGetVenueQueryKey(venueId) });
      }
    });
  };

  if (isLoading) return <div className="p-8 text-center text-ink-muted">Loading...</div>;
  if (!venue) return <div className="p-8 text-center text-ink-muted">Venue not found.</div>;

  return (
    <div className="p-4 pt-6 h-full flex flex-col overflow-y-auto">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/places" className="flex items-center gap-1 text-ink-muted hover:text-ink text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to places
        </Link>
        {!isEditing ? (
          <button onClick={startEditing} className="flex items-center gap-1.5 text-accent hover:text-accent-hover text-sm font-medium px-3 py-1.5 rounded bg-accent/10">
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => setIsEditing(false)} className="p-1.5 text-ink-muted hover:text-ink" disabled={updateVenue.isPending}>
              <X className="w-4 h-4" />
            </button>
            <button onClick={handleSave} className="flex items-center gap-1.5 text-surface bg-ink px-3 py-1.5 rounded text-sm font-medium" disabled={updateVenue.isPending}>
              {updateVenue.isPending ? "Saving..." : <><Save className="w-3.5 h-3.5" /> Save</>}
            </button>
          </div>
        )}
      </div>

      <div className="bg-surface border border-border-theme rounded-lg p-5 mb-8 shadow-sm">
        <h1 className="font-display text-3xl text-ink mb-2">{venue.name}</h1>
        <div className="flex items-center gap-1.5 text-sm text-ink-muted mb-4">
          <MapPin className="w-4 h-4" />
          {venue.address}
        </div>

        {isEditing ? (
          <div className="space-y-4 mt-6 pt-6 border-t border-border-theme">
            <div>
              <label className="text-xs font-bold uppercase text-ink-muted block mb-1.5">Status</label>
              <select value={editData.status} onChange={e => setEditData({...editData, status: e.target.value as UpdateVenueBodyStatus})} className="w-full bg-base border border-border-theme rounded p-2 text-sm">
                <option value="active">Active</option>
                <option value="closed">Closed</option>
                <option value="temporarily-closed">Temporarily Closed</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-ink-muted block mb-1.5">Hours</label>
              <input type="text" value={editData.hours} onChange={e => setEditData({...editData, hours: e.target.value})} className="w-full bg-base border border-border-theme rounded p-2 text-sm" placeholder="e.g. Mon-Fri 7am-4pm" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-ink-muted block mb-1.5">Tags (comma separated)</label>
              <input type="text" value={editData.tags} onChange={e => setEditData({...editData, tags: e.target.value})} className="w-full bg-base border border-border-theme rounded p-2 text-sm" placeholder="wifi, outlets, loud" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs font-bold uppercase text-ink-muted block mb-1.5">Work Rating (1-5)</label>
                <input type="number" min="1" max="5" value={editData.workRating} onChange={e => setEditData({...editData, workRating: e.target.value})} className="w-full bg-base border border-border-theme rounded p-2 text-sm" />
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold uppercase text-ink-muted block mb-1.5">Coffee Rating (1-5)</label>
                <input type="number" min="1" max="5" value={editData.coffeeRating} onChange={e => setEditData({...editData, coffeeRating: e.target.value})} className="w-full bg-base border border-border-theme rounded p-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-ink-muted block mb-1.5">Private Notes</label>
              <textarea value={editData.notes} onChange={e => setEditData({...editData, notes: e.target.value})} className="w-full bg-base border border-border-theme rounded p-2 text-sm min-h-[80px]" placeholder="Good spot by the window..." />
            </div>
          </div>
        ) : (
          <div className="space-y-4 mt-6">
            {(venue.hours || venue.tags.length > 0) && (
              <div className="pt-4 border-t border-border-theme space-y-3 text-sm">
                {venue.hours && <div><span className="font-medium text-ink-muted mr-2">Hours:</span> {venue.hours}</div>}
                {venue.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {venue.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-sage-light text-sage text-xs rounded font-medium border border-sage/20">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="flex gap-4 pt-4 border-t border-border-theme">
              {venue.mapsUrl && (
                <a href={venue.mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-accent hover:underline text-sm font-medium">
                  <Navigation className="w-4 h-4" /> Google Maps
                </a>
              )}
              {venue.sourceUrl && (
                <a href={venue.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-accent hover:underline text-sm font-medium">
                  <ExternalLink className="w-4 h-4" /> Source Article
                </a>
              )}
            </div>
            
            {venue.notes && (
              <div className="pt-4 border-t border-border-theme">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">Private Notes</h4>
                <p className="text-sm text-ink bg-base p-3 rounded border border-border-theme/50 whitespace-pre-wrap">{venue.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl text-ink">Past Visits</h2>
        <span className="text-xs font-bold uppercase text-ink-muted">{venue.visitCount} Total</span>
      </div>

      <div className="space-y-4">
        {!visits || visits.length === 0 ? (
          <div className="text-center py-8 text-ink-muted bg-surface rounded-lg border border-border-theme border-dashed">
            You haven't logged any visits here yet.
          </div>
        ) : (
          visits.map(visit => (
            <VisitCard key={visit.id} visit={{...visit, venue}} expanded={visits.length === 1} />
          ))
        )}
      </div>
    </div>
  );
}
