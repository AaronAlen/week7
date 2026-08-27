# 📘 JavaScript vs TypeScript: Complete Redux & React Guide

Welcome to the **JavaScript Alternative Reference Directory** for StockPilot! If you are new to TypeScript or Redux Toolkit, this guide explains how they relate, how Redux Toolkit works in both languages, and how to read TypeScript code effortlessly.

---

## 📑 Table of Contents
1. [Core Difference: What is TypeScript?](#1-core-difference-what-is-typescript)
2. [Side-by-Side Comparison: Redux Slice (JS vs TS)](#2-side-by-side-comparison-redux-slice-js-vs-ts)
3. [Side-by-Side Comparison: Redux Store Config (JS vs TS)](#3-side-by-side-comparison-redux-store-config-js-vs-ts)
4. [Side-by-Side Comparison: React Components & Props](#4-side-by-side-comparison-react-components--props)
5. [Summary Cheatsheet: What to Ignore when Reading TS](#5-summary-cheatsheet-what-to-ignore-when-reading-ts)

---

## 1. Core Difference: What is TypeScript?

- **JavaScript (`.js` / `.jsx`)**: A dynamic language. Variables can hold any value, and types are only checked when the code actually runs in the browser.
- **TypeScript (`.ts` / `.tsx`)**: JavaScript with **compile-time type annotations**. It adds labels (like `: string`, `: number`, `: boolean`, `interface User`) so your code editor can catch typos, missing properties, and bugs *before* running.
- **Key Insight**: At build time (`vite build`), **all TypeScript types are erased**, producing 100% standard JavaScript!

```javascript
// JavaScript:
const add = (a, b) => a + b;

// TypeScript (Identical logic + type labels):
const add = (a: number, b: number): number => a + b;
```

---

## 2. Side-by-Side Comparison: Redux Slice (JS vs TS)

Let's look at `authSlice` in both languages:

### 🟡 JavaScript Version (`authSlice.js`)
```javascript
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  accessToken: null,
  loading: false
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
    }
  }
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
```

### 🔵 TypeScript Version (`authSlice.ts`)
```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// 1. We describe the shape of a User object
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
}

// 2. We describe the shape of this slice's state
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
}

// 3. We attach the type to the initial state
const initialState: AuthState = {
  user: null,
  accessToken: null,
  loading: false
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 4. We specify what action.payload contains using PayloadAction<Type>
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; accessToken: string }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
    }
  }
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
```

### 💡 What changed between JS and TS?
1. **`interface User` & `interface AuthState`**: TypeScript uses these to provide autocomplete when typing `state.user.name` in your editor.
2. **`PayloadAction<{ user: User; accessToken: string }>`**: Tells TypeScript that when calling `dispatch(setCredentials(...))`, you must pass an object containing `user` and `accessToken`.

---

## 3. Side-by-Side Comparison: Redux Store Config (JS vs TS)

### 🟡 JavaScript (`store/index.js`)
```javascript
import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/authSlice.js';
import productsReducer from './slices/productsSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer
  }
});

export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;
```

### 🔵 TypeScript (`store/index.ts`)
```typescript
import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import authReducer from './slices/authSlice.ts';
import productsReducer from './slices/productsSlice.ts';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer
  }
});

// TypeScript infers RootState (all slice states combined) and AppDispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks give autocomplete when accessing state (e.g. state.auth.user)
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

---

## 4. Side-by-Side Comparison: React Components & Props

### 🟡 JavaScript (`ProductCard.jsx`)
```jsx
import React from 'react';

export const ProductCard = ({ name, price, onAddToCart }) => {
  return (
    <div className="card">
      <h3>{name}</h3>
      <p>${price.toFixed(2)}</p>
      <button onClick={onAddToCart}>Add to Cart</button>
    </div>
  );
};
```

### 🔵 TypeScript (`ProductCard.tsx`)
```tsx
import React from 'react';

interface ProductCardProps {
  name: string;
  price: number;
  onAddToCart: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ name, price, onAddToCart }) => {
  return (
    <div className="card">
      <h3>{name}</h3>
      <p>${price.toFixed(2)}</p>
      <button onClick={onAddToCart}>Add to Cart</button>
    </div>
  );
};
```

---

## 5. Summary Cheatsheet: What to Ignore when Reading TS

Whenever you are reading `.ts` or `.tsx` files in StockPilot:
1. **Ignore `: string`, `: number`, `: boolean`**: These are just notes telling the compiler what data type a variable is.
2. **Ignore `<T>` (Generics)**: Like `PayloadAction<ProductItem[]>`. It just means "a payload containing an array of product items".
3. **Ignore `interface ... { ... }`**: These are just blueprints describing the properties on an object.
4. **The Runtime Logic is 100% Identical to JavaScript**: Every `if`, `for`, `map`, `filter`, `async/await`, `dispatch()`, and JSX `<div>` runs the exact same way.

---

## 📂 Reference Files in this Directory
- [`store/index.js`](file:///c:/Users/aaron/Desktop/gwc/week7/client/src/javascript-reference/store/index.js)
- [`store/slices/authSlice.js`](file:///c:/Users/aaron/Desktop/gwc/week7/client/src/javascript-reference/store/slices/authSlice.js)
- [`store/slices/productsSlice.js`](file:///c:/Users/aaron/Desktop/gwc/week7/client/src/javascript-reference/store/slices/productsSlice.js)
- [`store/slices/inventorySlice.js`](file:///c:/Users/aaron/Desktop/gwc/week7/client/src/javascript-reference/store/slices/inventorySlice.js)
- [`store/slices/restocksSlice.js`](file:///c:/Users/aaron/Desktop/gwc/week7/client/src/javascript-reference/store/slices/restocksSlice.js)
- [`store/slices/approvalsSlice.js`](file:///c:/Users/aaron/Desktop/gwc/week7/client/src/javascript-reference/store/slices/approvalsSlice.js)
- [`store/slices/chatSlice.js`](file:///c:/Users/aaron/Desktop/gwc/week7/client/src/javascript-reference/store/slices/chatSlice.js)
- [`store/slices/themeSlice.js`](file:///c:/Users/aaron/Desktop/gwc/week7/client/src/javascript-reference/store/slices/themeSlice.js)
- [`services/api.js`](file:///c:/Users/aaron/Desktop/gwc/week7/client/src/javascript-reference/services/api.js)
