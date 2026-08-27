/**
 * =========================================================================
 * PRODUCTS REDUX SLICE (PURE JAVASCRIPT VERSION)
 * =========================================================================
 * 
 * 🔍 KEY DIFFERENCES FROM TYPESCRIPT (productsSlice.ts):
 * 
 * 1. REMOVED ProductItem & ProductsState Interfaces:
 *    - In TS, every field (id, name, sku, unitCost, stockStatus) must be explicitly typed.
 *    - In JS, we don't define shapes or interfaces; initial state provides the default values.
 * 
 * 2. ACTION PAYLOADS:
 *    - In TS: `action: PayloadAction<ProductItem[]>` or `action: PayloadAction<number>`
 *    - In JS: `action` is a standard JavaScript object with `action.type` and `action.payload`.
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  selectedProduct: null,
  loading: false,
  error: null,
  searchQuery: '',
  stockFilter: 'all'
};

export const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    // Set the complete product list from backend API
    setProducts: (state, action) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Set currently viewed product detail
    setSelectedProduct: (state, action) => {
      state.selectedProduct = action.payload;
    },

    // Add a newly created product to the start of the list
    addProduct: (state, action) => {
      state.items.unshift(action.payload);
    },

    // Update an existing product in the list and selected view
    updateProductInList: (state, action) => {
      const idx = state.items.findIndex(p => p.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = action.payload;
      }
      if (state.selectedProduct?.id === action.payload.id) {
        state.selectedProduct = action.payload;
      }
    },

    // Remove deleted product from state
    removeProductFromList: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter(p => p.id !== productId);
      if (state.selectedProduct?.id === productId) {
        state.selectedProduct = null;
      }
    },

    // Toggle loading state
    setProductsLoading: (state, action) => {
      state.loading = action.payload;
    },

    // Record error message
    setProductsError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },

    // Update search filter text
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },

    // Update stock status filter ('all', 'in_stock', 'low_stock', 'out_of_stock')
    setStockFilter: (state, action) => {
      state.stockFilter = action.payload;
    }
  }
});

export const {
  setProducts,
  setSelectedProduct,
  addProduct,
  updateProductInList,
  removeProductFromList,
  setProductsLoading,
  setProductsError,
  setSearchQuery,
  setStockFilter
} = productsSlice.actions;

export default productsSlice.reducer;
