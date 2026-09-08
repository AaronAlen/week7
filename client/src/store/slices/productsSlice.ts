import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api.ts';

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

// Async Thunks
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get<ProductItem[]>('/products');
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Failed to fetch products');
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (id: number, { rejectWithValue }) => {
    try {
      const res = await api.get<ProductItem>(`/products/${id}`);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Failed to fetch product');
    }
  }
);

export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (productData: any, { rejectWithValue }) => {
    try {
      const res = await api.post<ProductItem>('/products', productData);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Failed to create product');
    }
  }
);

export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, data }: { id: number; data: any }, { rejectWithValue }) => {
    try {
      const res = await api.put<ProductItem>(`/products/${id}`, data);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Failed to update product');
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/products/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Failed to delete product');
    }
  }
);

export const triggerRestock = createAsyncThunk(
  'products/triggerRestock',
  async (productId: number, { rejectWithValue }) => {
    try {
      const res = await api.post<{ message: string; restockRequest?: any }>('/restocks/trigger', { productId });
      return { productId, ...res.data };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Failed to trigger restock');
    }
  }
);

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
  },
  extraReducers: (builder) => {
    // fetchProducts
    builder.addCase(fetchProducts.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchProducts.fulfilled, (state, action) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    });
    builder.addCase(fetchProducts.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // fetchProductById
    builder.addCase(fetchProductById.fulfilled, (state, action) => {
      state.selectedProduct = action.payload;
    });

    // createProduct
    builder.addCase(createProduct.fulfilled, (state, action) => {
      state.items.unshift(action.payload);
    });

    // updateProduct
    builder.addCase(updateProduct.fulfilled, (state, action) => {
      const idx = state.items.findIndex(p => p.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = action.payload;
      }
      if (state.selectedProduct?.id === action.payload.id) {
        state.selectedProduct = action.payload;
      }
    });

    // deleteProduct
    builder.addCase(deleteProduct.fulfilled, (state, action) => {
      state.items = state.items.filter(p => p.id !== action.payload);
      if (state.selectedProduct?.id === action.payload) {
        state.selectedProduct = null;
      }
    });
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
