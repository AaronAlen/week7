/**
 * =========================================================================
 * AUTH REDUX SLICE (PURE JAVASCRIPT VERSION)
 * =========================================================================
 * 
 * 🔍 KEY DIFFERENCES FROM TYPESCRIPT (authSlice.ts):
 * 
 * 1. REMOVED INTERFACES:
 *    - In TS: `export interface User { id: number; name: string; ... }`
 *    - In TS: `export interface AuthState { user: User | null; ... }`
 *    - In JS: No interfaces are needed. Objects are dynamically typed.
 * 
 * 2. REMOVED PayloadAction<T> GENERIC TYPES:
 *    - In TS: `setCredentials: (state, action: PayloadAction<{ user: User; accessToken: string }>) => { ... }`
 *    - In JS: `setCredentials: (state, action) => { ... }` (Payload is accessed directly as `action.payload`).
 */

import { createSlice } from '@reduxjs/toolkit';

// Initial state object
const initialState = {
  user: (() => {
    try {
      const saved = sessionStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })(),
  accessToken: sessionStorage.getItem('accessToken') || null,
  loading: false,
  error: null
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Action to store authenticated user profile and JWT token
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.error = null;
      sessionStorage.setItem('user', JSON.stringify(action.payload.user));
      sessionStorage.setItem('accessToken', action.payload.accessToken);
    },

    // Action to update access token after background refresh
    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
      sessionStorage.setItem('accessToken', action.payload);
    },

    // Action to clear session on logout
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.error = null;
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('accessToken');
    },

    // Action to set loading spinner
    setAuthLoading: (state, action) => {
      state.loading = action.payload;
    },

    // Action to record error message
    setAuthError: (state, action) => {
      state.error = action.payload;
    }
  }
});

// Export action creators generated automatically by createSlice
export const {
  setCredentials,
  setAccessToken,
  logout,
  setAuthLoading,
  setAuthError
} = authSlice.actions;

// Export reducer for store configuration
export default authSlice.reducer;
