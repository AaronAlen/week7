import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '../../types/index.ts';

interface ProductsState {
  items: Product[];
  selectedProduct: Product | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  stockFilter: 'all' | 'low' | 'healthy';
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
    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },
    setSelectedProduct: (state, action: PayloadAction<Product | null>) => {
      state.selectedProduct = action.payload;
    },
    addProduct: (state, action: PayloadAction<Product>) => {
      state.items.unshift(action.payload);
    },
    updateProductInList: (state, action: PayloadAction<Product>) => {
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
    setStockFilter: (state, action: PayloadAction<'all' | 'low' | 'healthy'>) => {
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
