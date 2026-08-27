import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface RestockItem {
  id: number;
  productId: number;
  quantity: number;
  totalCost: number;
  status: string;
  requiresHumanReview: boolean;
  product?: { name: string; sku: string };
  purchaseOrder?: { id: number; status: string };
  createdAt?: string;
}

export interface PurchaseOrderItem {
  id: number;
  productId: number;
  product?: { name: string };
  supplierName: string;
  supplierEmail: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  status: string;
  createdAt: string;
}

export interface RestocksState {
  requests: RestockItem[];
  purchaseOrders: PurchaseOrderItem[];
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
    setRestockRequests: (state, action: PayloadAction<RestockItem[]>) => {
      state.requests = action.payload;
      state.loading = false;
      state.error = null;
    },
    addRestockRequest: (state, action: PayloadAction<RestockItem>) => {
      state.requests.unshift(action.payload);
    },
    updateRestockRequest: (state, action: PayloadAction<RestockItem>) => {
      const idx = state.requests.findIndex(r => r.id === action.payload.id);
      if (idx !== -1) {
        state.requests[idx] = action.payload;
      }
    },
    setPurchaseOrders: (state, action: PayloadAction<PurchaseOrderItem[]>) => {
      state.purchaseOrders = action.payload;
      state.loading = false;
      state.error = null;
    },
    addPurchaseOrder: (state, action: PayloadAction<PurchaseOrderItem>) => {
      state.purchaseOrders.unshift(action.payload);
    },
    updatePurchaseOrder: (state, action: PayloadAction<PurchaseOrderItem>) => {
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
