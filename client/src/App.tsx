import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { DashboardLayout } from './layouts/DashboardLayout.tsx';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';

import { Login } from './pages/Login.tsx';
import { Register } from './pages/Register.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { PendingApprovals } from './pages/PendingApprovals.tsx';
import { Products } from './pages/Products.jsx';
import { ProductDetail } from './pages/ProductDetail.jsx';
import { AddProduct } from './pages/AddProduct.jsx';
import { EditProduct } from './pages/EditProduct.jsx';
import { Inventory } from './pages/Inventory.jsx';
import { RestockRequests } from './pages/RestockRequests.jsx';
import { PurchaseOrders } from './pages/PurchaseOrders.jsx';
import { AgentLogs } from './pages/AgentLogs.jsx';
import { Chat } from './pages/Chat.jsx';
import { Users } from './pages/Users.jsx';
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
