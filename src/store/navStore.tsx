import create from "zustand";

interface INav {
  currNav: string;
  setCurrNav: (newNav: string) => void;
}
export const useNavStore = create<INav>((set) => ({
  currNav: "Dashboard",
  setCurrNav: (newNav: string) => set({ currNav: newNav }),
}));
