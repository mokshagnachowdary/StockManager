import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { locationsApi } from '../api'
import { PageHeader, Modal, Loader, EmptyState } from '../components/common'
import { MapPin, Plus, Edit2, Trash2, Building2, Store, Monitor, Factory } from 'lucide-react'

const TYPE_META = {
  WAREHOUSE: { icon: Building2, color: 'bg-indigo-50 text-indigo-700' },
  STORE:     { icon: Store,     color: 'bg-emerald-50 text-emerald-700' },
  OFFICE:    { icon: Monitor,   color: 'bg-blue-50 text-blue-700' },
  FACTORY:   { icon: Factory,   color: 'bg-amber-50 text-amber-700' },
  OTHER:     { icon: MapPin,    color: 'bg-slate-100 text-slate-600' },
}

export default function LocationsPage() {
  const qc = useQueryClient()
  const [editLoc, setEditLoc]       = useState(null)
  const [showCreate, setShowCreate] = useState(false)

  const { data: locations = [], isLoading } = useQuery({ queryKey: ['locations'], queryFn: locationsApi.getAll })

  const createMut = useMutation({
    mutationFn: locationsApi.create,
    onSuccess: () => { qc.invalidateQueries(['locations']); setShowCreate(false); toast.success('Location created!') },
    onError: e => toast.error(e.message),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => locationsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['locations']); setEditLoc(null); toast.success('Location updated!') },
    onError: e => toast.error(e.message),
  })
  const deleteMut = useMutation({
    mutationFn: locationsApi.remove,
    onSuccess: () => { qc.invalidateQueries(['locations']); toast.success('Location removed') },
    onError: e => toast.error(e.message),
  })

  return (
    <div>
      <PageHeader
        title="Locations"
        subtitle="Warehouses, stores, and facilities"
        action={<button className="btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> Add Location</button>}
      />

      {isLoading ? <Loader /> : locations.length === 0 ? (
        <EmptyState icon={MapPin} title="No locations" description="Add your first location to start tracking inventory." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map(loc => {
            const meta = TYPE_META[loc.type] || TYPE_META.OTHER
            const Icon = meta.icon
            return (
              <div key={loc.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditLoc(loc)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => { if (window.confirm('Deactivate this location?')) deleteMut.mutate(loc.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-slate-800">{loc.name}</h3>
                {loc.description && <p className="text-sm text-slate-500 mt-1">{loc.description}</p>}
                {loc.address && (
                  <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                    <MapPin size={10} /> {loc.address}
                  </p>
                )}
                <span className={`mt-3 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${meta.color}`}>
                  {loc.type}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {(showCreate || editLoc) && (
        <LocationForm
          loc={editLoc}
          onClose={() => { setShowCreate(false); setEditLoc(null) }}
          onSave={data => { editLoc ? updateMut.mutate({ id: editLoc.id, data }) : createMut.mutate(data) }}
          loading={createMut.isPending || updateMut.isPending}
        />
      )}
    </div>
  )
}

function LocationForm({ loc, onClose, onSave, loading }) {
  const [form, setForm] = useState({
    name:        loc?.name        || '',
    description: loc?.description || '',
    address:     loc?.address     || '',
    type:        loc?.type        || 'WAREHOUSE',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <Modal title={loc ? 'Edit Location' : 'Add Location'} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label">Name *</label>
          <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Main Warehouse" />
        </div>
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
            {['WAREHOUSE','STORE','OFFICE','FACTORY','OTHER'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
        </div>
        <div>
          <label className="label">Address</label>
          <input className="input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full address" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={loading || !form.name} onClick={() => onSave(form)}>
            {loading ? 'Saving…' : loc ? 'Save Changes' : 'Create Location'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
