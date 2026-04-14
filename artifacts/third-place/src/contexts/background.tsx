import { createContext, useContext, useState, ReactNode } from "react";

const CAFÉ_PHOTOS = [
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
  bgSrc: string | null;
  setBgSrc: (src: string | null) => void;
}

const BackgroundContext = createContext<BackgroundContextValue>({
  bgSrc: null,
  setBgSrc: () => {},
});

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const [bgSrc, setBgSrc] = useState<string | null>(() => pickPhoto());
  return (
    <BackgroundContext.Provider value={{ bgSrc, setBgSrc }}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  return useContext(BackgroundContext);
}
