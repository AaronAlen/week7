import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api.ts';

export interface ChatUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface ChatMessageItem {
  id: number;
  senderId: number;
  message: string;
  createdAt: string;
  sender?: ChatUser;
}

export interface ChatState {
  messages: ChatMessageItem[];
  aiAssistantResponse: string | null;
  loading: boolean;
  sending: boolean;
  aiLoading: boolean;
  error: string | null;
}

const initialState: ChatState = {
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
  async (limit: number = 100, { rejectWithValue }) => {
    try {
      const res = await api.get<ChatMessageItem[]>(`/chat/messages?limit=${limit}`);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Failed to fetch chat messages');
    }
  }
);

export const sendChatMessage = createAsyncThunk(
  'chat/sendChatMessage',
  async (message: string, { rejectWithValue }) => {
    try {
      const res = await api.post<ChatMessageItem>('/chat/messages', { message });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Failed to send message');
    }
  }
);

export const queryAiAssistant = createAsyncThunk(
  'chat/queryAiAssistant',
  async (query: string, { rejectWithValue }) => {
    try {
      const res = await api.post<{ success: boolean; answer: string }>('/chat/query', { query });
      return res.data.answer;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Failed to query AI assistant');
    }
  }
);

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setMessages: (state, action: PayloadAction<ChatMessageItem[]>) => {
      state.messages = action.payload;
      state.loading = false;
    },
    addMessage: (state, action: PayloadAction<ChatMessageItem>) => {
      const exists = state.messages.some(m => m.id === action.payload.id);
      if (!exists) {
        state.messages.push(action.payload);
      }
    },
    clearAiAssistantResponse: (state) => {
      state.aiAssistantResponse = null;
    },
    setChatLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setAiLoading: (state, action: PayloadAction<boolean>) => {
      state.aiLoading = action.payload;
    },
    setChatError: (state, action: PayloadAction<string | null>) => {
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
      state.error = action.payload as string;
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
      state.error = action.payload as string;
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
      state.error = action.payload as string;
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
