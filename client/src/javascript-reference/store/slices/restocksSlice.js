/**
 * =========================================================================
 * RESTOCKS & PURCHASE ORDERS REDUX SLICE (PURE JAVASCRIPT VERSION)
 * =========================================================================
 * 
 * 🔍 KEY DIFFERENCES FROM TYPESCRIPT (restocksSlice.ts):
 * 
 * 1. REMOVED RestockItem, PurchaseOrderItem, RestocksState Interfaces.
 * 2. Standard JavaScript syntax with zero type annotations.
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  requests: [],
  purchaseOrders: [],
  loading: false,
  error: null
};

export const restocksSlice = createSlice({
  name: 'restocks',
  initialState,
  reducers: {
    // Set all restock requests
    setRestockRequests: (state, action) => {
      state.requests = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Add newly triggered restock request
    addRestockRequest: (state, action) => {
      state.requests.unshift(action.payload);
    },

    // Update existing restock status in list
    updateRestockRequest: (state, action) => {
      const idx = state.requests.findIndex(r => r.id === action.payload.id);
      if (idx !== -1) {
        state.requests[idx] = action.payload;
      }
    },

    // Set all purchase orders
    setPurchaseOrders: (state, action) => {
      state.purchaseOrders = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Add newly dispatched PO
    addPurchaseOrder: (state, action) => {
      state.purchaseOrders.unshift(action.payload);
    },

    // Update purchase order status (SENT, FULFILLED, CANCELLED)
    updatePurchaseOrder: (state, action) => {
      const idx = state.purchaseOrders.findIndex(p => p.id === action.payload.id);
      if (idx !== -1) {
        state.purchaseOrders[idx] = action.payload;
      }
    },

    // Toggle loading state
    setRestocksLoading: (state, action) => {
      state.loading = action.payload;
    },

    // Set error message
    setRestocksError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    }
  }
});

export const {
  setRestockRequests,
  addRestockRequest,
  updateRestockRequest,
  setPurchaseOrders,
  addPurchaseOrder,
  updatePurchaseOrder,
  setRestocksLoading,
  setRestocksError
} = restocksSlice.actions;

export default restocksSlice.reducer;
