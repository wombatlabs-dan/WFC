import { useRunDiscovery, useRunValidation, useHealthCheck } from "@workspace/api-client-react";
import { Settings as SettingsIcon, Database, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

export default function Settings() {
  const { data: health } = useHealthCheck();
  const runDiscovery = useRunDiscovery();
  const runValidation = useRunValidation();

  const handleRunDiscovery = () => {
    runDiscovery.mutate(undefined);
  };

  const handleRunValidation = () => {
    runValidation.mutate(undefined);
  };

  return (
    <div className="p-4 pt-6 h-full flex flex-col overflow-y-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-ink flex items-center gap-3">
          <SettingsIcon className="w-6 h-6" /> Settings
        </h1>
      </div>

      <div className="space-y-6">
        <section className="bg-surface border border-border-theme rounded-lg p-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4 flex items-center gap-1.5">
            <Database className="w-4 h-4" /> System Status
          </h2>
          
          <div className="flex items-center justify-between text-sm py-2 border-b border-border-theme/50">
            <span className="text-ink">API Health</span>
            {health ? (
              <span className="flex items-center gap-1 text-sage font-medium"><CheckCircle2 className="w-4 h-4" /> Online</span>
            ) : (
              <span className="flex items-center gap-1 text-destructive font-medium"><AlertCircle className="w-4 h-4" /> Offline</span>
            )}
          </div>
          
          <div className="flex items-center justify-between text-sm py-2">
            <span className="text-ink">App Version</span>
            <span className="text-ink-muted">0.1.0</span>
          </div>
        </section>

        <section className="bg-surface border border-border-theme rounded-lg p-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4">Background Jobs</h2>
          
          <div className="space-y-4">
            <div className="border-b border-border-theme/50 pb-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-sm font-medium text-ink">Brave Search Discovery</h3>
                  <p className="text-xs text-ink-muted mt-1 max-w-[250px]">Searches for new coffee shops in SF and adds them to the review queue.</p>
                </div>
                <button 
                  onClick={handleRunDiscovery}
                  disabled={runDiscovery.isPending}
                  className="flex items-center gap-1.5 text-xs font-medium text-surface bg-ink px-3 py-1.5 rounded hover:bg-ink/90 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${runDiscovery.isPending ? 'animate-spin' : ''}`} /> Run
                </button>
              </div>
              {runDiscovery.isSuccess && (
                <div className="text-xs text-sage bg-sage-light p-2 rounded mt-2 border border-sage/20">
                  {runDiscovery.data?.message} (Found: {runDiscovery.data?.found || 0})
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-sm font-medium text-ink">Google Places Validation</h3>
                  <p className="text-xs text-ink-muted mt-1 max-w-[250px]">Updates hours, ratings, and status for existing unverified venues.</p>
                </div>
                <button 
                  onClick={handleRunValidation}
                  disabled={runValidation.isPending}
                  className="flex items-center gap-1.5 text-xs font-medium text-surface bg-ink px-3 py-1.5 rounded hover:bg-ink/90 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${runValidation.isPending ? 'animate-spin' : ''}`} /> Run
                </button>
              </div>
              {runValidation.isSuccess && (
                <div className="text-xs text-sage bg-sage-light p-2 rounded mt-2 border border-sage/20">
                  {runValidation.data?.message} (Updated: {runValidation.data?.updated || 0})
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-surface border border-border-theme rounded-lg p-4 opacity-70">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4">API Keys</h2>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-ink-muted mb-1">GOOGLE_PLACES_API_KEY</label>
              <div className="font-mono text-sm bg-base px-3 py-2 rounded border border-border-theme text-ink">
                •••••••••••••••••••••••••••••••••••••{import.meta.env.VITE_GOOGLE_PLACES_API_KEY?.slice(-4) || 'XXXX'}
              </div>
            </div>
            <div>
              <label className="block text-xs text-ink-muted mb-1">BRAVE_SEARCH_API_KEY</label>
              <div className="font-mono text-sm bg-base px-3 py-2 rounded border border-border-theme text-ink">
                •••••••••••••••••••••••••••••••••••••{import.meta.env.VITE_BRAVE_SEARCH_API_KEY?.slice(-4) || 'XXXX'}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
