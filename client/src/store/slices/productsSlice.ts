import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ProductItem {
  id: number;
  name: string;
  sku: string;
  description?: string;
  image?: string;
  currentStock: number;
  safetyThreshold: number;
  targetStock: number;
  unitCost: number;
  supplierName: string;
  supplierEmail: string;
  supplierPhone?: string;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface ProductsState {
  items: ProductItem[];
  selectedProduct: ProductItem | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  stockFilter: string;
}

const initialState: ProductsState = {
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
    setProducts: (state, action: PayloadAction<ProductItem[]>) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },
    setSelectedProduct: (state, action: PayloadAction<ProductItem | null>) => {
      state.selectedProduct = action.payload;
    },
    addProduct: (state, action: PayloadAction<ProductItem>) => {
      state.items.unshift(action.payload);
    },
    updateProductInList: (state, action: PayloadAction<ProductItem>) => {
      const idx = state.items.findIndex(p => p.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = action.payload;
      }
      if (state.selectedProduct?.id === action.payload.id) {
        state.selectedProduct = action.payload;
      }
    },
    removeProductFromList: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter(p => p.id !== action.payload);
      if (state.selectedProduct?.id === action.payload) {
        state.selectedProduct = null;
      }
    },
    setProductsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setProductsError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setStockFilter: (state, action: PayloadAction<string>) => {
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
