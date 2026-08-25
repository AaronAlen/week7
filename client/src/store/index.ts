import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/authSlice.ts';
import productsReducer from './slices/productsSlice.ts';
import inventoryReducer from './slices/inventorySlice.ts';
import restocksReducer from './slices/restocksSlice.ts';
import approvalsReducer from './slices/approvalsSlice.ts';
import chatReducer from './slices/chatSlice.ts';
import themeReducer from './slices/themeSlice.ts';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    inventory: inventoryReducer,
    restocks: restocksReducer,
    approvals: approvalsReducer,
    chat: chatReducer,
    theme: themeReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Custom typed Redux hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
