import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import { SocketProvider } from './context/SocketContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { DashboardLayout } from './layouts/DashboardLayout.tsx';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';

import { Login } from './pages/Login.tsx';
import { Register } from './pages/Register.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { PendingApprovals } from './pages/PendingApprovals.tsx';
import { Products } from './pages/Products.tsx';
import { ProductDetail } from './pages/ProductDetail.jsx';
import { AddProduct } from './pages/AddProduct.tsx';
import { EditProduct } from './pages/EditProduct.jsx';
import { Inventory } from './pages/Inventory.tsx';
import { RestockRequests } from './pages/RestockRequests.jsx';
import { PurchaseOrders } from './pages/PurchaseOrders.jsx';
import { AgentLogs } from './pages/AgentLogs.jsx';
import { Chat } from './pages/Chat.tsx';
import { Users } from './pages/Users.jsx';
import { VendorAnalysis } from './pages/VendorAnalysis.tsx';
import { Profile } from './pages/Profile.jsx';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Application Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="products" element={<Products />} />
                <Route path="products/new" element={<ProtectedRoute roles={['ADMIN', 'MANAGER']}><AddProduct /></ProtectedRoute>} />
                <Route path="products/:id" element={<ProductDetail />} />
                <Route path="products/:id/edit" element={<ProtectedRoute roles={['ADMIN', 'MANAGER']}><EditProduct /></ProtectedRoute>} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="restocks" element={<RestockRequests />} />
                <Route path="pending-approvals" element={<ProtectedRoute roles={['ADMIN', 'MANAGER']}><PendingApprovals /></ProtectedRoute>} />
                <Route path="vendor-analysis" element={<ProtectedRoute roles={['ADMIN', 'MANAGER']}><VendorAnalysis /></ProtectedRoute>} />
                <Route path="purchase-orders" element={<PurchaseOrders />} />
                <Route path="agent-logs" element={<AgentLogs />} />
                <Route path="chat" element={<Chat />} />
                <Route path="users" element={<ProtectedRoute roles={['ADMIN']}><Users /></ProtectedRoute>} />
                <Route path="profile" element={<Profile />} />
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
