import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-[100dvh] w-full bg-base/[0.72] text-ink font-sans flex flex-col relative max-w-md mx-auto overflow-hidden shadow-2xl ring-1 ring-border-theme">
      <main className="flex-1 w-full overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom)+1rem)]">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
