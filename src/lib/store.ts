import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface KeyValuePair {
  id: string;
  check: boolean;
  key: string;
  value: string;
  description: string;
}

interface HistoryEntry {
  id: string;
  method: string;
  url: string;
  status: number;
  headers: KeyValuePair[]; // Full snapshot of headers
  body: string; // Full snapshot of the JSON body
  savedResponse: any; // The response data received
  time: number;
  timestamp: number;
}

interface ApiState {
  method: string;
  url: string;
  headers: KeyValuePair[];
  history: HistoryEntry[];
  setMethod: (method: string) => void;
  setUrl: (url: string) => void;
  // This function restores the entire request state from a history item
  setFullState: (entry: HistoryEntry) => void;
  updateHeader: (id: string, field: keyof KeyValuePair, value: any) => void;
  addHeader: () => void;
  deleteHeader: (id: string) => void;
  addToHistory: (entry: HistoryEntry) => void;
  removeHistoryItem: (id: string) => void;
  clearHistory: () => void;
}

export const useApiStore = create<ApiState>()(
  persist(
    (set) => ({
      method: "GET",
      url: "",
      headers: [
        {
          id: "1",
          check: true,
          key: "Content-Type",
          value: "application/json",
          description: "",
        },
      ],
      history: [],
      setMethod: (method) => set({ method }),
      setUrl: (url) => set({ url }),

      // Add this inside your useApiStore persist block
      setHeaders: (newHeaders: KeyValuePair[]) => set({ headers: newHeaders }),
      // Implementation to restore state from history
      setFullState: (entry) =>
        set({
          method: entry.method,
          url: entry.url,
          headers: entry.headers,
        }),

      updateHeader: (id, field, value) =>
        set((state) => ({
          headers: state.headers.map((h) =>
            h.id === id ? { ...h, [field]: value } : h,
          ),
        })),
      addHeader: () =>
        set((state) => ({
          headers: [
            ...state.headers,
            {
              id: Date.now().toString(),
              check: true,
              key: "",
              value: "",
              description: "",
            },
          ],
        })),
      deleteHeader: (id) =>
        set((state) => ({
          headers: state.headers.filter((h) => h.id !== id),
        })),

      // --- History Logic ---
      addToHistory: (entry) =>
        set((state) => ({
          history: [entry, ...state.history].slice(0, 50),
        })),

      removeHistoryItem: (id) =>
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        })),

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: "velox-api-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
