/**
 * =========================================================================
 * REDUX STORE CONFIGURATION (PURE JAVASCRIPT VERSION)
 * =========================================================================
 * 
 * 🔍 KEY DIFFERENCES FROM TYPESCRIPT (index.ts):
 * 
 * 1. NO TYPE DEFINITIONS:
 *    - In TS: `export type RootState = ReturnType<typeof store.getState>;`
 *    - In TS: `export type AppDispatch = typeof store.dispatch;`
 *    - In JS: Types don't exist at runtime, so we omit `type RootState` and `type AppDispatch`.
 * 
 * 2. NO TYPED HOOKS:
 *    - In TS: `export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;`
 *    - In JS: You can directly use standard `useSelector` and `useDispatch` from 'react-redux',
 *      or create helper functions without type generics.
 */

import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';

import authReducer from './slices/authSlice.js';
import productsReducer from './slices/productsSlice.js';
import inventoryReducer from './slices/inventorySlice.js';
import restocksReducer from './slices/restocksSlice.js';
import approvalsReducer from './slices/approvalsSlice.js';
import chatReducer from './slices/chatSlice.js';
import themeReducer from './slices/themeSlice.js';

// Create and configure the Redux store
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

// In JS, custom hooks are simple wrappers around react-redux hooks
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;
