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

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../services/api.ts';

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

// Async Thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/login', credentials);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/register', userData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Registration failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout');
      return null;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Logout failed');
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/users/profile');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Failed to fetch user profile');
    }
  }
);

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
  },
  extraReducers: (builder) => {
    // loginUser
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.error = null;
      sessionStorage.setItem('user', JSON.stringify(action.payload.user));
      sessionStorage.setItem('accessToken', action.payload.accessToken);
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // registerUser
    builder.addCase(registerUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.error = null;
      sessionStorage.setItem('user', JSON.stringify(action.payload.user));
      sessionStorage.setItem('accessToken', action.payload.accessToken);
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // logoutUser
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.accessToken = null;
      state.error = null;
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('accessToken');
    });

    // fetchUserProfile
    builder.addCase(fetchUserProfile.fulfilled, (state, action) => {
      state.user = action.payload;
      sessionStorage.setItem('user', JSON.stringify(action.payload));
    });
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
