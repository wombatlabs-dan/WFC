import { useListDiscovery, useApproveDiscovery, useRejectDiscovery, useRunDiscovery, getListDiscoveryQueryKey, getListVenuesQueryKey, useListVenues } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Check, X, RefreshCw, MapPin } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Link } from "wouter";

export default function NewPlaces() {
  const queryClient = useQueryClient();
  const { data: pendingItems, isLoading: loadingDiscovery } = useListDiscovery({ status: "pending" });
  const { data: recentlyAdded, isLoading: loadingRecent } = useListVenues({ status: "all" });
  
  const approveMutation = useApproveDiscovery();
  const rejectMutation = useRejectDiscovery();
  const runDiscoveryMutation = useRunDiscovery();

  const handleApprove = (id: number) => {
    approveMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDiscoveryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListVenuesQueryKey() });
      }
    });
  };

  const handleReject = (id: number) => {
    rejectMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDiscoveryQueryKey() });
      }
    });
  };

  const handleRunDiscovery = () => {
    runDiscoveryMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDiscoveryQueryKey() });
      }
    });
  };

  const recentVenues = recentlyAdded
    ?.filter(v => v.dateAdded)
    ?.sort((a, b) => new Date(b.dateAdded!).getTime() - new Date(a.dateAdded!).getTime())
    ?.slice(0, 10);

  return (
    <div className="p-4 pt-16 h-full flex flex-col overflow-y-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink">New</h1>
        <button 
          onClick={handleRunDiscovery} 
          disabled={runDiscoveryMutation.isPending}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent bg-accent/10 px-3 py-1.5 rounded hover:bg-accent/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${runDiscoveryMutation.isPending ? 'animate-spin' : ''}`} />
          {runDiscoveryMutation.isPending ? 'Searching...' : 'Find New'}
        </button>
      </div>

      <div className="mb-8">
        <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4 border-b border-border-theme pb-2">
          Pending Review ({pendingItems?.length || 0})
        </h2>
        
        {loadingDiscovery ? (
          <div className="text-sm text-ink-muted py-4">Loading queue...</div>
        ) : pendingItems?.length === 0 ? (
          <div className="text-sm text-ink-muted py-8 text-center bg-surface border border-border-theme border-dashed rounded-lg">
            No new places to review.
          </div>
        ) : (
          <div className="space-y-4">
            {pendingItems?.map(item => (
              <div key={item.id} className="bg-surface border border-border-theme rounded-lg p-4 shadow-sm">
                <h3 className="font-display text-xl text-ink mb-1">{item.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-ink-muted mb-3">
                  <MapPin className="w-3 h-3" />
                  {item.neighborhood || 'Unknown Area'} 
                  {item.address && <span className="truncate ml-1">• {item.address}</span>}
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-theme/50">
                  {item.sourceUrl ? (
                    <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:text-accent-hover flex items-center gap-1">
                      <ExternalLink className="w-3.5 h-3.5" /> Source
                    </a>
                  ) : <span />}
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleReject(item.id)}
                      disabled={rejectMutation.isPending || approveMutation.isPending}
                      className="px-3 py-1.5 text-xs font-medium text-ink-muted border border-border-theme rounded hover:bg-base"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleApprove(item.id)}
                      disabled={rejectMutation.isPending || approveMutation.isPending}
                      className="px-3 py-1.5 text-xs font-medium text-surface bg-ink rounded flex items-center gap-1 hover:bg-ink/90"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4 border-b border-border-theme pb-2">
          Recently Added
        </h2>
        
        {loadingRecent ? (
          <div className="text-sm text-ink-muted py-4">Loading recently added...</div>
        ) : recentVenues?.length === 0 ? (
          <div className="text-sm text-ink-muted py-4">No recently added places.</div>
        ) : (
          <div className="space-y-3">
            {recentVenues?.map(venue => (
              <Link key={venue.id} href={`/places/${venue.id}`} className="block bg-surface border border-border-theme rounded-lg p-3 hover:border-accent/30 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-ink">{venue.name}</h3>
                    <div className="text-xs text-ink-muted mt-0.5">{venue.neighborhood} • {venue.category.replace("-", " ")}</div>
                  </div>
                  {venue.dateAdded && (
                    <span className="text-[10px] text-ink-muted whitespace-nowrap">
                      {formatDistanceToNow(parseISO(venue.dateAdded))} ago
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
