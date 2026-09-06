import { useQuery } from '@tanstack/react-query'
import { inventoryApi } from '../api'
import { StatCard, StockBadge, Loader } from '../components/common'

import {
  Package,
  MapPin,
  AlertTriangle,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  CheckCircle2
} from 'lucide-react'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'

import { formatDate } from '../utils/time'

const TX_COLORS = {
  REPLENISHMENT: 'bg-emerald-100 text-emerald-700',
  USAGE: 'bg-blue-100 text-blue-700',
  ADJUSTMENT: 'bg-amber-100 text-amber-700',
  TRANSFER_IN: 'bg-indigo-100 text-indigo-700',
  TRANSFER_OUT: 'bg-purple-100 text-purple-700',
  RETURN: 'bg-slate-100 text-slate-600',
}

export default function Dashboard() {

  const {
    data: dashboard,
    isLoading
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: inventoryApi.dashboard,
    refetchInterval: 60000,
  })

  if (isLoading) {
    return <Loader />
  }

  console.log('Dashboard Data:', dashboard)

  // =====================================================
  // FIXED DATA MAPPING
  // =====================================================

  const d = {
    totalItems:
      dashboard?.totalItems ??
      dashboard?.total_items ??
      0,

    activeLocations:
      dashboard?.activeLocations ??
      dashboard?.active_locations ??
      0,

    lowStockCount:
      dashboard?.lowStockCount ??
      dashboard?.low_stock_count ??
      0,

    outOfStockCount:
      dashboard?.outOfStockCount ??
      dashboard?.out_of_stock_count ??
      0,

    lowStockAlerts:
      dashboard?.lowStockAlerts ??
      dashboard?.low_stock_alerts ??
      [],

    recentTransactions:
      dashboard?.recentTransactions ??
      dashboard?.recent_transactions ??
      [],
  }

  // =====================================================
  // CHART DATA
  // =====================================================

  const chartData = d.lowStockAlerts
    .slice(0, 8)
    .map(alert => ({
      name:
        alert.itemName?.length > 14
          ? alert.itemName.slice(0, 14) + '…'
          : alert.itemName,

      qty: alert.quantity || 0,

      reorder: alert.reorderLevel || 0,
    }))

  return (
    <div>

      {/* HEADER */}

      <div className="mb-6">

        <h1 className="text-2xl font-bold text-slate-900">
          Dashboard
        </h1>

        <p className="text-sm text-slate-500 mt-0.5">
          Real-time inventory overview across all locations
        </p>

      </div>

      {/* STAT CARDS */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        <StatCard
          label="TOTAL ITEMS"
          value={d.totalItems}
          icon={Package}
          color="indigo"
        />

        <StatCard
          label="ACTIVE LOCATIONS"
          value={d.activeLocations}
          icon={MapPin}
          color="blue"
        />

        <StatCard
          label="LOW STOCK"
          value={d.lowStockCount}
          icon={TrendingDown}
          color="amber"
          sub="Needs reorder"
        />

        <StatCard
          label="OUT OF STOCK"
          value={d.outOfStockCount}
          icon={AlertTriangle}
          color="red"
          sub="Urgent"
        />

      </div>

      {/* MAIN GRID */}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* LOW STOCK CHART */}

        <div className="card p-5 lg:col-span-3">

          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">

            <TrendingDown
              size={16}
              className="text-amber-500"
            />

            Low Stock Items

          </h2>

          {chartData.length > 0 ? (

            <ResponsiveContainer
              width="100%"
              height={220}
            >

              <BarChart data={chartData}>

                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                />

                <YAxis
                  tick={{ fontSize: 11 }}
                />

                <Tooltip />

                <Bar
                  dataKey="qty"
                  radius={[4, 4, 0, 0]}
                >

                  {chartData.map((e, i) => (

                    <Cell
                      key={i}
                      fill={
                        e.qty === 0
                          ? '#ef4444'
                          : '#f59e0b'
                      }
                    />

                  ))}

                </Bar>

              </BarChart>

            </ResponsiveContainer>

          ) : (

            <div className="flex items-center justify-center h-[220px] text-slate-400 text-sm gap-2">

              <CheckCircle2
                size={16}
                className="text-emerald-500"
              />

              All items are well stocked!

            </div>

          )}

        </div>

        {/* STOCK ALERTS */}

        <div className="card p-5 lg:col-span-2">

          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">

            <AlertTriangle
              size={16}
              className="text-red-500"
            />

            Stock Alerts

          </h2>

          <div className="space-y-2">

            {d.lowStockAlerts.length === 0 && (

              <p className="text-sm text-slate-400 text-center py-8">

                No alerts right now 🎉

              </p>

            )}

            {d.lowStockAlerts.map(alert => (

              <div
                key={alert.id}
                className="flex items-center justify-between py-2 border-b border-slate-50"
              >

                <div>

                  <p className="text-sm font-medium text-slate-700">

                    {alert.itemName}

                  </p>

                  <p className="text-xs text-slate-400">

                    {alert.locationName}

                  </p>

                </div>

                <div className="text-right">

                  <StockBadge
                    status={alert.stockStatus}
                  />

                  <p className="text-xs text-slate-400 mt-1">

                    {alert.quantity} / {alert.reorderLevel}

                  </p>

                </div>

              </div>

            ))}

          </div>

        </div>

      </div>

      {/* RECENT TRANSACTIONS */}

      <div className="card p-5 mt-6">

        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">

          <RefreshCw
            size={16}
            className="text-indigo-500"
          />

          Recent Activity

        </h2>

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead>

              <tr className="border-b border-slate-100">

                {[
                  'Item',
                  'Location',
                  'Type',
                  'Change',
                  'By',
                  'Date'
                ].map(h => (

                  <th
                    key={h}
                    className="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase"
                  >
                    {h}
                  </th>

                ))}

              </tr>

            </thead>

            <tbody>

              {d.recentTransactions.map(tx => (

                <tr
                  key={tx.id}
                  className="border-b border-slate-50"
                >

                  <td className="py-2.5 px-3">

                    {tx.itemName}

                  </td>

                  <td className="py-2.5 px-3">

                    {tx.locationName}

                  </td>

                  <td className="py-2.5 px-3">

                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TX_COLORS[tx.transactionType] || 'bg-slate-100 text-slate-600'}`}>

                      {tx.transactionType}

                    </span>

                  </td>

                  <td className="py-2.5 px-3">

                    <span className={`flex items-center gap-1 text-sm font-semibold ${tx.quantity > 0 ? 'text-emerald-600' : 'text-red-500'}`}>

                      {tx.quantity > 0
                        ? <ArrowUpRight size={14} />
                        : <ArrowDownRight size={14} />
                      }

                      {Math.abs(tx.quantity)}

                    </span>

                  </td>

                  <td className="py-2.5 px-3">

                    {tx.performedBy || '—'}

                  </td>

                  <td className="py-2.5 px-3 text-xs">

                    {formatDate(tx.createdAt)}

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

          {d.recentTransactions.length === 0 && (

            <p className="text-sm text-slate-400 text-center py-8">

              No transactions yet.

            </p>

          )}

        </div>

      </div>

    </div>
  )
}