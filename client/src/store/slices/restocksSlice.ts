import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RestockRequest, PurchaseOrder } from '../../types/index.ts';

interface RestocksState {
  requests: RestockRequest[];
  purchaseOrders: PurchaseOrder[];
  loading: boolean;
  error: string | null;
}

const initialState: RestocksState = {
  requests: [],
  purchaseOrders: [],
  loading: false,
  error: null
};

export const restocksSlice = createSlice({
  name: 'restocks',
  initialState,
  reducers: {
    setRestockRequests: (state, action: PayloadAction<RestockRequest[]>) => {
      state.requests = action.payload;
      state.loading = false;
      state.error = null;
    },
    addRestockRequest: (state, action: PayloadAction<RestockRequest>) => {
      state.requests.unshift(action.payload);
    },
    updateRestockRequest: (state, action: PayloadAction<RestockRequest>) => {
      const idx = state.requests.findIndex(r => r.id === action.payload.id);
      if (idx !== -1) {
        state.requests[idx] = action.payload;
      }
    },
    setPurchaseOrders: (state, action: PayloadAction<PurchaseOrder[]>) => {
      state.purchaseOrders = action.payload;
      state.loading = false;
      state.error = null;
    },
    addPurchaseOrder: (state, action: PayloadAction<PurchaseOrder>) => {
      state.purchaseOrders.unshift(action.payload);
    },
    updatePurchaseOrder: (state, action: PayloadAction<PurchaseOrder>) => {
      const idx = state.purchaseOrders.findIndex(p => p.id === action.payload.id);
      if (idx !== -1) {
        state.purchaseOrders[idx] = action.payload;
      }
    },
    setRestocksLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setRestocksError: (state, action: PayloadAction<string | null>) => {
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
