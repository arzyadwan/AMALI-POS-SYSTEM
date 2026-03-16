import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import POSPage from './pages/POSPage'
import SimulatorPage from './pages/SimulatorPage'
import ProductsPage from './pages/ProductsPage'
import CustomersPage from './pages/CustomersPage'
import TransactionsPage from './pages/TransactionsPage'
import CollectionPage from './pages/CollectionPage'
import UsersPage from './pages/UsersPage'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected - all roles */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout><POSPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/simulator" element={
        <ProtectedRoute>
          <Layout><SimulatorPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/customers" element={
        <ProtectedRoute>
          <Layout><CustomersPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/transactions" element={
        <ProtectedRoute>
          <Layout><TransactionsPage /></Layout>
        </ProtectedRoute>
      } />

      {/* Protected - Admin only */}
      <Route path="/products" element={
        <ProtectedRoute requiredRole="ADMIN">
          <Layout><ProductsPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/collection" element={
        <ProtectedRoute requiredRole="ADMIN">
          <Layout><CollectionPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute requiredRole="ADMIN">
          <Layout><UsersPage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
