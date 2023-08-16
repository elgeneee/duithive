import { create } from "zustand";

// interface INav {
//   currNav: string;
//   setCurrNav: (newNav: string) => void;
// }
type NavStore = {
  imgUrl: string;
  setImgUrl: (newImgUrl: string) => void;
  username: string;
  setUsername: (newUsername: string) => void;
};

// export const useSideNavStore = create<INav>((set) => ({
//   currNav: "Dashboard",
//   setCurrNav: (newNav: string) => set({ currNav: newNav }),
// }));

export const useNavStore = create<NavStore>((set) => ({
  imgUrl: "",
  setImgUrl: (imgUrl: string) => set({ imgUrl: imgUrl }),
  username: "",
  setUsername: (username: string) => set({ username: username }),
}));
