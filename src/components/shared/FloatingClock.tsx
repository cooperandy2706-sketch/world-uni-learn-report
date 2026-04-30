import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { Clock, GripVertical } from 'lucide-react'
import { useLocation } from 'react-router-dom'

export default function FloatingClock() {
  const location = useLocation()
  const isCalendarPage = location.pathname.includes('/calendar')
  const [time, setTime] = useState(new Date())

  // Load position from localStorage or default
  const [pos, setPos] = useState(() => {
    const saved = localStorage.getItem('clock_pos')
    // Default to top right
    return saved ? JSON.parse(saved) : { x: window.innerWidth - 200, y: 100 }
  })

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (isCalendarPage) return null

  return (
    <motion.div
      drag
      dragMomentum={false}
      // Use absolute screen coordinates for persistence
      onDragEnd={(_, info) => {
        const newPos = { x: info.point.x - 90, y: info.point.y - 25 } // Center offset adjustment
        setPos(newPos)
        localStorage.setItem('clock_pos', JSON.stringify(newPos))
      }}
      initial={false}
      animate={{ 
        left: pos.x, 
        top: pos.y 
      }}
      style={{
        position: 'fixed',
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(12px)',
        borderRadius: '14px',
        padding: '8px 12px',
        color: '#fff',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: 'grab',
        touchAction: 'none', // Critical for mobile/drag
        userSelect: 'none',
      }}
      whileHover={{ scale: 1.02, background: 'rgba(15, 23, 42, 1)' }}
      whileTap={{ cursor: 'grabbing', scale: 0.98 }}
    >
      <div style={{ color: '#6366f1', display: 'flex', alignItems: 'center' }}>
        <GripVertical size={16} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 70 }}>
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.02em', fontFamily: '"JetBrains Mono", monospace', lineHeight: 1 }}>
          {format(time, 'HH:mm:ss')}
        </div>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', marginTop: 2, textTransform: 'uppercase' }}>
          {format(time, 'EEE, MMM d')}
        </div>
      </div>
      <Clock size={16} style={{ color: '#6366f1' }} />
    </motion.div>
  )
}
