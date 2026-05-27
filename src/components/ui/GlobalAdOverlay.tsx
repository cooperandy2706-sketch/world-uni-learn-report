import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { GlobalAd } from '../../types/database.types'
import Modal from './Modal'
import { useAuth } from '../../hooks/useAuth'

export default function GlobalAdOverlay() {
  const { user } = useAuth()
  const [activeAd, setActiveAd] = useState<GlobalAd | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    checkActiveAd()
  }, [user])

  async function checkActiveAd() {
    try {
      const now = new Date().toISOString()
      
      const { data, error } = await supabase
        .from('global_ads')
        .select('*')
        .eq('is_active', true)
        .lte('active_from', now)
        .gte('active_until', now)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('Error fetching global ad:', error)
        return
      }

      if (data) {
        const adId = data.id
        const viewed = localStorage.getItem(`wula_ad_viewed_${adId}`)
        if (!viewed) {
          setActiveAd(data as GlobalAd)
          setOpen(true)
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  function handleClose() {
    if (activeAd) {
      localStorage.setItem(`wula_ad_viewed_${activeAd.id}`, 'true')
    }
    setOpen(false)
  }

  if (!open || !activeAd) return null

  return (
    <Modal 
      open={open} 
      onClose={handleClose} 
      title={activeAd.title}
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ borderRadius: 12, overflow: 'hidden', background: 'rgba(0,0,0,0.02)' }}>
          {activeAd.media_type === 'image' ? (
            <img 
              src={activeAd.media_url} 
              alt={activeAd.title} 
              style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: '60vh' }} 
            />
          ) : (
            <video 
              src={activeAd.media_url} 
              controls
              autoPlay
              muted
              playsInline
              style={{ width: '100%', display: 'block', maxHeight: '60vh' }} 
            />
          )}
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 12 }}>
          {activeAd.target_url && (
             <a 
               href={activeAd.target_url} 
               target="_blank" 
               rel="noreferrer"
               onClick={handleClose}
               style={{
                 flex: 1, minWidth: '120px', textAlign: 'center', justifyContent: 'center',
                 padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                 background: '#7c3aed', color: '#fff', textDecoration: 'none',
                 display: 'inline-flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(124,58,237,0.2)'
               }}
             >
               Learn More
             </a>
          )}
          <button 
            onClick={handleClose}
            style={{
              flex: activeAd.target_url ? 1 : 'none', minWidth: '120px',
              padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700,
              background: 'transparent', color: 'var(--text-main)', border: '1.5px solid var(--border-color)',
              cursor: 'pointer'
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </Modal>
  )
}
