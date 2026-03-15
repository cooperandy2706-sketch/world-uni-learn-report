// src/pages/auth/LoginPage.tsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '../../store/authStore'
import { ROUTES } from '../../constants/routes'

const schema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn, user } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setTimeout(() => setMounted(true), 60) }, [])

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? ROUTES.ADMIN_DASHBOARD : ROUTES.TEACHER_DASHBOARD, { replace: true })
    }
  }, [user, navigate])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setServerError('')
    const { error } = await signIn(data.email, data.password)
    if (error) {
      setServerError('Invalid email or password. Please try again.')
    } else {
      const currentUser = useAuthStore.getState().user
      navigate(
        currentUser?.role === 'admin' ? ROUTES.ADMIN_DASHBOARD : ROUTES.TEACHER_DASHBOARD,
        { replace: true }
      )
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .auth-input {
          width: 100%;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          padding: 12px 44px 12px 14px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #fff;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          -webkit-autofill: none;
        }
        .auth-input::placeholder { color: rgba(255,255,255,0.3); }
        .auth-input:focus {
          border-color: rgba(245,158,11,0.6);
          background: rgba(255,255,255,0.09);
          box-shadow: 0 0 0 3px rgba(245,158,11,0.1);
        }
        .auth-input.error-field {
          border-color: rgba(239,68,68,0.6);
          box-shadow: 0 0 0 3px rgba(239,68,68,0.08);
        }
        .auth-input:-webkit-autofill,
        .auth-input:-webkit-autofill:hover,
        .auth-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px rgba(15,76,129,0.9) inset;
          -webkit-text-fill-color: #fff;
          caret-color: #fff;
        }

        .submit-btn {
          width: 100%;
          padding: 13px;
          border-radius: 10px;
          border: none;
          font-size: 15px;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          background: linear-gradient(135deg, #f59e0b, #fbbf24);
          color: #0f172a;
          box-shadow: 0 4px 16px rgba(245,158,11,0.35);
          transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
          letter-spacing: 0.01em;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(245,158,11,0.45);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .role-tab {
          flex: 1;
          padding: 9px 12px;
          border-radius: 8px;
          border: none;
          font-size: 13px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          background: transparent;
          color: rgba(255,255,255,0.45);
        }
        .role-tab.active {
          background: rgba(255,255,255,0.12);
          color: #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(15,23,42,0.3);
          border-top-color: #0f172a;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
          vertical-align: middle;
          margin-right: 8px;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .card-anim {
          animation: slideUp 0.6s cubic-bezier(.4,0,.2,1) forwards;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-6px); }
          40%       { transform: translateX(6px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }
        .shake { animation: shake 0.4s ease; }
      `}</style>

      <div style={{
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}>
        {/* Card */}
        <div className="card-anim" style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          padding: '36px 36px 32px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2)',
        }}>

          {/* Logo & title */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'linear-gradient(135deg, #0f4c81, #1a6bb5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, margin: '0 auto 14px',
              boxShadow: '0 8px 24px rgba(15,76,129,0.4)',
            }}>📘</div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 4 }}>World</div>
            <h1 style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.2,
            }}>Uni-Learn Report</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>
              Sign in to your account
            </p>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 24 }} />

          {/* Role tabs */}
          <div style={{
            display: 'flex', gap: 4, background: 'rgba(0,0,0,0.2)',
            borderRadius: 10, padding: 4, marginBottom: 24,
          }}>
            {(['Admin', 'Teacher'] as const).map((role) => (
              <button key={role} type="button" className="role-tab active"
                style={{ opacity: 1 }}
              >
                {role === 'Admin' ? '🏫' : '👨‍🏫'} {role}
              </button>
            ))}
          </div>

          {/* Server error */}
          {serverError && (
            <div className="shake" style={{
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 10, padding: '10px 14px',
              fontSize: 13, color: '#fca5a5', marginBottom: 18,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>⚠️</span> {serverError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 600,
                color: 'rgba(255,255,255,0.6)', marginBottom: 6,
                letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 15, pointerEvents: 'none', opacity: 0.5,
                }}>✉️</span>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@school.edu.gh"
                  className={`auth-input ${errors.email ? 'error-field' : ''}`}
                  style={{ paddingLeft: 40 }}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p style={{ fontSize: 12, color: '#fca5a5', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>⚠</span> {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{
                  fontSize: 12, fontWeight: 600,
                  color: 'rgba(255,255,255,0.6)',
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                }}>Password</label>
                <Link to={ROUTES.FORGOT_PASSWORD} style={{
                  fontSize: 12, color: 'rgba(245,158,11,0.8)', textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#f59e0b')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,158,11,0.8)')}
                >Forgot password?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 15, pointerEvents: 'none', opacity: 0.5,
                }}>🔒</span>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`auth-input ${errors.password ? 'error-field' : ''}`}
                  style={{ paddingLeft: 40 }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 16, opacity: 0.5, padding: 2, lineHeight: 1,
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && (
                <p style={{ fontSize: 12, color: '#fca5a5', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>⚠</span> {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? (
                <><span className="spinner" />Signing in...</>
              ) : (
                'Sign In →'
              )}
            </button>
          </form>

          {/* Footer note */}
          <p style={{
            textAlign: 'center', marginTop: 20, fontSize: 12,
            color: 'rgba(255,255,255,0.3)', lineHeight: 1.6,
          }}>
            Access is managed by your school administrator.<br />
            Contact your admin if you need an account.
          </p>
        </div>

        {/* Back to home */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/" style={{
            fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none',
            transition: 'color 0.2s', display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
          >
            ← Back to home
          </Link>
        </div>

        {/* Demo credentials hint */}
        <div style={{
          marginTop: 16, background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 12, padding: '12px 16px',
        }}>
          <p style={{ fontSize: 12, color: 'rgba(245,158,11,0.8)', fontWeight: 600, marginBottom: 4 }}>
            🔑 Demo Credentials
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
            Admin: <span style={{ color: 'rgba(255,255,255,0.7)' }}>admin@school.edu.gh</span><br />
            Password: <span style={{ color: 'rgba(255,255,255,0.7)' }}>admin123</span>
          </p>
        </div>
      </div>
    </>
  )
}