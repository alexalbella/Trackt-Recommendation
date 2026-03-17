"use client";

import { create } from "zustand";

type ExplorationControls = {
  risk: number;
  niche: number;
  exploration: number;
  setControl: (key: "risk" | "niche" | "exploration", value: number) => void;
};

export const useExplorationStore = create<ExplorationControls>((set) => ({
  risk: 35,
  niche: 50,
  exploration: 40,
  setControl: (key, value) => set((state) => ({ ...state, [key]: value }))
}));
