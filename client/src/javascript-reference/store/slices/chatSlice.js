/**
 * =========================================================================
 * OPERATIONS COPILOT CHAT REDUX SLICE (PURE JAVASCRIPT VERSION)
 * =========================================================================
 * 
 * 🔍 KEY DIFFERENCES FROM TYPESCRIPT (chatSlice.ts):
 * 
 * 1. REMOVED ChatMessage & ChatState Interfaces.
 * 2. Message objects `{ id, sender, text, timestamp }` are stored dynamically.
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  messages: [],
  aiAssistantResponse: null,
  loading: false,
  aiLoading: false,
  error: null
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Populate chat history
    setMessages: (state, action) => {
      state.messages = action.payload;
      state.loading = false;
    },

    // Append new user or AI assistant message
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },

    // Set assistant's latest structured response payload
    setAiAssistantResponse: (state, action) => {
      state.aiAssistantResponse = action.payload;
      state.aiLoading = false;
    },

    // Toggle general chat loading
    setChatLoading: (state, action) => {
      state.loading = action.payload;
    },

    // Toggle AI streaming / typing loading
    setAiLoading: (state, action) => {
      state.aiLoading = action.payload;
    },

    // Record error message
    setChatError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
      state.aiLoading = false;
    }
  }
});

export const {
  setMessages,
  addMessage,
  setAiAssistantResponse,
  setChatLoading,
  setAiLoading,
  setChatError
} = chatSlice.actions;

export default chatSlice.reducer;
