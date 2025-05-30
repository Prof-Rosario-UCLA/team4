import { create } from "zustand";

const useUserStore = create((set) => ({
  users: [],
  isLoading: false,
  error: null,

  // Fetch all users
  fetchUsers: async (axiosPrivate) => {
    set({ isLoading: true, error: null });

    try {
      const response = await axiosPrivate.get("/api/user");
      set({ users: response.data, isLoading: false });
    } catch (error) {
      set({
        error: error.name === "CanceledError" ? null : error.message,
        isLoading: false,
      });
      throw error; // Re-throw to handle navigation in components
    }
  },

  // Clear users (useful for logout)
  clearUsers: () => set({ users: [], error: null }),
}));

export default useUserStore;
