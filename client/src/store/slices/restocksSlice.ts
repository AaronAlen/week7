import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api.ts';

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
  product?: { name: string; sku?: string };
  supplierName: string;
  supplierEmail: string;
  supplierPhone?: string;
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

// Async Thunks
export const fetchRestockRequests = createAsyncThunk(
  'restocks/fetchRestockRequests',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get<RestockItem[]>('/restocks');
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Failed to fetch restock requests');
    }
  }
);

export const fetchPurchaseOrders = createAsyncThunk(
  'restocks/fetchPurchaseOrders',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get<PurchaseOrderItem[]>('/purchase-orders');
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Failed to fetch purchase orders');
    }
  }
);

export const receiveStockDelivery = createAsyncThunk(
  'restocks/receiveStockDelivery',
  async (
    payload: { restockRequestId?: number; purchaseOrderId?: number },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.post<{ success: boolean; message: string; purchaseOrder: PurchaseOrderItem }>('/inventory/receive', payload);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Failed to receive stock delivery');
    }
  }
);

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
      state.error = action.payload as string;
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
      state.error = action.payload as string;
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
