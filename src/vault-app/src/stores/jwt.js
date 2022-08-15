import { defineStore } from "pinia";

export const useJwtStore = defineStore({
  id: "jwt",
  state: () => ({
    token: "",
  }),
  getters: {
    isLoggedIn: (state) => !!state.token
  },
  actions: {
    set(newToken) {
      this.token = newToken;
    },
    reset() {
      this.token = "";
    },
  },
});
