import { createContext, useContext, useState, ReactNode } from "react";

export const CAFÉ_PHOTOS = [
  "andytown-plants",
  "wrecking-ball-interior",
  "sightglass-hayes",
  "linea-caffe-desk",
  "ritual-espresso-bar",
  "saint-frank-barista",
  "mission-cafe-scene",
  "nopa-window-seat",
  "hanging-ferns",
  "vintage-counter",
];

function pickPhoto(): string {
  const name = CAFÉ_PHOTOS[Math.floor(Math.random() * CAFÉ_PHOTOS.length)];
  return `${import.meta.env.BASE_URL}photos/${name}.jpg`;
}

interface BackgroundContextValue {
  bgSrc: string;
}

const BackgroundContext = createContext<BackgroundContextValue>({ bgSrc: "" });

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const [bgSrc] = useState<string>(() => pickPhoto());
  return (
    <BackgroundContext.Provider value={{ bgSrc }}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  return useContext(BackgroundContext);
}
