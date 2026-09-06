import { useQuery } from '@tanstack/react-query'
import { inventoryApi } from '../api'
import { PageHeader, Loader, EmptyState } from '../components/common'
import { RefreshCcw, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatDate } from '../utils/time'

const TX_COLORS = {
  REPLENISHMENT: 'bg-emerald-100 text-emerald-700',
  USAGE:         'bg-blue-100 text-blue-700',
  ADJUSTMENT:    'bg-amber-100 text-amber-700',
  TRANSFER_IN:   'bg-indigo-100 text-indigo-700',
  TRANSFER_OUT:  'bg-purple-100 text-purple-700',
  RETURN:        'bg-slate-100 text-slate-600',
}

export default function TransactionsPage() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: inventoryApi.dashboard,
  })

  const transactions = dashboard?.recentTransactions || []

  return (
    <div>
      <PageHeader
        title="Transaction History"
        subtitle="All stock movements across locations"
      />

      <div className="card overflow-hidden">
        {isLoading ? <Loader /> : transactions.length === 0 ? (
          <EmptyState icon={RefreshCcw} title="No transactions yet" description="Stock movements will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['#', 'Item', 'Location', 'Type', 'Change', 'Before → After', 'Reference', 'By', 'Date'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-400 text-xs font-mono">#{tx.id}</td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">{tx.itemName}</p>
                      <p className="text-xs text-slate-400 font-mono">{tx.itemSku}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{tx.locationName}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TX_COLORS[tx.transactionType] || 'bg-slate-100 text-slate-600'}`}>
                        {tx.transactionType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`flex items-center gap-1 font-semibold ${tx.quantity > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {tx.quantity > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {Math.abs(tx.quantity)}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">{tx.quantityBefore} → {tx.quantityAfter}</td>
                    <td className="py-3 px-4 text-slate-400 text-xs">{tx.referenceNo || '—'}</td>
                    <td className="py-3 px-4 text-slate-400">{tx.performedBy || '—'}</td>
                    <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">{formatDate(tx.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
