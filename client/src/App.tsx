import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { EquityLedger } from './pages/EquityLedger';
import { FinancialReports } from './pages/FinancialReports';
import { UserManagement } from './pages/UserManagement';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Application Layout */}
          <Route element={<Layout />}>
            {/* Dashboard: Accessible by all roles */}
            <Route element={<ProtectedRoute allowedRoles={['super_admin', 'partner', 'staff']} />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
            </Route>

            {/* Equity Ledger & Financial Reports: Hidden from staff */}
            <Route element={<ProtectedRoute allowedRoles={['super_admin', 'partner']} />}>
              <Route path="/equity" element={<EquityLedger />} />
              <Route path="/reports" element={<FinancialReports />} />
            </Route>

            {/* User Management: Super Admin only */}
            <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
              <Route path="/users" element={<UserManagement />} />
            </Route>
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
