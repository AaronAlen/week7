import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { DashboardLayout } from './layouts/DashboardLayout.jsx';

import { Login } from './pages/Login.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Products } from './pages/Products.jsx';
import { ProductDetail } from './pages/ProductDetail.jsx';
import { AddProduct } from './pages/AddProduct.jsx';
import { EditProduct } from './pages/EditProduct.jsx';
import { Inventory } from './pages/Inventory.jsx';
import { RestockRequests } from './pages/RestockRequests.jsx';
import { PendingApprovals } from './pages/PendingApprovals.jsx';
import { PurchaseOrders } from './pages/PurchaseOrders.jsx';
import { AgentLogs } from './pages/AgentLogs.jsx';
import { Chat } from './pages/Chat.jsx';
import { Users } from './pages/Users.jsx';
import { Profile } from './pages/Profile.jsx';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !hasRole(...roles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />

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
  );
}

export default App;
