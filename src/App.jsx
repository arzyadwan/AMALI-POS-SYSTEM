import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import POSPage from './pages/POSPage'
import SimulatorPage from './pages/SimulatorPage'
import ProductsPage from './pages/ProductsPage'
import CustomersPage from './pages/CustomersPage'
import TransactionsPage from './pages/TransactionsPage'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<POSPage />} />
        <Route path="/simulator" element={<SimulatorPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
      </Routes>
    </Layout>
  )
}
