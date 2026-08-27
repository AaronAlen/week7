/**
 * =========================================================================
 * THEME STATE REDUX SLICE (PURE JAVASCRIPT VERSION)
 * =========================================================================
 * 
 * 🔍 KEY DIFFERENCES FROM TYPESCRIPT (themeSlice.ts):
 * 
 * 1. REMOVED ThemeState Interface.
 * 2. Return types omitted on helper functions (`getInitialTheme()`).
 */

import { createSlice } from '@reduxjs/toolkit';

const getInitialTheme = () => {
  const saved = localStorage.getItem('stockpilot_theme');
  return saved === 'light' ? 'light' : 'dark';
};

const initialState = {
  mode: getInitialTheme()
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    // Toggle between light and dark mode with DOM class synchronization
    toggleTheme: (state) => {
      state.mode = state.mode === 'dark' ? 'light' : 'dark';
      localStorage.setItem('stockpilot_theme', state.mode);
      const root = document.documentElement;
      if (state.mode === 'light') {
        root.classList.add('light-theme', 'light');
        root.classList.remove('dark-theme', 'dark');
        root.setAttribute('data-theme', 'light');
      } else {
        root.classList.add('dark-theme', 'dark');
        root.classList.remove('light-theme', 'light');
        root.setAttribute('data-theme', 'dark');
      }
    },

    // Set specific theme mode
    setTheme: (state, action) => {
      state.mode = action.payload;
      localStorage.setItem('stockpilot_theme', state.mode);
      const root = document.documentElement;
      if (state.mode === 'light') {
        root.classList.add('light-theme', 'light');
        root.classList.remove('dark-theme', 'dark');
        root.setAttribute('data-theme', 'light');
      } else {
        root.classList.add('dark-theme', 'dark');
        root.classList.remove('light-theme', 'light');
        root.setAttribute('data-theme', 'dark');
      }
    }
  }
});

export const { toggleTheme, setTheme } = themeSlice.actions;

export default themeSlice.reducer;
