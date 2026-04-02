// src/pages/auth/LoginPage.tsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '../../store/authStore'
import { ROUTES } from '../../constants/routes'
import { Mail, Lock, Eye, EyeOff, Building2, GraduationCap, ArrowRight, AlertCircle, ChevronLeft } from 'lucide-react'

const schema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type FormData = z.infer<typeof schema>

// ── Logo Mark Sync ───────────────────────────
function LogoMark() {
  return (
    <div style={{
      width: 64, height: 64, borderRadius: 18, flexShrink: 0,
      background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
      boxShadow: '0 12px 28px rgba(245,158,11,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', margin: '0 auto 24px'
    }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" opacity="0.95" />
        <path d="M2 17c0 0 3.5 3 10 3s10-3 10-3" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
        <path d="M2 7v10" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
        <path d="M12 12v8" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
      </svg>
    </div>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn, user } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setTimeout(() => setMounted(true), 60) }, [])

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
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e0646 0%, #3b0764 45%, #4c1d95 100%)',
      padding: '24px',
      overflowX: 'hidden',
      fontFamily: '"DM Sans", sans-serif'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        
        .auth-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 14px 44px 14px 14px;
          font-size: 14.5px;
          color: #fff;
          outline: none;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .auth-input::placeholder { color: rgba(255,255,255,0.25); }
        .auth-input:focus {
          border-color: #fbbf24;
          background: rgba(255,255,255,0.08);
          box-shadow: 0 0 0 4px rgba(251,191,36,0.15);
        }
        .auth-input.error-field {
          border-color: rgba(248,113,113,0.5);
          box-shadow: 0 0 0 4px rgba(248,113,113,0.08);
        }

        .submit-btn {
          width: 100%;
          padding: 15px;
          border-radius: 12px;
          border: none;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          background: #fbbf24;
          color: #1e0646;
          box-shadow: 0 10px 24px -6px rgba(251,191,36,0.5);
          transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          background: #f59e0b;
          box-shadow: 0 12px 30px -8px rgba(245,158,11,0.6);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .role-tab {
          flex: 1;
          padding: 11px 14px;
          border-radius: 10px;
          border: none;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          background: transparent;
          color: rgba(255,255,255,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .role-tab.active {
          background: rgba(255,255,255,0.1);
          color: #fff;
          box-shadow: 0 4px 14px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.08);
        }

        @keyframes _l_spin { to { transform: rotate(360deg); } }
        .spinner {
          width: 20px; height: 20px;
          border: 2.5px solid rgba(30,6,70,0.2);
          border-top-color: #1e0646;
          border-radius: 50%;
          animation: _l_spin 0.8s linear infinite;
        }

        @keyframes _l_up { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
        .card-anim {
          animation: _l_up 0.8s cubic-bezier(0.2, 0.8, 0.2, 1.05) forwards;
        }
        
        @keyframes _l_shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .shake { animation: _l_shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>

      <div style={{
        opacity: mounted ? 1 : 0, transition: 'opacity 0.6s ease',
        width: '100%', maxWidth: 440
      }}>
        {/* Card */}
        <div className="card-anim" style={{
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 32,
          padding: '48px 40px',
          boxShadow: '0 40px 100px -20px rgba(0,0,0,0.5)',
          position: 'relative', overflow: 'hidden'
        }}>
          {/* Subtle light effect */}
          <div style={{ position: 'absolute', top: -100, right: -100, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,191,36,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

          {/* Logo Section */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <LogoMark />
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 8 }}>World Uni-Learn</div>
            <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 28, fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>Academy Portal</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 10 }}>Complete credentials to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Email */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Academic ID / Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="name@school.edu"
                  className={`auth-input ${errors.email ? 'error-field' : ''}`}
                  style={{ paddingLeft: 48 }}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <div style={{ fontSize: 12, color: '#fca5a5', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={14} /> {errors.email.message}
                </div>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Secure Key</label>
                <Link to={ROUTES.FORGOT_PASSWORD} style={{ fontSize: 13, color: '#fbbf24', textDecoration: 'none', fontWeight: 600, opacity: 0.8 }}>Forgot?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`auth-input ${errors.password ? 'error-field' : ''}`}
                  style={{ paddingLeft: 48 }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <div style={{ fontSize: 12, color: '#fca5a5', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={14} /> {errors.password.message}
                </div>
              )}
            </div>

            {/* Submit */}
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? (
                <><div className="spinner" /> Authenticating...</>
              ) : (
                <>Sign in to Portal <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          {/* Server error */}
          {serverError && (
            <div className="shake" style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#fca5a5',
              marginTop: 24, display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <AlertCircle size={16} /> {serverError}
            </div>
          )}

          {/* Demo Hint */}
          <div style={{ marginTop: 32, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.06)', opacity: mounted ? 1 : 0, transition: 'all 1s ease 0.6s' }}>
             <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 4 }}>
                   <div style={{ fontSize: 11, fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase' }}>Demo Access</div>
                   <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                      admin@school.edu.gh<br/>
                      <span style={{ color: 'rgba(255,255,255,0.6)' }}>admin123</span>
                   </div>
                </div>
                <div style={{ width: 1, background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                   <button 
                    onClick={() => {
                      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
                      const passInput = document.querySelector('input[type="password"]') as HTMLInputElement;
                      if (emailInput && passInput) {
                        emailInput.value = 'admin@school.edu.gh';
                        passInput.value = 'admin123';
                        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
                        passInput.dispatchEvent(new Event('input', { bubbles: true }));
                      }
                    }}
                    style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', fontSize: 11, fontWeight: 800, padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}
                   >AUTO-FILL DEMO</button>
                </div>
             </div>
          </div>
        </div>

        {/* Back Link */}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }}>
            <ChevronLeft size={16} /> Return to homepage
          </Link>
        </div>
      </div>
    </div>
  )
}