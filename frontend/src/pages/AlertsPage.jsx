import { useQuery } from '@tanstack/react-query'
import { inventoryApi } from '../api'
import { PageHeader, StockBadge, Loader, EmptyState } from '../components/common'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function AlertsPage() {
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['low-stock'],
    queryFn: inventoryApi.lowStock,
    refetchInterval: 30_000,
  })

  const outOfStock = alerts.filter(a => a.stockStatus === 'OUT_OF_STOCK')
  const lowStock   = alerts.filter(a => a.stockStatus === 'LOW_STOCK')

  return (
    <div>
      <PageHeader
        title="Stock Alerts"
        subtitle="Items requiring immediate attention"
      />

      {isLoading ? <Loader /> : alerts.length === 0 ? (
        <div className="card p-16 flex flex-col items-center justify-center text-center">
          <CheckCircle2 size={48} className="text-emerald-400 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700">All stocked up!</h3>
          <p className="text-slate-400 mt-1">No low stock or out-of-stock items right now.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {outOfStock.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                <AlertTriangle size={14} /> Out of Stock ({outOfStock.length})
              </h2>
              <div className="card overflow-hidden">
                <AlertTable rows={outOfStock} />
              </div>
            </div>
          )}

          {lowStock.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-amber-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                <AlertTriangle size={14} /> Low Stock ({lowStock.length})
              </h2>
              <div className="card overflow-hidden">
                <AlertTable rows={lowStock} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AlertTable({ rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            {['Item', 'SKU', 'Location', 'Current Stock', 'Reorder Level', 'Deficit', 'Status'].map(h => (
              <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(a => (
            <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50">
              <td className="py-3 px-4 font-medium text-slate-800">{a.itemName}</td>
              <td className="py-3 px-4 font-mono text-xs text-slate-400">{a.itemSku}</td>
              <td className="py-3 px-4 text-slate-600">{a.locationName}</td>
              <td className="py-3 px-4">
                <span className="font-bold text-red-600">{a.quantity}</span>
                <span className="text-slate-400 ml-1 text-xs">{a.itemUnit}</span>
              </td>
              <td className="py-3 px-4 text-slate-500">{a.reorderLevel}</td>
              <td className="py-3 px-4">
                <span className="font-medium text-amber-600">
                  {Math.max(0, a.reorderLevel - a.quantity)} needed
                </span>
              </td>
              <td className="py-3 px-4"><StockBadge status={a.stockStatus} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
