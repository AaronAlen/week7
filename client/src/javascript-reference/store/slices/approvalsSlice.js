/**
 * =========================================================================
 * EXECUTIVE APPROVALS QUEUE REDUX SLICE (PURE JAVASCRIPT VERSION)
 * =========================================================================
 * 
 * 🔍 KEY DIFFERENCES FROM TYPESCRIPT (approvalsSlice.ts):
 * 
 * 1. REMOVED ApprovalItem & ApprovalsState Interfaces.
 * 2. `updateApprovalStatus` receives plain `{ id, status }` payload without generics.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../services/api.ts';

const initialState = {
  items: [],
  loading: false,
  error: null
};

// Async Thunks
export const fetchApprovals = createAsyncThunk(
  'approvals/fetchApprovals',
  async (status = 'PENDING', { rejectWithValue }) => {
    try {
      const res = await api.get(`/approvals?status=${status}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Failed to fetch approvals');
    }
  }
);

export const submitApprovalDecision = createAsyncThunk(
  'approvals/submitApprovalDecision',
  async ({ threadId, approved }, { rejectWithValue }) => {
    try {
      const res = await api.post('/approvals/approve', { threadId, approved });
      return { threadId, approved, data: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Failed to submit approval decision');
    }
  }
);

export const cancelApproval = createAsyncThunk(
  'approvals/cancelApproval',
  async (id, { rejectWithValue }) => {
    try {
      await api.post(`/approvals/${id}/cancel`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Failed to cancel approval');
    }
  }
);

export const approvalsSlice = createSlice({
  name: 'approvals',
  initialState,
  reducers: {
    // Populate approvals queue from server
    setApprovals: (state, action) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Remove approved/rejected order from queue
    removeApproval: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter(a => a.id !== id);
    },

    // Update approval status in place
    updateApprovalStatus: (state, action) => {
      const { id, status } = action.payload;
      const item = state.items.find(a => a.id === id);
      if (item) {
        item.status = status;
      }
    },

    // Toggle loading indicator
    setApprovalsLoading: (state, action) => {
      state.loading = action.payload;
    },

    // Record error message
    setApprovalsError: (state, action) => {
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
      state.error = action.payload;
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
