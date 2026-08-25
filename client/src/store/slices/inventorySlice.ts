import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { InventoryTransaction } from '../../types/index.ts';

interface InventoryState {
  transactions: InventoryTransaction[];
  loading: boolean;
  error: string | null;
}

const initialState: InventoryState = {
  transactions: [],
  loading: false,
  error: null
};

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
  }
});

export const { setTransactions, addTransaction, setInventoryLoading, setInventoryError } = inventorySlice.actions;
export default inventorySlice.reducer;
