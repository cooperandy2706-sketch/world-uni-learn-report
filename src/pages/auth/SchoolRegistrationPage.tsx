// src/pages/auth/SchoolRegistrationPage.tsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ROUTES } from '../../constants/routes'

export default function SchoolRegistrationPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    school_name: '',
    school_email: '',
    school_phone: '',
    school_address: '',
    motto: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
    confirm_password: '',
  })

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.admin_password !== form.confirm_password) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      // 1. Create the school (Pending status)
      // Since we don't have a specific ID, let's generates a random short one or use UUID
      const schoolId = Math.random().toString(36).substring(2, 8).toUpperCase()
      
      const { error: schoolErr } = await supabase.from('schools').insert({
        id: schoolId,
        name: form.school_name,
        email: form.school_email,
        phone: form.school_phone,
        address: form.school_address,
        motto: form.motto,
        status: 'pending'
      })

      if (schoolErr) throw schoolErr

      // 2. Create the admin user in Supabase Auth
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: form.admin_email,
        password: form.admin_password,
        options: { data: { full_name: form.admin_name } }
      })

      if (authErr) throw authErr
      if (!authData.user) throw new Error('Failed to create account')

      // 3. Create the user profile
      const { error: profileErr } = await supabase.from('users').insert({
        id: authData.user.id,
        school_id: schoolId,
        full_name: form.admin_name,
        email: form.admin_email,
        role: 'admin',
        is_active: false // Inactive until school is approved
      })

      if (profileErr) throw profileErr

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 60, marginBottom: 24 }}>📨</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Request Received!</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 32 }}>
              Your school registration request has been submitted successfully. 
              Our administrators will review your application and confirm your school within **24 hours**.
            </p>
            <Link to="/" style={btnStyle}>Return Home</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
         <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Register Your School</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
              Step {step} of 2
            </p>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #ef444450', padding: 12, borderRadius: 8, marginBottom: 24, color: '#fca5a5', fontSize: 13 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister}>
            {step === 1 ? (
              <div style={{ display: 'grid', gap: 20 }}>
                <Field label="School Name" value={form.school_name} onChange={(v) => update('school_name', v)} required />
                <Field label="School Email" type="email" value={form.school_email} onChange={(v) => update('school_email', v)} required />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="Phone" value={form.school_phone} onChange={(v) => update('school_phone', v)} />
                  <Field label="Address" value={form.school_address} onChange={(v) => update('school_address', v)} />
                </div>
                <Field label="Motto" value={form.motto} onChange={(v) => update('motto', v)} />
                <button type="button" style={btnStyle} onClick={() => setStep(2)}>Next Step →</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 20 }}>
                <Field label="Administrator Name" value={form.admin_name} onChange={(v) => update('admin_name', v)} required />
                <Field label="Login Email" type="email" value={form.admin_email} onChange={(v) => update('admin_email', v)} required />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="Password" type="password" value={form.admin_password} onChange={(v) => update('admin_password', v)} required />
                  <Field label="Confirm Password" type="password" value={form.confirm_password} onChange={(v) => update('confirm_password', v)} required />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="button" style={{ ...btnStyle, background: 'rgba(255,255,255,0.1)' }} onClick={() => setStep(1)}>Back</button>
                  <button type="submit" style={btnStyle} disabled={loading}>
                    {loading ? 'Processing...' : 'Submit Registration'}
                  </button>
                </div>
              </div>
            )}
          </form>

          <p style={{ textAlign: 'center', marginTop: 32, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
            Already registered? <Link to="/login" style={{ color: '#f59e0b', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
          </p>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', required }: any) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        required={required}
        style={{
          width: '100%', padding: '12px 0', background: 'transparent', border: 'none', borderBottom: '2px solid rgba(255,255,255,0.2)',
          color: '#fff', outline: 'none', fontSize: 16
        }}
      />
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'linear-gradient(rgba(30, 6, 70, 0.8), rgba(91, 33, 182, 0.7)), url("/kids.JPG")',
  backgroundSize: 'cover', backgroundAttachment: 'fixed', padding: 24,
  fontFamily: '"Plus Jakarta Sans", sans-serif'
}

const cardStyle: React.CSSProperties = {
  width: '100%', maxWidth: 500, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 24, padding: 40, boxShadow: '0 25px 50px rgba(0,0,0,0.3)', color: '#fff'
}

const btnStyle: React.CSSProperties = {
  flex: 1, padding: '14px', borderRadius: 12, border: 'none', background: '#f59e0b', color: '#1e0646',
  fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', textDecoration: 'none', textAlign: 'center'
}
