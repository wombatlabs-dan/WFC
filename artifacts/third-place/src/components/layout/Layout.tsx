import { ReactNode, useState } from "react";
import { useRoute } from "wouter";
import { Menu } from "lucide-react";
import { MenuDrawer } from "./MenuDrawer";
import { useBackground } from "@/contexts/background";

interface LayoutProps {
  children: ReactNode;
}

const OVERLAY = "rgba(245, 240, 232, 0.68)";

export function Layout({ children }: LayoutProps) {
  const { bgSrc } = useBackground();
  const [isToday] = useRoute("/");
  const showPhoto = isToday && Boolean(bgSrc);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="min-h-[100dvh] w-full text-ink font-sans flex flex-col max-w-md mx-auto overflow-hidden shadow-2xl ring-1 ring-border-theme relative"
      style={
        showPhoto
          ? {
              backgroundImage: `linear-gradient(${OVERLAY}, ${OVERLAY}), url(${JSON.stringify(bgSrc)})`,
              backgroundSize: "cover",
              backgroundPosition: "center center",
              backgroundRepeat: "no-repeat",
              backgroundColor: "var(--color-base)",
            }
          : { backgroundColor: "var(--color-base)" }
      }
    >
      <button
        onClick={() => setMenuOpen(true)}
        className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95"
        style={{ backgroundColor: 'rgba(245,240,232,0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(44,24,16,0.12)' }}
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-ink" strokeWidth={1.75} />
      </button>

      <main className="flex-1 w-full overflow-y-auto pb-[env(safe-area-inset-bottom)]">
        {children}
      </main>

      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
