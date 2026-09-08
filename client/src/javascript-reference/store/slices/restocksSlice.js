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

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../services/api.ts';

const initialState = {
  requests: [],
  purchaseOrders: [],
  loading: false,
  error: null
};

// Async Thunks
export const fetchRestockRequests = createAsyncThunk(
  'restocks/fetchRestockRequests',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/restocks');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Failed to fetch restock requests');
    }
  }
);

export const fetchPurchaseOrders = createAsyncThunk(
  'restocks/fetchPurchaseOrders',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/purchase-orders');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Failed to fetch purchase orders');
    }
  }
);

export const receiveStockDelivery = createAsyncThunk(
  'restocks/receiveStockDelivery',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post('/inventory/receive', payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Failed to receive stock delivery');
    }
  }
);

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
  },
  extraReducers: (builder) => {
    // fetchRestockRequests
    builder.addCase(fetchRestockRequests.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchRestockRequests.fulfilled, (state, action) => {
      state.requests = action.payload;
      state.loading = false;
      state.error = null;
    });
    builder.addCase(fetchRestockRequests.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // fetchPurchaseOrders
    builder.addCase(fetchPurchaseOrders.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPurchaseOrders.fulfilled, (state, action) => {
      state.purchaseOrders = action.payload;
      state.loading = false;
      state.error = null;
    });
    builder.addCase(fetchPurchaseOrders.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // receiveStockDelivery
    builder.addCase(receiveStockDelivery.fulfilled, (state, action) => {
      if (action.payload?.purchaseOrder) {
        const po = action.payload.purchaseOrder;
        const idx = state.purchaseOrders.findIndex(p => p.id === po.id);
        if (idx !== -1) {
          state.purchaseOrders[idx] = { ...state.purchaseOrders[idx], ...po, status: 'COMPLETED' };
        }
      }
    });
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
