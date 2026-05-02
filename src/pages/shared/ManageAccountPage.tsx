// src/pages/shared/ManageAccountPage.tsx
import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { User, Shield, Camera, Lock, ArrowLeft, Loader2, Phone, Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional().or(z.literal('')),
})
type FormData = z.infer<typeof schema>

const passwordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string()
}).refine(data => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
})
type PasswordData = z.infer<typeof passwordSchema>

export default function ManageAccountPage() {
  const { user, session } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [avatarUploading, setAvatarUploading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const { register: regPwd, handleSubmit: handlePwdSubmit, reset: resetPwd, formState: { errors: pwdErrors } } = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) })

  useEffect(() => {
    if (user) {
      reset({
        full_name: user.full_name || '',
        phone: user.phone || ''
      })
    }
  }, [user, reset])

  async function handleUpdateProfile(data: FormData) {
    if (!user) return
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: data.full_name,
          phone: data.phone || null
        })
        .eq('id', user.id)

      if (error) throw error
      await qc.invalidateQueries({ queryKey: ['user'] })
      toast.success('Profile updated successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile')
    }
  }

  async function handleUpdatePassword(data: PasswordData) {
    setPasswordLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: data.password })
      if (error) throw error
      toast.success('Password updated successfully')
      resetPwd()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password')
    } finally {
      setPasswordLoading(false)
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }

    setAvatarUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `avatars/${user.id}_${Date.now()}.${ext}`
      
      const { error: uploadError } = await supabase.storage.from('school-assets').upload(path, file)
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('school-assets').getPublicUrl(path)
      
      const { error: updateError } = await supabase.from('users').update({ avatar_url: urlData.publicUrl }).eq('id', user.id)
      if (updateError) throw updateError

      await qc.invalidateQueries({ queryKey: ['user'] })
      toast.success('Profile picture updated!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload image')
    } finally {
      setAvatarUploading(false)
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px', animation: 'fadeIn 0.4s ease' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        .acc-card { background: #fff; border-radius: 20px; border: 1.5px solid #f0eefe; box-shadow: 0 4px 20px rgba(0,0,0,0.03); overflow: hidden; margin-bottom: 24px; }
        .acc-header { background: linear-gradient(135deg, #f8fafc, #f1f5f9); padding: 20px 24px; border-bottom: 1.5px solid #f0eefe; display: flex; align-items: center; gap: 12px; }
        .acc-body { padding: 24px; }
        .input-group { margin-bottom: 16px; }
        .input-label { display: block; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
        .acc-input { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1.5px solid #e2e8f0; font-size: 14px; outline: none; transition: all 0.2s; background: #fff; color: #1e293b; font-family: inherit; box-sizing: border-box; }
        .acc-input:focus { border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }
        .acc-btn { padding: 12px 24px; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; border: none; font-family: inherit; }
        .acc-btn-primary { background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; box-shadow: 0 4px 12px rgba(79,70,229,0.2); }
        .acc-btn-primary:hover:not(:disabled) { box-shadow: 0 6px 16px rgba(79,70,229,0.3); transform: translateY(-1px); }
        .acc-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      {/* Top Navigation */}
      <button onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 24, padding: 0 }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 32, fontWeight: 700, color: '#0f172a', margin: 0 }}>Account Settings</h1>
        <p style={{ color: '#64748b', fontSize: 15, marginTop: 4 }}>Manage your personal details, security, and preferences.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.5fr)', gap: 24, alignItems: 'start' }}>
        
        {/* Left Column: Avatar Card */}
        <div className="acc-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 20px' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 700, color: '#fff', overflow: 'hidden', border: '4px solid #fff', boxShadow: '0 8px 24px rgba(99,102,241,0.2)' }}>
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user?.full_name?.charAt(0).toUpperCase() || <User size={40} />
              )}
            </div>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              style={{ position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {avatarUploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>{user?.full_name}</h2>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>{user?.email}</div>
          <span style={{ display: 'inline-block', padding: '4px 12px', background: '#f1f5f9', color: '#475569', borderRadius: 99, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {user?.role.replace('_', ' ')}
          </span>
        </div>

        {/* Right Column: Forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Profile Form */}
          <div className="acc-card">
            <div className="acc-header">
              <User size={20} color="#4f46e5" />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>Personal Details</h3>
            </div>
            <div className="acc-body">
              <form onSubmit={handleSubmit(handleUpdateProfile)}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">Full Name</label>
                    <input {...register('full_name')} className="acc-input" placeholder="e.g. Jane Doe" />
                    {errors.full_name && <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.full_name.message}</span>}
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: 16, top: 14 }} />
                      <input disabled value={user?.email || ''} className="acc-input" style={{ paddingLeft: 40, background: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' }} />
                    </div>
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">Phone Number</label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={16} color="#94a3b8" style={{ position: 'absolute', left: 16, top: 14 }} />
                      <input {...register('phone')} className="acc-input" style={{ paddingLeft: 40 }} placeholder="024 000 0000" />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button type="submit" disabled={!isDirty || isSubmitting} className="acc-btn acc-btn-primary">
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Security Form */}
          <div className="acc-card">
            <div className="acc-header">
              <Shield size={20} color="#10b981" />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>Security</h3>
            </div>
            <div className="acc-body">
              <form onSubmit={handlePwdSubmit(handleUpdatePassword)}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="input-group">
                    <label className="input-label">New Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: 16, top: 14 }} />
                      <input type="password" {...regPwd('password')} className="acc-input" style={{ paddingLeft: 40 }} placeholder="••••••••" />
                    </div>
                    {pwdErrors.password && <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>{pwdErrors.password.message}</span>}
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">Confirm Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: 16, top: 14 }} />
                      <input type="password" {...regPwd('confirm_password')} className="acc-input" style={{ paddingLeft: 40 }} placeholder="••••••••" />
                    </div>
                    {pwdErrors.confirm_password && <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>{pwdErrors.confirm_password.message}</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button type="submit" disabled={passwordLoading} className="acc-btn acc-btn-primary" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}>
                    {passwordLoading ? <Loader2 size={16} className="animate-spin" /> : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
