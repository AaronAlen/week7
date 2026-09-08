import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api.ts';

export interface ApprovalItem {
  id: number;
  productId: number;
  quantity: number;
  totalCost: number;
  reason?: string;
  threadId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  product?: {
    name: string;
    sku: string;
    currentStock: number;
    safetyThreshold: number;
    supplierName?: string;
  };
  approver?: {
    id: number;
    name: string;
    email: string;
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

// Async Thunks
export const fetchApprovals = createAsyncThunk(
  'approvals/fetchApprovals',
  async (status: string | void, { rejectWithValue }) => {
    try {
      const queryStatus = status || 'PENDING';
      const res = await api.get<ApprovalItem[]>(`/approvals?status=${queryStatus}`);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Failed to fetch approvals');
    }
  }
);

export const submitApprovalDecision = createAsyncThunk(
  'approvals/submitApprovalDecision',
  async (
    { threadId, approved }: { threadId: string; approved: boolean },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.post('/approvals/approve', { threadId, approved });
      return { threadId, approved, data: res.data };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Failed to submit approval decision');
    }
  }
);

export const cancelApproval = createAsyncThunk(
  'approvals/cancelApproval',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.post(`/approvals/${id}/cancel`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Failed to cancel approval');
    }
  }
);

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
  },
  extraReducers: (builder) => {
    // fetchApprovals
    builder.addCase(fetchApprovals.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchApprovals.fulfilled, (state, action) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    });
    builder.addCase(fetchApprovals.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // submitApprovalDecision
    builder.addCase(submitApprovalDecision.fulfilled, (state, action) => {
      state.items = state.items.filter(a => a.threadId !== action.payload.threadId);
    });

    // cancelApproval
    builder.addCase(cancelApproval.fulfilled, (state, action) => {
      state.items = state.items.filter(a => a.id !== action.payload);
    });
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
