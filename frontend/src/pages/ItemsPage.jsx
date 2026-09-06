import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { itemsApi, categoriesApi } from '../api'
import { PageHeader, Modal, Loader, EmptyState } from '../components/common'
import { Package, Plus, Edit2, Trash2, Search } from 'lucide-react'

export default function ItemsPage() {

  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [editItem, setEditItem] = useState(null)
  const [showCreate, setShowCreate] = useState(false)

  // ================= ITEMS =================

  const {
    data: itemsPage = [],
    isLoading
  } = useQuery({

    queryKey: ['items', search],

    queryFn: () =>
      search
        ? itemsApi.search(search)
        : itemsApi.getAll(),
  })

  // ================= CATEGORIES =================

  const {
    data: categories = []
  } = useQuery({

    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  })

  // ================= CREATE =================

  const createMut = useMutation({

    mutationFn: itemsApi.create,

    onSuccess: () => {

      qc.invalidateQueries(['items'])

      setShowCreate(false)

      toast.success('Item created!')
    },

    onError: e => toast.error(e.message),
  })

  // ================= UPDATE =================

  const updateMut = useMutation({

    mutationFn: ({ id, data }) =>
      itemsApi.update(id, data),

    onSuccess: () => {

      qc.invalidateQueries(['items'])

      setEditItem(null)

      toast.success('Item updated!')
    },

    onError: e => toast.error(e.message),
  })

  // ================= DELETE =================

  const deleteMut = useMutation({

    mutationFn: itemsApi.remove,

    onSuccess: () => {

      qc.invalidateQueries(['items'])

      toast.success('Item removed')
    },

    onError: e => toast.error(e.message),
  })

  // ================= FIXED =================
  // Backend now returns RAW ARRAY directly

  const items = Array.isArray(itemsPage)
    ? itemsPage
    : []

  return (
    <div>

      <PageHeader
        title="Items"
        subtitle="Manage your product catalog"

        action={
          <button
            className="btn-primary"
            onClick={() => setShowCreate(true)}
          >
            <Plus size={16} />
            Add Item
          </button>
        }
      />

      <div className="card">

        {/* ================= SEARCH BAR ================= */}

        <div className="p-4 border-b border-slate-100 flex items-center gap-3">

          <div className="relative flex-1 max-w-sm">

            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, SKU, usage context…"
              className="input pl-9"
            />
          </div>

          <span className="text-sm text-slate-400">
            {items.length} items
          </span>
        </div>

        {/* ================= CONTENT ================= */}

        {isLoading ? (

          <Loader />

        ) : items.length === 0 ? (

          <EmptyState
            icon={Package}
            title="No items found"
            description="Add your first inventory item to get started."
          />

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">

                  {[
                    'SKU',
                    'Name',
                    'Category',
                    'Unit',
                    'Unit Price',
                    'Reorder Level',
                    'Actions'
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

                {items.map(item => (

                  <tr
                    key={item.id}
                    className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                  >

                    <td className="py-3 px-4 font-mono text-xs text-slate-500">
                      {item.sku}
                    </td>

                    <td className="py-3 px-4">

                      <p className="font-medium text-slate-800">
                        {item.name}
                      </p>

                      {item.description && (

                        <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">
                          {item.description}
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-4">

                      {item.categoryName ? (

                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs">
                          {item.categoryName}
                        </span>

                      ) : (

                        <span className="text-slate-300">
                          —
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {item.unit}
                    </td>

                    <td className="py-3 px-4 text-slate-600">

                      {item.unitPrice
                        ? `₹${Number(item.unitPrice).toLocaleString()}`
                        : '—'}
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {item.reorderLevel}
                    </td>

                    <td className="py-3 px-4">

                      <div className="flex items-center gap-2">

                        <button
                          onClick={() => setEditItem(item)}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          onClick={() => {

                            if (
                              window.confirm(
                                'Deactivate this item?'
                              )
                            ) {

                              deleteMut.mutate(item.id)
                            }
                          }}

                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(showCreate || editItem) && (

        <ItemForm
          item={editItem}
          categories={categories}

          onClose={() => {

            setShowCreate(false)
            setEditItem(null)
          }}

          onSave={data => {

            editItem
              ? updateMut.mutate({
                  id: editItem.id,
                  data
                })
              : createMut.mutate(data)
          }}

          loading={
            createMut.isPending ||
            updateMut.isPending
          }
        />
      )}
    </div>
  )
}

function ItemForm({
  item,
  categories,
  onClose,
  onSave,
  loading
}) {

  const [form, setForm] = useState({

    sku: item?.sku || '',
    name: item?.name || '',
    description: item?.description || '',
    usageContext: item?.usageContext || '',
    categoryId: item?.categoryId || '',
    unit: item?.unit || 'units',
    unitPrice: item?.unitPrice || '',
    reorderLevel: item?.reorderLevel ?? 10,
    maxStockLevel: item?.maxStockLevel ?? 1000,
  })

  const set = (k, v) =>
    setForm(f => ({ ...f, [k]: v }))

  return (

    <Modal
      title={item ? 'Edit Item' : 'Add New Item'}
      onClose={onClose}
      size="lg"
    >

      <div className="space-y-4">

        <div className="grid grid-cols-2 gap-4">

          <div>
            <label className="label">
              SKU *
            </label>

            <input
              className="input"
              value={form.sku}
              onChange={e => set('sku', e.target.value)}
              placeholder="e.g. EL-001"
            />
          </div>

          <div>
            <label className="label">
              Category
            </label>

            <select
              className="input"
              value={form.categoryId}
              onChange={e => set('categoryId', e.target.value)}
            >

              <option value="">
                — None —
              </option>

              {categories.map(c => (

                <option
                  key={c.id}
                  value={c.id}
                >
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">
            Name *
          </label>

          <input
            className="input"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Item name"
          />
        </div>

      </div>
    </Modal>
  )
}