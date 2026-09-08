import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const getInitialTheme = (): 'light' | 'dark' => {
  const saved = localStorage.getItem('stockpilot_theme');
  return saved === 'light' ? 'light' : 'dark';
};

const applyThemeToDOM = (mode: 'light' | 'dark') => {
  const isLight = mode === 'light';
  const root = document.documentElement;
  root.classList.toggle('light-theme', isLight);
  root.classList.toggle('light', isLight);
  root.classList.toggle('dark-theme', !isLight);
  root.classList.toggle('dark', !isLight);
  root.setAttribute('data-theme', mode);
};

export interface ThemeState {
  mode: 'light' | 'dark';
}

const initialMode = getInitialTheme();
applyThemeToDOM(initialMode);

const initialState: ThemeState = {
  mode: initialMode
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'dark' ? 'light' : 'dark';
      localStorage.setItem('stockpilot_theme', state.mode);
      applyThemeToDOM(state.mode);
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.mode = action.payload;
      localStorage.setItem('stockpilot_theme', state.mode);
      applyThemeToDOM(state.mode);
    }
  }
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
