import { Link } from "wouter";
import { Coffee } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-base text-ink px-6">
      <Coffee className="w-12 h-12 text-accent mb-6 opacity-60" />
      <h1 className="font-display text-4xl text-ink mb-3">Wrong turn.</h1>
      <p className="text-muted text-sm text-center max-w-xs mb-8">
        This page doesn't exist. Maybe it's time to find a good café instead.
      </p>
      <Link href="/" className="text-sm font-medium text-accent underline underline-offset-4">
        Back to Today →
      </Link>
    </div>
  );
}
