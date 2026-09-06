import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import Dashboard from './pages/Dashboard'
import ItemsPage from './pages/ItemsPage'
import InventoryPage from './pages/InventoryPage'
import LocationsPage from './pages/LocationsPage'
import CategoriesPage from './pages/CategoriesPage'
import TransactionsPage from './pages/TransactionsPage'
import AlertsPage from './pages/AlertsPage'
import InventoryChatbot from './pages/InventoryChatbot'

export default function App() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-h-screen">
        <div className="p-6 max-w-7xl mx-auto">
          <Routes>
            <Route path="/"             element={<Dashboard />} />
            <Route path="/inventory"    element={<InventoryPage />} />
            <Route path="/items"        element={<ItemsPage />} />
            <Route path="/locations"    element={<LocationsPage />} />
            <Route path="/categories"   element={<CategoriesPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/alerts"       element={<AlertsPage />} />
          </Routes>
        </div>
      </main>
      <InventoryChatbot />
    </div>
  )
}