import { Link, useLocation } from "wouter";
import { Coffee, MapPin, History, Sparkles, Settings } from "lucide-react";
import { useListDiscovery } from "@workspace/api-client-react";

export function BottomNav() {
  const [location] = useLocation();
  const { data: pendingDiscovery } = useListDiscovery({ status: "pending" });
  
  const pendingCount = pendingDiscovery?.length || 0;

  const tabs = [
    { path: "/", icon: Coffee, label: "Today" },
    { path: "/places", icon: MapPin, label: "Places" },
    { path: "/history", icon: History, label: "History" },
    { path: "/new", icon: Sparkles, label: "New", badge: pendingCount },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/20 backdrop-blur-md border-t border-border-theme pb-safe pt-2 px-2 shadow-[0_-4px_20px_rgba(44,24,16,0.05)]">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location === tab.path;
          
          return (
            <Link key={tab.path} href={tab.path} className="relative flex flex-col items-center justify-center w-16 h-12">
              <div className={`flex flex-col items-center gap-1 transition-colors ${isActive ? "text-accent" : "text-ink-muted"}`}>
                <div className="relative">
                  <Icon className="w-6 h-6 stroke-[1.5px]" />
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium font-sans">{tab.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
