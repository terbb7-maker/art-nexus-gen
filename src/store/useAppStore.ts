import { create } from "zustand";

export type Format = "feed-1-1" | "stories-9-16" | "banner-16-9" | "linkedin" | "flyer-a4";
export type Provider = "openai" | "gemini";
export type GenStatus = "idle" | "analyzing" | "composing" | "generating" | "done" | "error";

type S = {
  selectedFormat: Format;
  setFormat: (f: Format) => void;
  generationStatus: GenStatus;
  setGenStatus: (s: GenStatus) => void;
  results: string[];
  setResults: (r: string[]) => void;
  appendResult: (url: string) => void;
};

export const useAppStore = create<S>((set) => ({
  selectedFormat: "feed-1-1",
  setFormat: (f) => set({ selectedFormat: f }),
  generationStatus: "idle",
  setGenStatus: (s) => set({ generationStatus: s }),
  results: [],
  setResults: (r) => set({ results: r }),
  appendResult: (url) => set((s) => ({ results: [...s.results, url] })),
}));

export const FORMAT_LABELS: Record<Format, string> = {
  "feed-1-1": "Feed 1:1",
  "stories-9-16": "Stories 9:16",
  "banner-16-9": "Banner 16:9",
  "linkedin": "LinkedIn 1.91:1",
  "flyer-a4": "Flyer A4",
};
