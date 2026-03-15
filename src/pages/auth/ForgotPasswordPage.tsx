// src/pages/auth/ForgotPasswordPage.tsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { authService } from '../../services/auth.service'
import { ROUTES } from '../../constants/routes'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
})
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setTimeout(() => setMounted(true), 60) }, [])

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setServerError('')
    const { error } = await authService.resetPassword(data.email)
    if (error) {
      setServerError('Something went wrong. Please try again.')
    } else {
      setSent(true)
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
          padding: 12px 14px 12px 40px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #fff;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .auth-input::placeholder { color: rgba(255,255,255,0.3); }
        .auth-input:focus {
          border-color: rgba(245,158,11,0.6);
          background: rgba(255,255,255,0.09);
          box-shadow: 0 0 0 3px rgba(245,158,11,0.1);
        }
        .auth-input.error-field { border-color: rgba(239,68,68,0.5); }
        .auth-input:-webkit-autofill,
        .auth-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px rgba(15,76,129,0.9) inset;
          -webkit-text-fill-color: #fff;
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
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(245,158,11,0.45);
        }
        .submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(15,23,42,0.3);
          border-top-color: #0f172a;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block; vertical-align: middle; margin-right: 8px;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .card-anim { animation: slideUp 0.6s cubic-bezier(.4,0,.2,1) forwards; }
        @keyframes checkPop {
          0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
          70%  { transform: scale(1.15) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .check-anim { animation: checkPop 0.5s cubic-bezier(.4,0,.2,1) 0.1s both; }
      `}</style>

      <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.4s ease' }}>
        <div className="card-anim" style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          padding: '36px 36px 32px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
        }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'linear-gradient(135deg, #0f4c81, #1a6bb5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, margin: '0 auto 14px',
              boxShadow: '0 8px 24px rgba(15,76,129,0.4)',
            }}>📘</div>
            <h1 style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: 20, fontWeight: 700, color: '#fff',
            }}>Reset Password</h1>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 24 }} />

          {/* Success state */}
          {sent ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div className="check-anim" style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(34,197,94,0.15)',
                border: '2px solid rgba(34,197,94,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, margin: '0 auto 20px',
              }}>✅</div>
              <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 10 }}>
                Check your email
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 6 }}>
                We sent a password reset link to
              </p>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#fbbf24', marginBottom: 24 }}>
                {getValues('email')}
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, marginBottom: 28 }}>
                Click the link in the email to set a new password. The link expires in 24 hours. Check your spam folder if you don't see it.
              </p>
              <Link to={ROUTES.LOGIN} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '11px 24px', borderRadius: 10,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff', textDecoration: 'none',
                fontSize: 14, fontWeight: 600,
                transition: 'background 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              >← Back to Sign In</Link>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 24 }}>
                Enter the email address linked to your account and we'll send you a reset link.
              </p>

              {serverError && (
                <div style={{
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: 10, padding: '10px 14px',
                  fontSize: 13, color: '#fca5a5', marginBottom: 16,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span>⚠️</span> {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div style={{ marginBottom: 20 }}>
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
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && (
                    <p style={{ fontSize: 12, color: '#fca5a5', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>⚠</span> {errors.email.message}
                    </p>
                  )}
                </div>

                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><span className="spinner" />Sending link...</>
                  ) : (
                    'Send Reset Link →'
                  )}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <Link to={ROUTES.LOGIN} style={{
                  fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                >
                  ← Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}