import { create } from "zustand";

interface WealthState {
  portfolioData: any | null;
  globalToastMessage: { text: string; type: "success" | "danger" | "warning" } | null;
  setPortfolioData: (data: any) => void;
  triggerToast: (text: string, type: "success" | "danger" | "warning") => void;
  clearToast: () => void;
}

export const useWealthStore = create<WealthState>((set) => ({
  portfolioData: null,
  globalToastMessage: null,
  setPortfolioData: (data) => set({ portfolioData: data }),
  triggerToast: (text, type) => {
    set({ globalToastMessage: { text, type } });
    setTimeout(() => set({ globalToastMessage: null }), 4000);
  },
  clearToast: () => set({ globalToastMessage: null }),
}));