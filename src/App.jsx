import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import POSPage from './pages/POSPage'
import SimulatorPage from './pages/SimulatorPage'
import ProductsPage from './pages/ProductsPage'
import CustomersPage from './pages/CustomersPage'
import TransactionsPage from './pages/TransactionsPage'
import TransactionDetailPage from './pages/TransactionDetailPage'
import CollectionPage from './pages/CollectionPage'
import AnalyticsPage from './pages/AnalyticsPage'
import SuppliersPage from './pages/SuppliersPage'
import UsersPage from './pages/UsersPage'
import SettingsPage from './pages/SettingsPage'
import { useAuth } from './context/AuthContext'

export default function App() {
  const { user } = useAuth()

  return (
    <Routes>
      {/* Root - Conditional based on login */}
      <Route path="/" element={
        <Layout>
          {user ? <POSPage /> : <SimulatorPage />}
        </Layout>
      } />

      {/* Public */}
      <Route path="/simulator" element={
        <Layout><SimulatorPage /></Layout>
      } />

      {/* Protected - all roles */}
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
      <Route path="/transactions/detail/:id" element={
        <ProtectedRoute>
          <Layout><TransactionDetailPage /></Layout>
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
      <Route path="/analytics" element={
        <ProtectedRoute requiredRole="ADMIN">
          <Layout><AnalyticsPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/suppliers" element={
        <ProtectedRoute requiredRole="ADMIN">
          <Layout><SuppliersPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute requiredRole="ADMIN">
          <Layout><UsersPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute requiredRole="ADMIN">
          <Layout><SettingsPage /></Layout>
        </ProtectedRoute>
      } />


      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
