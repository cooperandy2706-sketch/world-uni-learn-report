// src/components/ui/DailyInsightNotification.tsx
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getDailyInsight } from '../../lib/dailyInsights'
import { X, ChevronDown, ChevronUp, Quote, BookOpen, Bell } from 'lucide-react'

export const DailyInsightNotification: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [insight, setInsight] = useState(getDailyInsight())

  useEffect(() => {
    // Show after a short delay on mount
    const timer = setTimeout(() => {
      const today = new Date().toDateString()
      const lastShown = localStorage.getItem('daily_insight_shown')
      
      if (lastShown !== today) {
        setIsVisible(true)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const handleClose = (isSnooze: boolean = false) => {
    setIsVisible(false)
    // Always dismiss for the day as requested
    localStorage.setItem('daily_insight_shown', new Date().toDateString())
  }

  const toggleExpand = () => setIsExpanded(!isExpanded)

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: 350, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 350, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          style={{
            position: 'fixed',
            top: '80px', // Below the title bar/nav
            right: '20px',
            width: isExpanded ? '350px' : '280px',
            zIndex: 1000,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            border: '1px solid rgba(124, 58, 237, 0.2)',
            padding: '16px',
            cursor: 'pointer',
            overflow: 'hidden'
          }}
          onClick={(e) => {
             if (!isExpanded) toggleExpand()
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isExpanded ? '12px' : '0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #9333ea)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Bell size={16} />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e1b4b' }}>Daily Insight</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleExpand() }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
              >
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleClose(true) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {!isExpanded && (
            <div style={{ marginTop: '8px' }}>
              <p style={{ fontSize: '13px', color: '#4b5563', margin: 0, fontWeight: 500 }}>
                "{insight.quote.text.slice(0, 40)}..."
              </p>
              <span style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 600 }}>Click to read more</span>
            </div>
          )}

          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              {/* Quote Section */}
              <div style={{ marginBottom: '20px', background: 'rgba(124, 58, 237, 0.05)', padding: '12px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#7c3aed' }}>
                  <Quote size={14} />
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quote of the Day</span>
                </div>
                <p style={{ fontSize: '14px', color: '#1e1b4b', fontWeight: 600, fontStyle: 'italic', margin: '0 0 4px', lineHeight: 1.4 }}>
                  "{insight.quote.text}"
                </p>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, textAlign: 'right' }}>— {insight.quote.author}</p>
              </div>

              {/* Word Section */}
              <div style={{ background: 'rgba(8, 145, 178, 0.05)', padding: '12px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#0891b2' }}>
                  <BookOpen size={14} />
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Word of the Day</span>
                </div>
                <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#1e1b4b', margin: '0 0 4px' }}>{insight.word.term}</h4>
                <p style={{ fontSize: '13px', color: '#374151', margin: '0 0 8px', lineHeight: 1.4 }}>
                  <span style={{ fontWeight: 700, color: '#0891b2' }}>Def:</span> {insight.word.definition}
                </p>
                <p style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic', margin: 0 }}>
                  <span style={{ fontWeight: 700 }}>Example:</span> "{insight.word.example}"
                </p>
              </div>

              <button 
                onClick={(e) => { e.stopPropagation(); handleClose(false) }}
                style={{ 
                  width: '100%', 
                  marginTop: '16px', 
                  padding: '10px', 
                  borderRadius: '10px', 
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', 
                  color: '#fff', 
                  border: 'none', 
                  fontSize: '13px', 
                  fontWeight: 700, 
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(109, 40, 217, 0.2)'
                }}
              >
                Got it!
              </button>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
