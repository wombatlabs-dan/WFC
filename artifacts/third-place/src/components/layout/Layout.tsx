import { ReactNode } from "react";
import { useRoute } from "wouter";
import { BottomNav } from "./BottomNav";
import { useBackground } from "@/contexts/background";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { bgSrc } = useBackground();
  const [isToday] = useRoute("/");
  const showPhoto = isToday && Boolean(bgSrc);

  return (
    <div
      className="min-h-[100dvh] w-full text-ink font-sans flex flex-col relative max-w-md mx-auto overflow-hidden shadow-2xl ring-1 ring-border-theme bg-background"
    >
      {showPhoto && (
        <>
          <img
            src={bgSrc!}
            aria-hidden="true"
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              zIndex: 0,
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(245, 240, 232, 0.72)",
              zIndex: 1,
            }}
          />
        </>
      )}
      <main
        className="flex-1 w-full overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom)+1rem)]"
        style={{ position: "relative", zIndex: 2 }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
