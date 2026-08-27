import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
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
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; accessToken: string }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.error = null;
      sessionStorage.setItem('user', JSON.stringify(action.payload.user));
      sessionStorage.setItem('accessToken', action.payload.accessToken);
    },
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      sessionStorage.setItem('accessToken', action.payload);
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.error = null;
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('accessToken');
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    }
  }
});

export const {
  setCredentials,
  setAccessToken,
  logout,
  setAuthLoading,
  setAuthError
} = authSlice.actions;

export default authSlice.reducer;
