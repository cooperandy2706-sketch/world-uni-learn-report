import React from 'react'
import { motion } from 'framer-motion'

interface Annotation {
  x: string // e.g. '50%'
  y: string // e.g. '25%'
  title: string
  description: string
  delay: number
}

export function AnnotatedScreenshot({ imagePath, annotations }: { imagePath: string, annotations: Annotation[] }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#000' }}>
      <motion.img 
        src={imagePath} 
        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'left top', opacity: 0.5 }}
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ duration: 15, ease: 'linear' }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.3) 40%, rgba(15,23,42,0.7) 100%)', pointerEvents: 'none' }} />
      
      {annotations.map((ann, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: ann.delay, type: 'spring', damping: 15 }}
          style={{ position: 'absolute', left: ann.x, top: ann.y, display: 'flex', alignItems: 'flex-start', gap: 16, transform: 'translate(-24px, -24px)', zIndex: 10 }}
        >
          {/* Pulsing Circle */}
          <div style={{ position: 'relative', width: 48, height: 48, flexShrink: 0 }}>
            <motion.div 
              animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }} 
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} 
              style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid #f43f5e', background: 'rgba(244, 63, 94, 0.2)' }} 
            />
            <div style={{ position: 'absolute', inset: '14px', borderRadius: '50%', background: '#f43f5e', boxShadow: '0 0 20px rgba(244, 63, 94, 0.8)' }} />
          </div>

          {/* Explanation Tooltip */}
          <motion.div 
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: ann.delay + 0.3, type: 'spring' }}
            style={{ 
              background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(12px)', 
              padding: '16px 20px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.15)',
              width: 240, color: 'white', boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 6, color: '#fb7185', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{ann.title}</div>
            <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5, fontWeight: 500 }}>{ann.description}</div>
          </motion.div>
        </motion.div>
      ))}
    </div>
  )
}

export function HeroMockup() {
  return <AnnotatedScreenshot 
    imagePath="/pages/Screenshot 2026-05-04 at 1.30.01 AM.png" 
    annotations={[
      { x: '18%', y: '45%', title: 'School Overview', description: 'Monitor your total student and teaching staff population at a glance.', delay: 0.5 },
      { x: '75%', y: '50%', title: 'Reports Tracking', description: 'Real-time progress on term report card generation.', delay: 1.2 }
    ]} 
  />
}

export function DashboardMockup() {
  return <AnnotatedScreenshot 
    imagePath="/pages/Screenshot 2026-05-04 at 1.30.01 AM.png" 
    annotations={[
      { x: '45%', y: '10%', title: 'Quick Navigation', description: 'Instantly access Academics, People, Operations, and Insights.', delay: 0.5 },
      { x: '88%', y: '25%', title: 'Action Buttons', description: 'Quickly make school-wide announcements or view reports.', delay: 1.2 }
    ]} 
  />
}

export function AcademicsMockup() {
  return <AnnotatedScreenshot 
    imagePath="/pages/Screenshot 2026-05-04 at 1.34.12 AM.png" 
    annotations={[
      { x: '65%', y: '20%', title: 'Bulk Import', description: 'Download formatting templates and import students via Excel.', delay: 0.5 },
      { x: '10%', y: '45%', title: 'Directory Metrics', description: 'Track gender distribution and class sizes automatically.', delay: 1.2 },
      { x: '85%', y: '80%', title: 'Student Actions', description: 'View profiles, manage passwords, or perform edits.', delay: 1.8 }
    ]} 
  />
}

export function BursarMockup() {
  return <AnnotatedScreenshot 
    imagePath="/pages/Screenshot 2026-05-04 at 1.34.46 AM.png" 
    annotations={[
      { x: '15%', y: '40%', title: 'School Details', description: 'Configure your school name, motto, and contact information.', delay: 0.5 },
      { x: '88%', y: '22%', title: 'Custom Branding', description: 'Upload your school logo to personalize report cards and portal headers.', delay: 1.2 }
    ]} 
  />
}

export function MessagingMockup() {
  return <AnnotatedScreenshot 
    imagePath="/pages/Screenshot 2026-05-04 at 1.35.41 AM.png" 
    annotations={[
      { x: '92%', y: '20%', title: 'Staff Onboarding', description: 'Add new teaching or administrative staff seamlessly.', delay: 0.5 },
      { x: '45%', y: '85%', title: 'Teacher Cards', description: 'Manage assigned subjects, portal access, and passwords.', delay: 1.2 }
    ]} 
  />
}

export function FinalMockup() {
  return <AnnotatedScreenshot 
    imagePath="/pages/Screenshot 2026-05-04 at 1.35.01 AM.png" 
    annotations={[
      { x: '92%', y: '20%', title: 'Calendar Setup', description: 'Easily set up your academic calendar by adding new years and terms.', delay: 0.5 },
      { x: '15%', y: '55%', title: 'Active Term', description: 'Your active academic timeline is clearly displayed here.', delay: 1.2 }
    ]} 
  />
}
