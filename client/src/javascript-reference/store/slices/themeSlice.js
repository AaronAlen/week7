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

const applyThemeToDOM = (mode) => {
  const isLight = mode === 'light';
  const root = document.documentElement;
  root.classList.toggle('light-theme', isLight);
  root.classList.toggle('light', isLight);
  root.classList.toggle('dark-theme', !isLight);
  root.classList.toggle('dark', !isLight);
  root.setAttribute('data-theme', mode);
};

const initialMode = getInitialTheme();
applyThemeToDOM(initialMode);

const initialState = {
  mode: initialMode
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    // Toggle between light and dark mode with DOM class synchronization
    toggleTheme: (state) => {
      state.mode = state.mode === 'dark' ? 'light' : 'dark';
      localStorage.setItem('stockpilot_theme', state.mode);
      applyThemeToDOM(state.mode);
    },

    // Set specific theme mode
    setTheme: (state, action) => {
      state.mode = action.payload;
      localStorage.setItem('stockpilot_theme', state.mode);
      applyThemeToDOM(state.mode);
    }
  }
});

export const { toggleTheme, setTheme } = themeSlice.actions;

export default themeSlice.reducer;
