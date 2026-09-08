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

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../services/api.ts';

const initialState = {
  messages: [],
  aiAssistantResponse: null,
  loading: false,
  sending: false,
  aiLoading: false,
  error: null
};

// Async Thunks
export const fetchChatMessages = createAsyncThunk(
  'chat/fetchChatMessages',
  async (limit = 100, { rejectWithValue }) => {
    try {
      const res = await api.get(`/chat/messages?limit=${limit}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Failed to fetch chat messages');
    }
  }
);

export const sendChatMessage = createAsyncThunk(
  'chat/sendChatMessage',
  async (message, { rejectWithValue }) => {
    try {
      const res = await api.post('/chat/messages', { message });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Failed to send message');
    }
  }
);

export const queryAiAssistant = createAsyncThunk(
  'chat/queryAiAssistant',
  async (query, { rejectWithValue }) => {
    try {
      const res = await api.post('/chat/query', { query });
      return res.data.answer;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Failed to query AI assistant');
    }
  }
);

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
      const exists = state.messages.some(m => m.id === action.payload.id);
      if (!exists) {
        state.messages.push(action.payload);
      }
    },

    // Clear AI assistant response
    clearAiAssistantResponse: (state) => {
      state.aiAssistantResponse = null;
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
  },
  extraReducers: (builder) => {
    // fetchChatMessages
    builder.addCase(fetchChatMessages.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchChatMessages.fulfilled, (state, action) => {
      state.messages = action.payload;
      state.loading = false;
      state.error = null;
    });
    builder.addCase(fetchChatMessages.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // sendChatMessage
    builder.addCase(sendChatMessage.pending, (state) => {
      state.sending = true;
    });
    builder.addCase(sendChatMessage.fulfilled, (state, action) => {
      state.sending = false;
      const exists = state.messages.some(m => m.id === action.payload.id);
      if (!exists) {
        state.messages.push(action.payload);
      }
    });
    builder.addCase(sendChatMessage.rejected, (state, action) => {
      state.sending = false;
      state.error = action.payload;
    });

    // queryAiAssistant
    builder.addCase(queryAiAssistant.pending, (state) => {
      state.aiLoading = true;
      state.aiAssistantResponse = null;
    });
    builder.addCase(queryAiAssistant.fulfilled, (state, action) => {
      state.aiLoading = false;
      state.aiAssistantResponse = action.payload;
    });
    builder.addCase(queryAiAssistant.rejected, (state, action) => {
      state.aiLoading = false;
      state.error = action.payload;
    });
  }
});

export const {
  setMessages,
  addMessage,
  clearAiAssistantResponse,
  setChatLoading,
  setAiLoading,
  setChatError
} = chatSlice.actions;

export default chatSlice.reducer;
