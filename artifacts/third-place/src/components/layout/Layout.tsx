import { ReactNode } from "react";
import { useRoute } from "wouter";
import { BottomNav } from "./BottomNav";
import { useBackground } from "@/contexts/background";

interface LayoutProps {
  children: ReactNode;
}

const OVERLAY = "rgba(245, 240, 232, 0.78)";

export function Layout({ children }: LayoutProps) {
  const { bgSrc } = useBackground();
  const [isToday] = useRoute("/");
  const showPhoto = isToday && Boolean(bgSrc);

  return (
    <div
      className="min-h-[100dvh] w-full text-ink font-sans flex flex-col max-w-md mx-auto overflow-hidden shadow-2xl ring-1 ring-border-theme"
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
      <main className="flex-1 w-full overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom)+1rem)]">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
