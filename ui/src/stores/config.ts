import { create } from 'zustand';

type TableStore = {
  table: string;
  setTable: (newTable: string) => void;
}

export const useTableStore = create<TableStore>((set) => ({
  table: 'sample',
  setTable: ((newTable: string) => set({table: newTable}))
}))

