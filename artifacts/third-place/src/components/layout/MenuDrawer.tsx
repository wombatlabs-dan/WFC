import { Link, useLocation } from "wouter";
import { Coffee, MapPin, History, ListPlus, HelpCircle, X } from "lucide-react";
import { useListDiscovery } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";

interface MenuDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MenuDrawer({ open, onClose }: MenuDrawerProps) {
  const [location] = useLocation();
  const { data: pendingDiscovery } = useListDiscovery({ status: "pending" });
  const pendingCount = pendingDiscovery?.length || 0;

  const items = [
    { path: "/", icon: Coffee, label: "Today" },
    { path: "/places", icon: MapPin, label: "Places" },
    { path: "/history", icon: History, label: "History" },
    { path: "/new", icon: ListPlus, label: "New", badge: pendingCount },
    { path: "/about", icon: HelpCircle, label: "About" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-64 flex flex-col"
            style={{ backgroundColor: '#F5F0E8', borderLeft: '1px solid rgba(44,24,16,0.1)', boxShadow: '-8px 0 32px rgba(44,24,16,0.15)' }}
          >
            <div className="flex items-center justify-between p-5 border-b border-border-theme">
              <span className="font-display text-xl text-ink">WFC</span>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-ink/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 px-3">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={onClose}
                    className={`flex items-center gap-3.5 px-3 py-3.5 rounded-xl mb-1 transition-colors relative ${
                      isActive
                        ? "bg-accent/10 text-accent"
                        : "text-ink-muted hover:text-ink hover:bg-ink/5"
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0 stroke-[1.5px]" />
                    <span className="font-medium text-base">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="p-5 border-t border-border-theme">
              <p className="text-xs text-ink-muted">Work From Coffeehouse</p>
              <p className="text-xs text-ink-muted/60 mt-0.5">v0.1.0</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
