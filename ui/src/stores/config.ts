import { create } from 'zustand';

type ConfigStore = {
  table: string;
  connectionType: string;
  connectionURL: string;

  setTable: (newTable: string) => void;
  setConnectionType: (newType: string) => void;
  setConnectionURL: (newURL: string) => void;
};

export const useConfigStore = create<ConfigStore>((set) => ({
  table: 'sample_unfiltered',
  connectionType: 'wasm',
  connectionURL: 'ws://localhost:3000/',

  setTable: (newTable: string) => set({ table: newTable }),
  setConnectionType: (newType: string) => set({ connectionType: newType }),
  setConnectionURL: (newURL: string) => set({ connectionURL: newURL }),
}));
