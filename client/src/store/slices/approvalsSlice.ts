import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ApprovalItem {
  id: number;
  productId: number;
  quantity: number;
  totalCost: number;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  product?: {
    name: string;
    sku: string;
    currentStock: number;
    safetyThreshold: number;
  };
  createdAt: string;
}

export interface ApprovalsState {
  items: ApprovalItem[];
  loading: boolean;
  error: string | null;
}

const initialState: ApprovalsState = {
  items: [],
  loading: false,
  error: null
};

export const approvalsSlice = createSlice({
  name: 'approvals',
  initialState,
  reducers: {
    setApprovals: (state, action: PayloadAction<ApprovalItem[]>) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },
    removeApproval: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter(a => a.id !== action.payload);
    },
    updateApprovalStatus: (
      state,
      action: PayloadAction<{ id: number; status: 'PENDING' | 'APPROVED' | 'REJECTED' }>
    ) => {
      const item = state.items.find(a => a.id === action.payload.id);
      if (item) {
        item.status = action.payload.status;
      }
    },
    setApprovalsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setApprovalsError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    }
  }
});

export const {
  setApprovals,
  removeApproval,
  updateApprovalStatus,
  setApprovalsLoading,
  setApprovalsError
} = approvalsSlice.actions;

export default approvalsSlice.reducer;
