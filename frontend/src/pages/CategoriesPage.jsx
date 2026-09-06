import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { categoriesApi } from '../api'
import { PageHeader, Modal, Loader, EmptyState } from '../components/common'
import { Tag, Plus } from 'lucide-react'

export default function CategoriesPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })

  const { data: categories = [], isLoading } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.getAll })
  const createMut = useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      qc.invalidateQueries(['categories'])
      setShowCreate(false)
      setForm({ name: '', description: '' })
      toast.success('Category created!')
    },
    onError: e => toast.error(e.message),
  })

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Organise items by category"
        action={<button className="btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> Add Category</button>}
      />

      {isLoading ? <Loader /> : categories.length === 0 ? (
        <EmptyState icon={Tag} title="No categories" description="Create categories to organize your items." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(c => (
            <div key={c.id} className="card p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <Tag size={16} />
              </div>
              <div>
                <p className="font-semibold text-slate-800">{c.name}</p>
                {c.description && <p className="text-sm text-slate-500 mt-0.5">{c.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="Add Category" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <div>
              <label className="label">Name *</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Electronics" />
            </div>
            <div>
              <label className="label">Description</label>
              <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn-primary" disabled={createMut.isPending} onClick={() => createMut.mutate(form)}>
                {createMut.isPending ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
