// src/pages/admin/PendingUsersPage.tsx
// Admin panel — approve or reject pending teacher signup requests
import { useState, useEffect } from 'react'
import { authService } from '../../services/auth.service'
import { useAuth } from '../../hooks/useAuth'

type PendingUser = {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: string
  created_at: string
}

export default function PendingUsersPage() {
  const { user } = useAuth()
  const [pending, setPending] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchPending = async () => {
    if (!user?.school_id) return
    setLoading(true)
    const { data } = await authService.getPendingUsers(user.school_id)
    setPending((data as PendingUser[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchPending() }, [user])

  const approve = async (id: string, name: string) => {
    setActing(id)
    const { error } = await authService.approveUser(id)
    if (error) {
      showToast('Failed to approve user.', 'error')
    } else {
      setPending((p) => p.filter((u) => u.id !== id))
      showToast(`✅ ${name} approved successfully.`, 'success')
    }
    setActing(null)
  }

  const reject = async (id: string, name: string) => {
    if (!confirm(`Reject and delete ${name}'s account request?`)) return
    setActing(id)
    const { error } = await authService.rejectUser(id)
    if (error) {
      showToast('Failed to reject user.', 'error')
    } else {
      setPending((p) => p.filter((u) => u.id !== id))
      showToast(`🗑 ${name}'s request was rejected.`, 'success')
    }
    setActing(null)
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 760, margin: '0 auto' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Instrument+Sans:wght@400;500;600&display=swap');
        .pu-card {
          background: rgba(15,2,26,0.7);
          border: 1px solid rgba(139,92,246,0.2);
          border-radius: 18px;
          padding: 20px 22px;
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 14px;
          backdrop-filter: blur(12px);
          transition: border-color 0.2s;
        }
        .pu-card:hover { border-color: rgba(139,92,246,0.35); }
        .pu-avatar {
          width: 46px; height: 46px; border-radius: 50%;
          background: linear-gradient(135deg, #7e22ce, #a855f7);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; font-weight: 700; color: #fff;
          flex-shrink: 0;
          box-shadow: 0 4px 14px rgba(139,92,246,0.35);
        }
        .pu-info { flex: 1; min-width: 0; }
        .pu-name {
          font-family: 'Syne', sans-serif;
          font-size: 15px; font-weight: 700; color: #fff;
          margin-bottom: 3px;
        }
        .pu-meta { font-size: 12.5px; color: rgba(255,255,255,0.4); line-height: 1.6; }
        .pu-actions { display: flex; gap: 8px; flex-shrink: 0; }
        .pu-btn {
          padding: 8px 16px; border-radius: 9px; border: none;
          font-size: 12px; font-weight: 700; cursor: pointer;
          font-family: 'Syne', sans-serif;
          transition: all 0.2s;
          letter-spacing: 0.03em;
        }
        .pu-btn-approve {
          background: linear-gradient(135deg, #7e22ce, #a855f7);
          color: #fff;
          box-shadow: 0 4px 14px rgba(139,92,246,0.35);
        }
        .pu-btn-approve:hover { box-shadow: 0 4px 20px rgba(139,92,246,0.5); transform: translateY(-1px); }
        .pu-btn-reject {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.2);
          color: #fca5a5;
        }
        .pu-btn-reject:hover { background: rgba(239,68,68,0.18); }
        .pu-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
        .pu-toast {
          position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
          padding: 12px 24px; border-radius: 14px;
          font-size: 13px; font-weight: 600;
          font-family: 'Instrument Sans', sans-serif;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          z-index: 9999;
          animation: toastIn 0.35s ease;
        }
        .pu-toast.success { background: rgba(139,92,246,0.9); color: #fff; }
        .pu-toast.error { background: rgba(239,68,68,0.9); color: #fff; }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(192,132,252,0.6)', marginBottom: 6, fontFamily: 'Syne, sans-serif' }}>
          Admin Panel
        </div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
          Pending Account Requests
        </h1>
        <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
          Review and approve teacher signup requests for your school.
        </p>
      </div>

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>Loading requests…</p>
      ) : pending.length === 0 ? (
        <div style={{
          background: 'rgba(139,92,246,0.06)',
          border: '1px dashed rgba(139,92,246,0.2)',
          borderRadius: 18, padding: '40px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.5)', fontFamily: 'Syne, sans-serif' }}>
            No pending requests
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
            All teacher accounts are up to date.
          </p>
        </div>
      ) : (
        pending.map((u) => (
          <div key={u.id} className="pu-card">
            <div className="pu-avatar">
              {u.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="pu-info">
              <div className="pu-name">{u.full_name}</div>
              <div className="pu-meta">
                {u.email}
                {u.phone && ` · ${u.phone}`}
                {' · '}Requested {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
            <div className="pu-actions">
              <button
                className="pu-btn pu-btn-reject"
                onClick={() => reject(u.id, u.full_name)}
                disabled={acting === u.id}
              >
                Reject
              </button>
              <button
                className="pu-btn pu-btn-approve"
                onClick={() => approve(u.id, u.full_name)}
                disabled={acting === u.id}
              >
                {acting === u.id ? '…' : 'Approve'}
              </button>
            </div>
          </div>
        ))
      )}

      {toast && (
        <div className={`pu-toast ${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  )
}