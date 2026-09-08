import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api.ts';

export interface InventoryTransaction {
  id: number;
  productId: number;
  type: 'SALE' | 'RESTOCK' | 'ADJUSTMENT';
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceId?: string;
  notes?: string;
  product?: {
    name: string;
    sku: string;
  };
  createdAt: string;
}

export interface InventoryState {
  transactions: InventoryTransaction[];
  loading: boolean;
  error: string | null;
}

const initialState: InventoryState = {
  transactions: [],
  loading: false,
  error: null
};

// Async Thunks
export const fetchTransactions = createAsyncThunk(
  'inventory/fetchTransactions',
  async (limit: number = 50, { rejectWithValue }) => {
    try {
      const res = await api.get<InventoryTransaction[]>(`/inventory/transactions?limit=${limit}`);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Failed to fetch inventory transactions');
    }
  }
);

export const adjustStock = createAsyncThunk(
  'inventory/adjustStock',
  async (
    payload: { productId: number; quantity: number; type: 'SALE' | 'RESTOCK' | 'ADJUSTMENT'; notes?: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.post<{ success: boolean; transaction: InventoryTransaction }>('/inventory/adjust', payload);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Failed to adjust stock');
    }
  }
);

export const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setTransactions: (state, action: PayloadAction<InventoryTransaction[]>) => {
      state.transactions = action.payload;
      state.loading = false;
      state.error = null;
    },
    addTransaction: (state, action: PayloadAction<InventoryTransaction>) => {
      state.transactions.unshift(action.payload);
    },
    setInventoryLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setInventoryError: (state, action: PayloadAction<string | null>) => {
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
      state.error = action.payload as string;
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
