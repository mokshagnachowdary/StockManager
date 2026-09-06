import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { inventoryApi, itemsApi, locationsApi } from '../api'
import {
  PageHeader,
  StockBadge,
  Modal,
  Loader,
  EmptyState
} from '../components/common'

import {
  Boxes,
  Plus,
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

import { formatDate } from '../utils/time'

const TX_TYPES = [
  'REPLENISHMENT',
  'USAGE',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'ADJUSTMENT',
  'RETURN'
]

export default function InventoryPage() {

  const qc = useQueryClient()

  const [filterStatus, setFilterStatus] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [showUpdate, setShowUpdate] = useState(false)

  // ================= INVENTORY =================

  const {
    data: inventory = [],
    isLoading
  } = useQuery({

    queryKey: ['inventory'],
    queryFn: inventoryApi.getAll,
  })

  // ================= LOCATIONS =================

  const {
    data: locations = []
  } = useQuery({

    queryKey: ['locations'],
    queryFn: locationsApi.getAll,
  })

  // ================= ITEMS =================

  const {
    data: itemsPage = []
  } = useQuery({

    queryKey: ['items-all'],

    queryFn: () =>
      itemsApi.getAll(0, 200),
  })

  // FIXED
  const itemList = Array.isArray(itemsPage)
    ? itemsPage
    : []

  // ================= UPDATE =================

  const updateMut = useMutation({

    mutationFn: inventoryApi.updateStock,

    onSuccess: () => {

      qc.invalidateQueries(['inventory'])
      qc.invalidateQueries(['dashboard'])
      qc.invalidateQueries(['low-stock'])

      setShowUpdate(false)

      toast.success(
        'Stock updated successfully!'
      )
    },

    onError: e => {

      toast.error(e.message)
    },
  })

  // ================= FILTERS =================

  const filtered = inventory.filter(inv => {

    if (
      filterStatus &&
      inv.stockStatus !== filterStatus
    ) {
      return false
    }

    if (
      filterLocation &&
      String(inv.locationId) !== filterLocation
    ) {
      return false
    }

    return true
  })

  return (
    <div>

      <PageHeader
        title="Inventory"
        subtitle="Stock levels across all locations"

        action={
          <button
            className="btn-primary"
            onClick={() => setShowUpdate(true)}
          >
            <Plus size={16} />
            Update Stock
          </button>
        }
      />

      {/* ================= FILTERS ================= */}

      <div className="flex flex-wrap items-center gap-3 mb-4">

        <Filter
          size={14}
          className="text-slate-400"
        />

        <select
          className="input max-w-[160px]"
          value={filterStatus}
          onChange={e =>
            setFilterStatus(e.target.value)
          }
        >

          <option value="">
            All Statuses
          </option>

          <option value="IN_STOCK">
            In Stock
          </option>

          <option value="LOW_STOCK">
            Low Stock
          </option>

          <option value="OUT_OF_STOCK">
            Out of Stock
          </option>

          <option value="OVERSTOCKED">
            Overstocked
          </option>
        </select>

        <select
          className="input max-w-[180px]"
          value={filterLocation}
          onChange={e =>
            setFilterLocation(e.target.value)
          }
        >

          <option value="">
            All Locations
          </option>

          {locations.map(l => (

            <option
              key={l.id}
              value={l.id}
            >
              {l.name}
            </option>
          ))}
        </select>

        {(filterStatus || filterLocation) && (

          <button
            className="text-sm text-indigo-600 hover:underline"

            onClick={() => {

              setFilterStatus('')
              setFilterLocation('')
            }}
          >
            Clear filters
          </button>
        )}

        <span className="text-sm text-slate-400 ml-auto">
          {filtered.length} records
        </span>
      </div>

      {/* ================= TABLE ================= */}

      <div className="card overflow-hidden">

        {isLoading ? (

          <Loader />

        ) : filtered.length === 0 ? (

          <EmptyState
            icon={Boxes}
            title="No inventory records"
            description="Add items and locations to start tracking stock."
          />

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>

                <tr className="bg-slate-50 border-b border-slate-100">

                  {[
                    'Item',
                    'Location',
                    'Qty',
                    'Reorder At',
                    'Status',
                  ].map(h => (

                    <th
                      key={h}
                      className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>

                {filtered.map(inv => (

                  <tr
                    key={inv.id}
                    className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                  >

                    <td className="py-3 px-4">

                      <p className="font-medium text-slate-800">
                        {inv.itemName}
                      </p>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {inv.locationName}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {inv.quantity}
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      {inv.reorderLevel}
                    </td>

                    <td className="py-3 px-4">
                      <StockBadge
                        status={inv.stockStatus}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL ================= */}

      {showUpdate && (

        <UpdateStockModal
          items={itemList}
          locations={locations}

          onClose={() =>
            setShowUpdate(false)
          }

          onSave={data =>
            updateMut.mutate(data)
          }

          loading={updateMut.isPending}
        />
      )}
    </div>
  )
}

// =====================================================
// UPDATE STOCK MODAL
// =====================================================

function UpdateStockModal({
  items,
  locations,
  onClose,
  onSave,
  loading
}) {

  const [form, setForm] = useState({

    itemId: '',
    locationId: '',
    transactionType: 'REPLENISHMENT',
    quantity: 1,
    referenceNo: '',
    notes: '',
    performedBy: '',
  })

  const set = (k, v) =>
    setForm(f => ({ ...f, [k]: v }))

  const isOut = [
    'USAGE',
    'TRANSFER_OUT'
  ].includes(form.transactionType)

  const submit = () => {

    if (!form.itemId || !form.locationId) {

      toast.error(
        'Select item and location'
      )

      return
    }

    if (!form.quantity || form.quantity <= 0) {

      toast.error(
        'Quantity must be greater than 0'
      )

      return
    }

    onSave({

      itemId: Number(form.itemId),

      locationId: Number(form.locationId),

      transactionType:
        form.transactionType,

      quantity:
        Number(form.quantity),

      referenceNo:
        form.referenceNo || null,

      notes:
        form.notes || null,

      performedBy:
        form.performedBy || null,
    })
  }

  return (

    <Modal
      title="Update Stock Level"
      onClose={onClose}
      size="lg"
    >

      <div className="space-y-4">

        <div className="grid grid-cols-2 gap-4">

          <div>

            <label className="label">
              Item *
            </label>

            <select
              className="input"
              value={form.itemId}
              onChange={e =>
                set('itemId', e.target.value)
              }
            >

              <option value="">
                — Select item —
              </option>

              {items.map(i => (

                <option
                  key={i.id}
                  value={i.id}
                >
                  {i.name} ({i.sku})
                </option>
              ))}
            </select>
          </div>

          <div>

            <label className="label">
              Location *
            </label>

            <select
              className="input"
              value={form.locationId}
              onChange={e =>
                set(
                  'locationId',
                  e.target.value
                )
              }
            >

              <option value="">
                — Select location —
              </option>

              {locations.map(l => (

                <option
                  key={l.id}
                  value={l.id}
                >
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">

          <div>

            <label className="label">
              Transaction Type *
            </label>

            <select
              className="input"
              value={form.transactionType}

              onChange={e =>
                set(
                  'transactionType',
                  e.target.value
                )
              }
            >

              {TX_TYPES.map(t => (

                <option
                  key={t}
                  value={t}
                >
                  {t.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>

            <label className="label">
              Quantity *
            </label>

            <div className="relative">

              <span
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  isOut
                    ? 'text-red-500'
                    : 'text-emerald-500'
                }`}
              >
                {isOut
                  ? <ArrowDownRight size={14} />
                  : <ArrowUpRight size={14} />}
              </span>

              <input
                className="input pl-9"
                type="number"
                min="1"

                value={form.quantity}

                onChange={e =>
                  set(
                    'quantity',
                    Number(e.target.value)
                  )
                }

                placeholder="0"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">

          <div>

            <label className="label">
              Reference No.
            </label>

            <input
              className="input"

              value={form.referenceNo}

              onChange={e =>
                set(
                  'referenceNo',
                  e.target.value
                )
              }

              placeholder="PO-2024-001"
            />
          </div>

          <div>

            <label className="label">
              Performed By
            </label>

            <input
              className="input"

              value={form.performedBy}

              onChange={e =>
                set(
                  'performedBy',
                  e.target.value
                )
              }

              placeholder="Your name"
            />
          </div>
        </div>

        <div>

          <label className="label">
            Notes
          </label>

          <textarea
            className="input"
            rows={2}

            value={form.notes}

            onChange={e =>
              set('notes', e.target.value)
            }

            placeholder="Optional notes…"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">

          <button
            className="btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="btn-primary"
            disabled={loading}
            onClick={submit}
          >
            {loading
              ? 'Updating…'
              : 'Update Stock'}
          </button>
        </div>
      </div>
    </Modal>
  )
}