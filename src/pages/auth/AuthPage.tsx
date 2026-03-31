// src/pages/auth/AuthPage.tsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { ROUTES } from '../../constants/routes'

type Mode = 'login' | 'register'
type Role = 'teacher' | 'student'

// ── Shared Underline Field Component ──
function UnderlineField({ label, error, ...props }: any) {
  const [focused, setFocused] = useState(false)
  const isPassword = props.type === 'password'
  
  return (
    <div style={{ marginBottom: 20, position: 'relative' }}>
      <label style={{
        display: 'block',
        fontSize: 13,
        fontWeight: 600,
        color: focused ? '#fbbf24' : '#fff',
        marginBottom: 4,
        transition: 'color 0.3s ease',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          {...props}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            padding: '8px 0',
            fontSize: 15,
            fontFamily: 'inherit',
            background: 'transparent',
            color: '#fff',
            outline: 'none',
            border: 'none',
            borderBottom: `2px solid ${error ? '#ef4444' : focused ? '#f59e0b' : 'rgba(255,255,255,0.4)'}`,
            transition: 'border-color 0.3s ease',
          }}
        />
      </div>
      {error && (
        <p style={{ fontSize: 12, color: '#fca5a5', marginTop: 6, fontWeight: 500 }}>
          {error}
        </p>
      )}
    </div>
  )
}

const TESTIMONIALS = [
  { name: "Sarah J.", role: "Student", text: "Finally everything is in one place! I can check my daily progress effortlessly." },
  { name: "Mr. Thompson", role: "Teacher", text: "Makes tracking my lessons and students so much more efficient. Highly recommended." },
  { name: "Emily R.", role: "Student", text: "The new learning modules are incredibly easy to navigate and engaging!" },
  { name: "Dr. Adebayo", role: "Administrator", text: "Managing staff and students across the ecosystem has never been this seamless." },
  { name: "Jessica M.", role: "Parent", text: "I love being able to see exactly what my child is learning on the platform." },
]

// ── Main Page Component ──
export default function AuthPage() {
  const navigate = useNavigate()
  const { signIn } = useAuthStore()
  
  const [mode, setMode] = useState<Mode>('login')
  const [role, setRole] = useState<Role>('teacher')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [isAnimating, setIsAnimating] = useState(false)
  const [showSupport, setShowSupport] = useState(false)

  const [form, setForm] = useState({
    school_code: '', full_name: '', email: '', password: '', confirm_password: '',
    phone: '', staff_id: '', qualification: '', student_id: '', class_name: '',
  })

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  const switchMode = (newMode: Mode) => {
    if (mode === newMode) return
    setIsAnimating(true)
    setError('')
    setSuccess('')
    setTimeout(() => {
      setMode(newMode)
      setIsAnimating(false)
    }, 300)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error: err } = await signIn(form.email, form.password)
    setLoading(false)
    if (err) { setError('Invalid email or password.'); return }
    const u = useAuthStore.getState().user
    navigate(u?.role === 'admin' ? ROUTES.ADMIN_DASHBOARD : ROUTES.TEACHER_DASHBOARD, { replace: true })
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.school_code) { setError('Required'); return }
    if (!form.full_name || !form.email || !form.password) { setError('Please complete fields'); return }
    if (form.password.length < 6) { setError('Min 6 characters'); return }
    if (form.password !== form.confirm_password) { setError('Passwords do not match'); return }

    setLoading(true)
    try {
      const { data: schoolCheck, error: verifyErr } = await supabase.from('schools').select('id').eq('id', form.school_code).single()
      if (verifyErr || !schoolCheck) { throw new Error('Invalid school code.') }

      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.full_name } },
      })
      if (authErr) throw authErr
      if (!authData.user) throw new Error('Signup failed.')

      const uid = authData.user.id
      const selectedSchoolId = form.school_code

      await supabase.from('users').insert({
        id: uid, school_id: selectedSchoolId,
        full_name: form.full_name, email: form.email,
        role: role, phone: form.phone || null, is_active: false,
      })

      if (role === 'teacher') {
        await supabase.from('teachers').insert({
          user_id: uid, school_id: selectedSchoolId,
          staff_id: form.staff_id || null, qualification: form.qualification || null,
        })
      }

      setSuccess('Account pending admin approval.')
      setForm({ school_code:'', full_name:'', email:'', password:'', confirm_password:'', phone:'', staff_id:'', qualification:'', student_id:'', class_name:'' })

      const adminRes = await supabase.from('users').select('id').eq('role','admin').eq('school_id', selectedSchoolId).single()
      if (adminRes.data) {
        await supabase.from('notifications').insert({
          school_id: selectedSchoolId,
          user_id: adminRes.data.id,
          title: 'New ' + role + ' registration',
          body: form.full_name + ' needs approval.',
          type: 'info',
        })
      }
    } catch(e:any) {
      setError(e.message ?? 'Registration failed.')
    }
    setLoading(false)
  }
  
  async function handleOAuth(provider: 'google' | 'facebook') {
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider })
      if (error) throw error
    } catch(e:any) {
      setError(e.message ?? `Failed to sign in with ${provider}.`)
    }
  }

  const isLogin = mode === 'login'

  // Beautiful background of lively students with a dark purple overlay
  // Using the local kids.JPG image from the public folder
  const bgImage = "/kids.JPG"

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Plus Jakarta Sans', sans-serif;
          background-image: 
            linear-gradient(rgba(30, 6, 70, 0.75), rgba(91, 33, 182, 0.65)),
            url('${bgImage}');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          color: #ffffff;
          position: relative;
          padding: 100px 24px 40px; /* Increased top padding to clear nav */
          overflow: hidden;
        }

        /* Testimonials Engine */
        .testimonials-sidebar {
          display: none;
        }
        @media(min-width: 900px) {
          .testimonials-sidebar {
            display: block; position: absolute; left: 8vw; top: 0; bottom: 0; width: 320px;
            pointer-events: none; overflow: hidden;
          }
        }
        
        @keyframes sponsorFloat {
          0% { transform: translateY(120px); opacity: 0; }
          10% { transform: translateY(0); opacity: 1; }
          40% { transform: translateY(-30vh); opacity: 1; }
          50% { transform: translateY(-40vh); opacity: 0; }
          100% { transform: translateY(-40vh); opacity: 0; }
        }

        .t-card {
          background: rgba(30, 6, 70, 0.4);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          padding: 18px;
          border-radius: 16px;
          width: 100%;
          position: absolute;
          bottom: 15vh; /* Starts near bottom */
          opacity: 0; /* Hidden by default till keyframe kicks in */
        }

        /* Glassmorphism Card exactly like the reference */
        .glass-card {
          width: 100%;
          max-width: 440px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 24px;
          padding: 48px 40px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          transition: height 0.3s ease;
          position: relative;
          z-index: 10;
          margin-top: -30px; /* Shifted slightly up per request */
        }
        
        @media(min-width: 900px) {
          .glass-card { margin-left: 36vw; } /* Shifted further to the right per request */
        }

        /* Top Nav Simulation (like the image) */
        .top-nav {
          position: absolute;
          top: 0; left: 0; right: 0;
          padding: 24px 48px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          z-index: 20;
        }

        .top-nav-links {
          display: none;
          gap: 32px;
          font-weight: 500;
          font-size: 14px;
          color: rgba(255,255,255,0.9);
        }
        @media(min-width: 900px) {
          .top-nav-links { display: flex; }
        }

        /* Elegant Fade-in Animations */
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(16px); filter: blur(4px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes fadeOutSlideDown {
          from { opacity: 1; transform: translateY(0); filter: blur(0); }
          to { opacity: 0; transform: translateY(12px); filter: blur(4px); }
        }
        .view-enter { animation: fadeInSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .view-exit { animation: fadeOutSlideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        /* Solid Amber Button */
        .submit-btn {
          width: 100%;
          padding: 14px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 16px;
          border: none;
          color: #fff;
          background: #f59e0b;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);
          margin-top: 16px;
        }
        .submit-btn:hover:not(:disabled) { 
          transform: translateY(-2px); 
          box-shadow: 0 8px 24px rgba(245, 158, 11, 0.4); 
          background: #fbbf24;
        }
        .submit-btn:active:not(:disabled) { transform: translateY(1px); }
        .submit-btn:disabled { background: rgba(255, 255, 255, 0.2); color: rgba(255, 255, 255, 0.5); cursor: not-allowed; box-shadow: none; }

        /* Role Pill Selector */
        .role-wrapper {
          display: flex; gap: 8px; margin-bottom: 24px;
        }
        .role-pill {
          flex: 1; padding: 10px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.05); text-align: center; cursor: pointer; transition: all 0.2s ease;
          font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.7);
        }
        .role-pill.active { border-color: #f59e0b; background: rgba(245, 158, 11, 0.2); color: #fff; }

        .form-link {
          color: #f59e0b; text-decoration: none; font-weight: 600; transition: opacity 0.2s;
        }
        .form-link:hover { opacity: 0.8; }
        
        .loader {
          width: 18px; height: 18px; border: 2.5px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: inline-block;
          vertical-align: middle;
          margin-right: 8px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      
      {/* Top Navbar overlaying background */}
      <div className="top-nav">
        <Link to="/">
           <img src="/icon-512.png" alt="Logo" style={{ width: 42, height: 42, borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)' }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
        </Link>
        <div className="top-nav-links">
           <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
           <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Portal</Link>
           <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>About Us</Link>
           <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Contact</Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setShowSupport(true)} style={{ fontSize: 14, fontWeight: 600, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(255,255,255,0.1)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'all 0.2s ease' }} onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,0.2)'} onMouseOut={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}>
            <span>👤</span> Support
          </button>
        </div>
      </div>

      <div className="auth-container">
        
        {/* Animated Testimonials (only on desktop where there is space) */}
        <div className="testimonials-sidebar">
          {TESTIMONIALS.map((t, i) => (
             <div key={i} className="t-card" style={{
               // Total cycle length is 25s, so each comment gets a 5s stagger
               animation: `sponsorFloat 25s linear ${i * 5}s infinite`
             }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                 <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#1e0646' }}>
                   {t.name.charAt(0)}
                 </div>
                 <div>
                   <div style={{ fontSize: 14, fontWeight: 700 }}>{t.name}</div>
                   <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>{t.role}</div>
                 </div>
               </div>
               <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>"{t.text}"</p>
             </div>
          ))}
        </div>


        <div className="glass-card">
          
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8, color: '#fff' }}>
              {isLogin ? 'Sign In' : 'Sign Up'}
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
              {isLogin ? (
                <>Not a member? <button onClick={() => switchMode('register')} className="form-link" style={{ background:'none', border:'none', cursor:'pointer', fontSize: 13, fontFamily: 'inherit' }}>Sign up now</button></>
              ) : (
                <>Already a member? <button onClick={() => switchMode('login')} className="form-link" style={{ background:'none', border:'none', cursor:'pointer', fontSize: 13, fontFamily: 'inherit' }}>Sign in directly</button></>
              )}
            </p>
          </div>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', color: '#fca5a5', textAlign: 'center' }}>
              {error}
            </div>
          )}
          
          {success && (
            <div style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', color: '#86efac', textAlign: 'center' }}>
              {success}
            </div>
          )}

          <div className={isAnimating ? 'view-exit' : 'view-enter'}>
            {isLogin ? (
              <form onSubmit={handleLogin}>
                <UnderlineField label="Email address" type="email" value={form.email} onChange={(e:any)=>update('email',e.target.value)} required />
                <UnderlineField label="Password" type="password" value={form.password} onChange={(e:any)=>update('password',e.target.value)} required />
                
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24, marginTop: -8 }}>
                  <a href="#" className="form-link" style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>
                    Forgot your password?
                  </a>
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? <><span className="loader"/> Authenticating</> : 'Sign In'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                
                <div className="role-wrapper">
                  <div className={'role-pill ' + (role === 'teacher' ? 'active' : '')} onClick={() => setRole('teacher')}>
                    Teacher / Staff
                  </div>
                  <div className={'role-pill ' + (role === 'student' ? 'active' : '')} onClick={() => setRole('student')}>
                    Student
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <UnderlineField label="School Code" type="text" value={form.school_code} onChange={(e:any)=>update('school_code',e.target.value)} required />
                  <UnderlineField label="Full Name" type="text" value={form.full_name} onChange={(e:any)=>update('full_name',e.target.value)} required />
                </div>
                
                <UnderlineField label="Email Address" type="email" value={form.email} onChange={(e:any)=>update('email',e.target.value)} required />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <UnderlineField label="Password" type="password" value={form.password} onChange={(e:any)=>update('password',e.target.value)} required />
                  <UnderlineField label="Confirm" type="password" value={form.confirm_password} onChange={(e:any)=>update('confirm_password',e.target.value)} required />
                </div>

                {role === 'teacher' && (
                  <div className="view-enter" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <UnderlineField label="Staff ID (Optional)" type="text" value={form.staff_id} onChange={(e:any)=>update('staff_id',e.target.value)} />
                    <UnderlineField label="Qualification" type="text" value={form.qualification} onChange={(e:any)=>update('qualification',e.target.value)} />
                  </div>
                )}

                <button type="submit" className="submit-btn" disabled={loading} style={{ marginTop: 24 }}>
                  {loading ? <><span className="loader"/> Processing</> : 'Sign Up'}
                </button>
              </form>
            )}

            {/* Social Logins divider layout just like the image reference */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '32px 0 24px' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.2)' }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>or sign complete with</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.2)' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
              <button onClick={() => handleOAuth('google')} title="Continue with Google" style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,0.2)'} onMouseOut={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20C44 22.659 43.862 21.35 43.611 20.083z"/>
                  <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-0.792 2.237-2.231 4.166-4.087 5.571c0.001-0.001 0.002-0.001 0.003-0.002l6.19 5.238C36.971 39.205 44 34 44 24C44 22.659 43.862 21.35 43.611 20.083z"/>
                </svg>
              </button>
              <button onClick={() => handleOAuth('facebook')} title="Continue with Facebook" style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,0.2)'} onMouseOut={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="22px" height="22px">
                  <path fill="#039be5" d="M24 5A19 19 0 1 0 24 43A19 19 0 1 0 24 5Z"/>
                  <path fill="#fff" d="M26.572,29.036h4.917l0.772-4.995h-5.69v-2.73c0-2.075,0.678-3.915,2.619-3.915h3.119v-4.359c-0.548-0.074-1.707-0.236-3.897-0.236c-4.573,0-7.254,2.415-7.254,7.917v3.323h-4.701v4.995h4.701v13.729C22.089,42.905,23.032,43,24,43c0.875,0,1.729-0.08,2.572-0.194V29.036z"/>
                </svg>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Support Pop-up Modal */}
      {showSupport && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          animation: 'fadeIn 0.2s ease forwards'
        }}>
          <div style={{
            background: 'rgba(30, 6, 70, 0.8)', border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 24, padding: 40, width: '100%', maxWidth: 400,
            boxShadow: '0 25px 50px rgba(0,0,0,0.6)', color: '#fff', position: 'relative'
          }}>
            <button onClick={() => setShowSupport(false)} style={{
              position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', 
              border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%',
              cursor: 'pointer', fontSize: 16
            }}>✕</button>

            <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 16 }}>💁‍♂️</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, textAlign: 'center', marginBottom: 8 }}>Support Center</h2>
            <p style={{ textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 32, lineHeight: 1.5 }}>
              Need help accessing your account? Reach out to our directly support lead below.
            </p>

            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Contact Person</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Cooper Andy Mawnuyo</div>
              </div>
              
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>📞</span>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 2 }}>Phone Support</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#f59e0b' }}>053 799 6934</div>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>✉️</span>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 2 }}>Email Address</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>andtcooper1721@gmail.com</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  )
}