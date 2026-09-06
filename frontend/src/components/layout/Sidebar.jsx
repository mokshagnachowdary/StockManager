import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Package, MapPin, Tag, Boxes,
  RefreshCcw, AlertTriangle, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

const NAV = [
  { to: '/',              label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/inventory',     label: 'Inventory',    icon: Boxes },
  { to: '/items',         label: 'Items',        icon: Package },
  { to: '/locations',     label: 'Locations',    icon: MapPin },
  { to: '/categories',    label: 'Categories',   icon: Tag },
  { to: '/transactions',  label: 'Transactions', icon: RefreshCcw },
  { to: '/alerts',        label: 'Alerts',       icon: AlertTriangle },
]

export default function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md border border-slate-200 lg:hidden"
        onClick={() => setOpen(o => !o)}
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed top-0 left-0 h-screen bg-slate-900 text-white z-40 transition-transform duration-300 flex flex-col',
        'w-64',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Boxes size={16} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm">StockWise</p>
              <p className="text-xs text-slate-400">Inventory Management</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700/50">
          <p className="text-xs text-slate-500 text-center">v1.0.0 · StockWise IMS</p>
        </div>
      </aside>
    </>
  )
}
