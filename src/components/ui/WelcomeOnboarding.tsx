import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HeroMockup, DashboardMockup, AcademicsMockup, BursarMockup, MessagingMockup, FinalMockup } from './OnboardingMockups'

interface OnboardingStep {
  title: string
  description: string
  image: string
  accent: string
  label: string
}

const steps: OnboardingStep[] = [
  {
    title: "The Future of School Management",
    description: "Welcome to World Uni Learn Report. A premium ecosystem designed to simplify academic administration and empower educators.",
    image: "/assets/advertisement/hero.png",
    accent: "#6366f1",
    label: "INTRODUCTION"
  },
  {
    title: "Insightful Admin Dashboard",
    description: "Get a bird's-eye view of your school. Monitor student population, staff activity, and school-wide performance in real-time.",
    image: "/assets/advertisement/hero.png",
    accent: "#8b5cf6",
    label: "CONTROL CENTER"
  },
  {
    title: "Automated Academic Reporting",
    description: "Stop manual grading. Our engine calculates scores and generates beautiful report cards for every student automatically.",
    image: "/assets/advertisement/reports.png",
    accent: "#f59e0b",
    label: "ACADEMICS"
  },
  {
    title: "Financial Transparency",
    description: "Track fees, manage bill sheets, and monitor debtors effortlessly. Complete financial oversight for your institution.",
    image: "/assets/advertisement/hero.png",
    accent: "#10b981",
    label: "BURSAR"
  },
  {
    title: "Connected Community",
    description: "Bridge the gap with instant messaging. Keep parents informed and teachers connected through our secure messaging portal.",
    image: "/assets/advertisement/messaging.png",
    accent: "#06b6d4",
    label: "MESSAGING"
  },
  {
    title: "Ready to Transform?",
    description: "Your digital journey starts now. Explore your new workspace and discover how we can build a better school together.",
    image: "/assets/advertisement/hero.png",
    accent: "#ec4899",
    label: "GET STARTED"
  }
]

export default function WelcomeOnboarding({ userName, onComplete }: { userName: string; onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isMinimized, setIsMinimized] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isMinimized || isPaused) return

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (currentStep < steps.length - 1) {
            setCurrentStep(c => c + 1)
            return 0
          } else {
            return 100
          }
        }
        return prev + 0.4
      })
    }, 50)
    return () => clearInterval(timer)
  }, [currentStep, isMinimized, isPaused])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
      setProgress(0)
    } else {
      onComplete()
    }
  }

  const step = steps[currentStep]

  if (!step) return null

  return (
    <>
      <AnimatePresence>
        {!isMinimized ? (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(5, 5, 8, 0.9)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            color: 'white'
          }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 100, x: -400 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                width: '90%',
                maxWidth: '1100px',
                height: '650px',
                background: '#0f172a',
                borderRadius: '40px',
                overflow: 'hidden',
                display: 'flex',
                boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                position: 'relative'
              }}
            >
              {/* Left Side: Visual Walkthrough */}
              <div style={{ flex: 1.4, position: 'relative', overflow: 'hidden', background: '#000' }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 1.2 }}
                    style={{ width: '100%', height: '100%' }}
                  >
                    {currentStep === 0 && <HeroMockup />}
                    {currentStep === 1 && <DashboardMockup />}
                    {currentStep === 2 && <AcademicsMockup />}
                    {currentStep === 3 && <BursarMockup />}
                    {currentStep === 4 && <MessagingMockup />}
                    {currentStep === 5 && <FinalMockup />}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: `linear-gradient(to right, #0f172a 0%, transparent 40%)`,
                      pointerEvents: 'none'
                    }} />
                  </motion.div>
                </AnimatePresence>
                
                <div style={{ 
                  position: 'absolute', 
                  top: '40px', 
                  left: '40px', 
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '8px 16px',
                  borderRadius: '100px',
                  fontSize: '12px',
                  fontWeight: 800,
                  letterSpacing: '2px',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  LIVE WALKTHROUGH
                </div>
              </div>

              {/* Right Side: Content */}
              <div style={{ flex: 1, padding: '60px', display: 'flex', flexDirection: 'column', background: '#0f172a' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                   <button 
                    onClick={() => setIsMinimized(true)}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '10px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: 700
                    }}
                  >
                    Minimize
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.6 }}
                  >
                    <span style={{ color: step?.accent || '#6366f1', fontWeight: 800, fontSize: '14px', letterSpacing: '4px', display: 'block', marginBottom: '16px' }}>
                      {step?.label}
                    </span>
                    <h1 style={{ fontSize: '42px', fontWeight: 800, marginBottom: '24px', lineHeight: 1.1, letterSpacing: '-0.04em' }}>
                      {currentStep === 0 ? `Welcome, ${userName}` : step?.title}
                    </h1>
                    <p style={{ fontSize: '18px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '48px' }}>
                      {step?.description}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <div style={{ marginTop: 'auto' }}>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
                    <button 
                      onClick={handleNext}
                      style={{
                        flex: 1,
                        padding: '18px',
                        borderRadius: '18px',
                        background: 'white',
                        color: '#0f172a',
                        fontSize: '16px',
                        fontWeight: 800,
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {currentStep === steps.length - 1 ? "Finish" : "Next Step"}
                    </button>
                    <button 
                      onClick={() => setIsPaused(!isPaused)}
                      style={{
                        padding: '18px',
                        borderRadius: '18px',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {isPaused ? '▶' : '⏸'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {steps.map((_, i) => (
                      <div key={i} style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                        {i === currentStep && (
                          <motion.div animate={{ width: `${progress}%` }} style={{ height: '100%', background: step?.accent || '#6366f1' }} />
                        )}
                        {i < currentStep && <div style={{ width: '100%', height: '100%', background: steps[i]?.accent || '#6366f1' }} />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            whileHover={{ scale: 1.1 }}
            onClick={() => setIsMinimized(false)}
            style={{
              position: 'fixed',
              bottom: '40px',
              left: '40px',
              zIndex: 10001,
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              color: 'white',
              border: 'none',
              padding: '16px 24px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              boxShadow: '0 20px 40px rgba(99, 102, 241, 0.4)',
              fontWeight: 800,
              fontSize: '14px',
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}
          >
            <span style={{ fontSize: '20px' }}>🎓</span>
            Welcome Tour
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px'
            }}>
              {currentStep + 1}
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )
}
