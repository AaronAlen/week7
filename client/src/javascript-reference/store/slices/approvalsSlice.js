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

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  loading: false,
  error: null
};

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
