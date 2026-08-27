import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const getInitialTheme = (): 'light' | 'dark' => {
  const saved = localStorage.getItem('stockpilot_theme');
  return saved === 'light' ? 'light' : 'dark';
};

export interface ThemeState {
  mode: 'light' | 'dark';
}

const initialState: ThemeState = {
  mode: getInitialTheme()
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'dark' ? 'light' : 'dark';
      localStorage.setItem('stockpilot_theme', state.mode);
      const root = document.documentElement;
      if (state.mode === 'light') {
        root.classList.add('light-theme');
        root.classList.remove('dark-theme');
        root.setAttribute('data-theme', 'light');
      } else {
        root.classList.add('dark-theme');
        root.classList.remove('light-theme');
        root.setAttribute('data-theme', 'dark');
      }
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.mode = action.payload;
      localStorage.setItem('stockpilot_theme', state.mode);
    }
  }
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
