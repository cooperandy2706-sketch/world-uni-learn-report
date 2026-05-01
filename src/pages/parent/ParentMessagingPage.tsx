// src/pages/parent/ParentMessagingPage.tsx
import { useAuth } from '../../hooks/useAuth'
import { useParentWards } from '../../hooks/useParents'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Phone, Mail, MessageSquare, ShieldCheck } from 'lucide-react'

export default function ParentMessagingPage() {
  const { user } = useAuth()
  const { data: wards = [], isLoading: loadingWards } = useParentWards()

  const { data: teachers = [], isLoading: loadingTeachers } = useQuery({
    queryKey: ['parent_ward_teachers', wards.map(w => w.id)],
    queryFn: async () => {
      if (wards.length === 0) return []
      const classIds = wards.map(w => w.class_id).filter(Boolean)
      if (classIds.length === 0) return []
      const { data, error } = await supabase
        .from('classes')
        .select(`
          id, name,
          teacher:teachers!class_teacher_id (
            id, staff_id,
            user:users (full_name, email, phone, avatar_url)
          )
        `)
        .in('id', classIds)
      if (error) throw error
      return data || []
    },
    enabled: wards.length > 0
  })

  if (loadingWards || loadingTeachers) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <style>{`@keyframes _spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2.5px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ fontFamily: '"DM Sans", sans-serif', paddingBottom: 40, maxWidth: 600, margin: '0 auto', animation: '_fadeIn .4s ease' }}>
      <style>{`
        @keyframes _fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .teacher-flex { display: flex; gap: 20px; align-items: flex-start; }
        @media (max-width: 500px) { 
          .teacher-flex { flex-direction: column; align-items: center; text-align: center; } 
          .teacher-actions { width: 100%; }
        }
      `}</style>

      <div style={{ marginBottom: 24, padding: '0 4px' }}>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Contact Teachers</h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Communication hub for your children's educators.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {wards.map(ward => {
          const classData = teachers.find(t => t.id === ward.class_id)
          const teacher = classData?.teacher as any

          return (
            <div key={ward.id} style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 4px 12px rgba(109,40,217,0.03)' }}>
              
              <div style={{ background: '#faf5ff', padding: '12px 20px', borderBottom: '1px solid #f0eefe', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14 }}>👶</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{ward.full_name} <span style={{ color: '#7c3aed', fontWeight: 500, marginLeft: 4 }}>• {classData?.name || 'No Class'}</span></div>
              </div>

              <div style={{ padding: 20 }}>
                {!teacher ? (
                  <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>👨‍🏫</div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>No class teacher assigned.</div>
                  </div>
                ) : (
                  <div className="teacher-flex">
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {teacher.user?.avatar_url ? (
                        <img src={teacher.user.avatar_url} alt="" style={{ width: 70, height: 70, borderRadius: 20, objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 4px 8px rgba(0,0,0,0.06)' }} />
                      ) : (
                        <div style={{ width: 70, height: 70, borderRadius: 20, background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#fff' }}>
                          {teacher.user?.full_name?.charAt(0)}
                        </div>
                      )}
                      <div style={{ position: 'absolute', bottom: -4, right: -4, width: 20, height: 20, background: '#10b981', borderRadius: '50%', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldCheck size={12} color="#fff" />
                      </div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 2px' }}>{teacher.user?.full_name}</h3>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>Class Teacher</div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <a href={`tel:${teacher.user?.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#4b5563', fontSize: 13 }}>
                          <Phone size={14} color="#7c3aed" /> {teacher.user?.phone || 'No phone'}
                        </a>
                        <a href={`mailto:${teacher.user?.email}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#4b5563', fontSize: 13 }}>
                          <Mail size={14} color="#7c3aed" /> {teacher.user?.email || 'No email'}
                        </a>
                      </div>
                    </div>

                    <div className="teacher-actions">
                      <button style={{ width: '100%', padding: '10px 16px', borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <MessageSquare size={16} /> Message
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {wards.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 24, padding: 30, textAlign: 'center', border: '1.5px solid #f0eefe' }}>
             <p style={{ fontSize: 14, color: '#6b7280' }}>No children linked to your account.</p>
          </div>
        )}
      </div>
    </div>
  )
}
