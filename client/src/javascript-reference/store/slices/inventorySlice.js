/**
 * =========================================================================
 * INVENTORY TRANSACTIONS REDUX SLICE (PURE JAVASCRIPT VERSION)
 * =========================================================================
 * 
 * 🔍 KEY DIFFERENCES FROM TYPESCRIPT (inventorySlice.ts):
 * 
 * 1. REMOVED InventoryTransaction & InventoryState Interfaces.
 * 2. Reducer parameters are concise: `(state, action)` instead of `(state, action: PayloadAction<...>)`.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../services/api.ts';

const initialState = {
  transactions: [],
  loading: false,
  error: null
};

// Async Thunks
export const fetchTransactions = createAsyncThunk(
  'inventory/fetchTransactions',
  async (limit = 50, { rejectWithValue }) => {
    try {
      const res = await api.get(`/inventory/transactions?limit=${limit}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Failed to fetch inventory transactions');
    }
  }
);

export const adjustStock = createAsyncThunk(
  'inventory/adjustStock',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post('/inventory/adjust', payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Failed to adjust stock');
    }
  }
);

export const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    // Populate transactions list from server
    setTransactions: (state, action) => {
      state.transactions = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Prepend a new transaction (Sale, Restock, Adjustment) to the live feed
    addTransaction: (state, action) => {
      state.transactions.unshift(action.payload);
    },

    // Set loading indicator
    setInventoryLoading: (state, action) => {
      state.loading = action.payload;
    },

    // Record error message
    setInventoryError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    }
  },
  extraReducers: (builder) => {
    // fetchTransactions
    builder.addCase(fetchTransactions.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchTransactions.fulfilled, (state, action) => {
      state.transactions = action.payload;
      state.loading = false;
      state.error = null;
    });
    builder.addCase(fetchTransactions.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // adjustStock
    builder.addCase(adjustStock.fulfilled, (state, action) => {
      if (action.payload?.transaction) {
        state.transactions.unshift(action.payload.transaction);
      }
    });
  }
});

export const {
  setTransactions,
  addTransaction,
  setInventoryLoading,
  setInventoryError
} = inventorySlice.actions;

export default inventorySlice.reducer;
