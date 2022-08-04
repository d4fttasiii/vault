import { defineStore } from 'pinia';

import type { JwtToken } from '@/models/jwt-token';

export const useJwtTokenStore = defineStore('jwtToken', {
  state: () => ({
    access_token: ''
  } as JwtToken),

  actions: {
    set(jwt: JwtToken) {
      if (!jwt) {
        return;
      }

      this.access_token = jwt.access_token;
    },

    remove() {
      this.access_token = '';
    }
  },
  getters: {
    isLoggedIn: (state): boolean => {
      return !!state.access_token;
    },
  }
})
