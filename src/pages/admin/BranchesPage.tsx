// src/pages/admin/BranchesPage.tsx
// Branch / Campus Management — view, add, manage school branches

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBranches, useCreateBranch, useDeleteBranch } from '../../hooks/useBranches'
import toast from 'react-hot-toast'

export default function BranchesPage() {
  const { data: branches = [], isLoading } = useBranches()
  const createBranch = useCreateBranch()
  const deleteBranch = useDeleteBranch()

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ branch_name: '', address: '', phone: '', email: '' })

  const handleCreate = async () => {
    if (!form.branch_name.trim()) return toast.error('Branch name is required')
    await createBranch.mutateAsync(form)
    setForm({ branch_name: '', address: '', phone: '', email: '' })
    setShowModal(false)
  }

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete branch "${name}"? This cannot be undone.`)) {
      deleteBranch.mutate(id)
    }
  }

  return (
    <div style={{ padding: '24px 20px', maxWidth: 960, margin: '0 auto', fontFamily: '"DM Sans", sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-main, #0f172a)', margin: 0 }}>🏢 Branches</h1>
          <p style={{ color: 'var(--text-muted, #64748b)', fontSize: 14, marginTop: 4 }}>
            Manage your school's campuses and branches from one place.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '10px 20px', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
            fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          + Add Branch
        </button>
      </div>

      {/* Aggregate Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Branches', value: branches.length, icon: '🏢', color: '#6366f1' },
          { label: 'Active Campuses', value: branches.length, icon: '✅', color: '#059669' },
        ].map(stat => (
          <div key={stat.label} style={{
            padding: 20, borderRadius: 16, background: 'var(--bg-card, #fff)',
            border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: 28 }}>{stat.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: stat.color, marginTop: 8 }}>{stat.value}</div>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Branch cards */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading branches…</div>
      ) : branches.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60, borderRadius: 20,
          background: 'var(--bg-card, #fff)', border: '2px dashed var(--border-color, #e2e8f0)',
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🏗️</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main, #0f172a)', marginBottom: 8 }}>No branches yet</h3>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>Add your first campus to manage multiple school locations from one admin portal.</p>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '10px 24px', borderRadius: 12, border: 'none',
              background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            + Add First Branch
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {branches.map((branch, i) => (
            <motion.div
              key={branch.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                padding: 24, borderRadius: 18, background: 'var(--bg-card, #fff)',
                border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Top accent */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `hsl(${(i * 55) % 360}, 70%, 60%)` }} />

              <div style={{ fontSize: 32, marginBottom: 12 }}>🏫</div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main, #0f172a)', marginBottom: 4 }}>
                {branch.branch_name || branch.name}
              </h3>
              {branch.address && <p style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>📍 {branch.address}</p>}
              {branch.phone && <p style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>📞 {branch.phone}</p>}
              {branch.email && <p style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>✉️ {branch.email}</p>}

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button
                  onClick={() => toast('Branch management coming soon!', { icon: '🚧' })}
                  style={{
                    flex: 1, padding: '8px 14px', borderRadius: 10, border: '1.5px solid #6366f1',
                    background: '#eef2ff', color: '#6366f1', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                  }}
                >
                  Manage →
                </button>
                <button
                  onClick={() => handleDelete(branch.id, branch.branch_name || branch.name)}
                  style={{
                    padding: '8px 14px', borderRadius: 10, border: '1.5px solid #fecaca',
                    background: '#fef2f2', color: '#dc2626', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Branch Modal */}
      <AnimatePresence>
        {showModal && (
          <div
            onClick={() => setShowModal(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 99999,
              background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}
          >
            <motion.div
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              style={{
                background: 'var(--bg-card, #fff)', borderRadius: 20, padding: 32,
                width: '100%', maxWidth: 440, boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              }}
            >
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main, #0f172a)', marginBottom: 20 }}>
                🏢 Add New Branch
              </h2>

              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Branch Name *</label>
                  <input
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                    value={form.branch_name}
                    onChange={e => setForm(f => ({ ...f, branch_name: e.target.value }))}
                    placeholder="e.g. Kumasi Campus"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Address</label>
                  <input
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                    value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="Branch address"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Phone</label>
                    <input
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="Phone"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Email</label>
                    <input
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="Email"
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'transparent', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={createBranch.isPending}
                  style={{
                    padding: '10px 24px', borderRadius: 12, border: 'none',
                    background: createBranch.isPending ? '#94a3b8' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#fff', fontWeight: 700, fontSize: 14, cursor: createBranch.isPending ? 'not-allowed' : 'pointer',
                  }}
                >
                  {createBranch.isPending ? 'Creating…' : 'Create Branch'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
