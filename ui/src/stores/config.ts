import { create } from 'zustand';

type TableStore = {
  table: string;
  setTable: (newTable: string) => void;
}

export const useTableStore = create<TableStore>((set) => ({
  table: 'ct',
  setTable: ((newTable: string) => set({table: newTable}))
}))

