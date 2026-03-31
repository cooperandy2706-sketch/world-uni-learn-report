// src/pages/auth/SignUpPage.tsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services/auth.service'
import { ROUTES } from '../../constants/routes'

const schema = z.object({
  full_name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().optional(),
  school_id: z.string().min(1, 'Select your school'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
})

type FormData = z.infer<typeof schema>

type School = { id: string; name: string }

export default function SignUpPage() {
  const navigate = useNavigate()
  const { signUp } = useAuthStore()
  const [step, setStep] = useState<1 | 2>(1)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [schools, setSchools] = useState<School[]>([])
  const [loadingSchools, setLoadingSchools] = useState(true)

  useEffect(() => {
    authService.getSchools().then(({ data }) => {
      setSchools(data ?? [])
      setLoadingSchools(false)
    })
  }, [])

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const goToStep2 = async () => {
    const valid = await trigger(['full_name', 'email', 'phone', 'school_id'])
    if (valid) setStep(2)
  }

  const onSubmit = async (data: FormData) => {
    setServerError('')
    const { error, pending } = await signUp({
      full_name: data.full_name,
      email: data.email,
      password: data.password,
      phone: data.phone,
      school_id: data.school_id,
      role: 'teacher',
    })
    if (error) {
      setServerError(error)
    } else if (pending) {
      setSubmitted(true)
    }
  }

  // ── Pending / success screen ──
  if (submitted) {
    return (
      <div className="auth-card">
        <div style={{ textAlign: 'center' }}>
          <div className="pending-icon">⏳</div>
          <div className="auth-eyebrow" style={{ marginBottom: 8 }}>Request Submitted</div>
          <h2 className="auth-title" style={{ fontSize: 20, marginBottom: 12 }}>
            Awaiting Admin Approval
          </h2>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 28 }}>
            Your account request has been sent to your school administrator. You'll be able to sign in once they verify and approve your account.
          </p>

          <div style={{
            background: 'rgba(139,92,246,0.08)',
            border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: 14, padding: '16px 20px',
            textAlign: 'left', marginBottom: 28,
          }}>
            {[
              { icon: '📧', text: 'Check your email for a confirmation link' },
              { icon: '⏳', text: 'Your admin will review your request' },
              { icon: '✅', text: "You'll receive access once approved" },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                fontSize: 13, color: 'rgba(255,255,255,0.55)',
                marginBottom: i < 2 ? 10 : 0,
              }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>

          <Link to={ROUTES.LOGIN}>
            <button className="auth-btn" type="button">Back to Sign In</button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-card">
      {/* Logo */}
      <div className="auth-logo-wrap">
        <div className="auth-logo-icon">📘</div>
        <div className="auth-eyebrow">World Uni-Learn</div>
        <h1 className="auth-title">Request Access</h1>
        <p className="auth-subtitle">Create your teacher account</p>
      </div>

      <div className="auth-divider" />

      {/* Step indicator */}
      <div className="steps">
        <div className="step">
          <div className={`step-dot ${step === 1 ? 'active' : 'done'}`}>
            {step === 1 ? '1' : '✓'}
          </div>
          <span className={`step-label ${step === 1 ? 'active' : ''}`}>Your Info</span>
        </div>
        <div className="step-line" />
        <div className="step">
          <div className={`step-dot ${step === 2 ? 'active' : ''}`}>2</div>
          <span className={`step-label ${step === 2 ? 'active' : ''}`}>Security</span>
        </div>
      </div>

      {serverError && (
        <div className="auth-alert">
          <span>⚠️</span> <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* ── Step 1: Personal info ── */}
        {step === 1 && (
          <>
            <div className="field-row">
              <div className="field-group">
                <label className="field-label">Full Name</label>
                <div className="field-wrap">
                  <span className="field-icon">👤</span>
                  <input
                    {...register('full_name')}
                    type="text"
                    placeholder="Kofi Mensah"
                    className={`auth-input${errors.full_name ? ' err' : ''}`}
                    autoComplete="name"
                  />
                </div>
                {errors.full_name && <p className="field-error">⚠ {errors.full_name.message}</p>}
              </div>

              <div className="field-group">
                <label className="field-label">Phone (optional)</label>
                <div className="field-wrap">
                  <span className="field-icon">📱</span>
                  <input
                    {...register('phone')}
                    type="tel"
                    placeholder="+233 20 000 0000"
                    className="auth-input"
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Email Address</label>
              <div className="field-wrap">
                <span className="field-icon">✉️</span>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="kofi@school.edu.gh"
                  className={`auth-input${errors.email ? ' err' : ''}`}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="field-error">⚠ {errors.email.message}</p>}
            </div>

            <div className="field-group" style={{ marginBottom: 24 }}>
              <label className="field-label">Your School</label>
              <div className="field-wrap">
                <span className="field-icon">🏫</span>
                <select
                  {...register('school_id')}
                  className={`auth-select${errors.school_id ? ' err' : ''}`}
                  disabled={loadingSchools}
                >
                  <option value="">
                    {loadingSchools ? 'Loading schools…' : 'Select your school'}
                  </option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              {errors.school_id && <p className="field-error">⚠ {errors.school_id.message}</p>}
            </div>

            <button type="button" className="auth-btn" onClick={goToStep2}>
              Continue →
            </button>
          </>
        )}

        {/* ── Step 2: Password ── */}
        {step === 2 && (
          <>
            <div className="field-group">
              <label className="field-label">Password</label>
              <div className="field-wrap">
                <span className="field-icon">🔒</span>
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  className={`auth-input${errors.password ? ' err' : ''}`}
                  autoComplete="new-password"
                />
                <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && <p className="field-error">⚠ {errors.password.message}</p>}
            </div>

            <div className="field-group" style={{ marginBottom: 24 }}>
              <label className="field-label">Confirm Password</label>
              <div className="field-wrap">
                <span className="field-icon">🔏</span>
                <input
                  {...register('confirm_password')}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  className={`auth-input${errors.confirm_password ? ' err' : ''}`}
                  autoComplete="new-password"
                />
                <button type="button" className="eye-btn" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.confirm_password && <p className="field-error">⚠ {errors.confirm_password.message}</p>}
            </div>

            {/* Password rules hint */}
            <div style={{
              background: 'rgba(139,92,246,0.06)',
              border: '1px solid rgba(139,92,246,0.15)',
              borderRadius: 10, padding: '12px 14px',
              fontSize: 12, color: 'rgba(255,255,255,0.4)',
              lineHeight: 1.8, marginBottom: 22,
            }}>
              🛡️ Password must be 8+ characters with at least one uppercase letter and one number.
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 0 }}>
              <button
                type="button"
                className="auth-btn"
                style={{
                  background: 'rgba(139,92,246,0.12)',
                  border: '1px solid rgba(139,92,246,0.25)',
                  color: 'rgba(255,255,255,0.6)',
                  boxShadow: 'none',
                  flex: '0 0 42px',
                  padding: 0,
                }}
                onClick={() => setStep(1)}
              >
                ←
              </button>
              <button type="submit" className="auth-btn" disabled={isSubmitting} style={{ flex: 1 }}>
                {isSubmitting ? (
                  <><span className="spinner" />Submitting...</>
                ) : 'Submit Request →'}
              </button>
            </div>
          </>
        )}
      </form>

      <p className="auth-footer" style={{ marginTop: 24 }}>
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} className="auth-link">Sign in</Link>
      </p>

      <p style={{
        textAlign: 'center', marginTop: 10, fontSize: 12,
        color: 'rgba(255,255,255,0.2)', lineHeight: 1.6,
      }}>
        Your account will be reviewed and approved by your school admin before you can sign in.
      </p>
    </div>
  )
}