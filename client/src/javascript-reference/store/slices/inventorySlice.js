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

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  transactions: [],
  loading: false,
  error: null
};

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
  }
});

export const {
  setTransactions,
  addTransaction,
  setInventoryLoading,
  setInventoryError
} = inventorySlice.actions;

export default inventorySlice.reducer;
