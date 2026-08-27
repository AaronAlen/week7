import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ChatMessage {
  id?: number | string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp?: string;
  structuredData?: any;
}

export interface ChatState {
  messages: ChatMessage[];
  aiAssistantResponse: any;
  loading: boolean;
  aiLoading: boolean;
  error: string | null;
}

const initialState: ChatState = {
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
    setMessages: (state, action: PayloadAction<ChatMessage[]>) => {
      state.messages = action.payload;
      state.loading = false;
    },
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
    },
    setAiAssistantResponse: (state, action: PayloadAction<any>) => {
      state.aiAssistantResponse = action.payload;
      state.aiLoading = false;
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
