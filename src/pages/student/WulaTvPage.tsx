import { useStuckLoadingReload } from '../../hooks/useStuckLoadingReload'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Play, CheckCircle2, Tv, RefreshCcw, X } from 'lucide-react'
import toast from 'react-hot-toast'

// ── Static Curated Library ──────────────────────────────────────────────
const STATIC_ROWS = [
  {
    title: '🔴 Live Educational Cams',
    videos: [
      { id: '21X5lGlDOfg', title: 'NASA Live Stream - Earth From Space', channel: 'NASA', duration: 'LIVE' },
      { id: 'O9k06Mmr8jQ', title: 'Live African Wildlife Camera', channel: 'explore.org', duration: 'LIVE' },
      { id: 'F109TZt3nRc', title: 'Monterey Bay Aquarium Sea Otters', channel: 'Monterey Bay Aquarium', duration: 'LIVE' },
      { id: 'mZiX3yK4q7A', title: 'Live ISS Control Room', channel: 'NASA', duration: 'LIVE' },
    ]
  },
  {
    title: '🚀 CrashCourse & SciShow',
    videos: [
      { id: 'Q1zxwNbbN0A', title: 'The Scientific Method', channel: 'CrashCourse', duration: '12:05' },
      { id: 'Xb2fM3l2pAY', title: 'What Is Light?', channel: 'SciShow', duration: '8:30' },
      { id: 'O3NDyEUx5tI', title: 'The French Revolution', channel: 'CrashCourse', duration: '11:45' },
      { id: '7Pq-S557XQU', title: 'The periodic table', channel: 'CrashCourse', duration: '11:21' },
      { id: 'h6FcBg5MAhA', title: 'The Water Cycle', channel: 'SciShow', duration: '6:50' },
    ]
  },
  {
    title: '💡 TED-Ed Animations',
    videos: [
      { id: 's2nEq8Ex8hU', title: 'The infinite hotel paradox', channel: 'TED-Ed', duration: '5:57' },
      { id: 'U3jGOIQcbMc', title: 'The myth of Prometheus', channel: 'TED-Ed', duration: '4:30' },
      { id: 'vCB170p880Q', title: 'How to build a fictional world', channel: 'TED-Ed', duration: '5:26' },
      { id: 'NlWksx97h2U', title: 'The psychology of narcissism', channel: 'TED-Ed', duration: '5:12' },
      { id: '1Tq-I3uXnF0', title: 'How does your memory work?', channel: 'TED-Ed', duration: '5:00' },
    ]
  },
  {
    title: '🔢 Khan Academy Math & Logic',
    videos: [
      { id: 'Zl0B_0A4DUE', title: 'Intro to algebra', channel: 'Khan Academy', duration: '14:24' },
      { id: 'bGyA8xT1Wqg', title: 'Basic Trigonometry', channel: 'Khan Academy', duration: '9:30' },
      { id: 'h78yZ_HkS38', title: 'Understanding Probability', channel: 'Khan Academy', duration: '8:45' },
      { id: '5EwylI6h698', title: 'Intro to statistics', channel: 'Khan Academy', duration: '10:15' },
      { id: 'fjeC1o7xM5Y', title: 'Calculus 1 Introduction', channel: 'Khan Academy', duration: '18:20' },
    ]
  }
]

export default function WulaTvPage() {
  const { user } = useAuth()
  const studentDbId = user?.id // Simplified assumption for querying. Usually joined via users/students.
  
  const [assignments, setAssignments] = useState<any[]>([])
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  useStuckLoadingReload(loading)
  const [playingVideo, setPlayingVideo] = useState<any | null>(null)
  
  // ── Data Fetching ──
  useEffect(() => {
    loadAssignments()
  }, [])

  async function loadAssignments() {
    setLoading(true)
    try {
      // 1. Get student class
      const { data: stu } = await supabase.from('students').select('id, class_id').eq('user_id', user!.id).maybeSingle()
      if (!stu) return

      // 2. Fetch assignments for that class
      const { data: assigns } = await supabase
        .from('video_assignments')
        .select('id, title, youtube_id, due_date, instructions, teacher:teachers(user:users(full_name))')
        .eq('class_id', stu.class_id)
        .order('created_at', { ascending: false })

      setAssignments(assigns || [])

      // 3. Fetch progress
      const { data: prog } = await supabase
        .from('video_progress')
        .select('assignment_id, is_completed')
        .eq('student_id', stu.id)

      const pMap: Record<string, boolean> = {}
      prog?.forEach(p => pMap[p.assignment_id] = p.is_completed)
      setProgressMap(pMap)

    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function markAsWatched(assignmentId: string) {
    try {
      const { data: stu } = await supabase.from('students').select('id').eq('user_id', user!.id).maybeSingle()
      if (!stu) return

      await supabase.from('video_progress').upsert({
        assignment_id: assignmentId,
        student_id: stu.id,
        is_completed: true,
        completed_at: new Date().toISOString()
      }, { onConflict: 'assignment_id,student_id' })

      setProgressMap(prev => ({ ...prev, [assignmentId]: true }))
      toast.success('Marked as completed!')
    } catch (e) {
      toast.error('Failed to update progress')
    }
  }

  // ── Components ──
  function VideoCard({ video, assignmentId, isCompleted }: { video: any, assignmentId?: string, isCompleted?: boolean }) {
    return (
      <div 
        onClick={() => setPlayingVideo({ ...video, assignmentId })}
        style={{
          minWidth: 260, width: 260, background: '#1e1b4b', borderRadius: 8, overflow: 'hidden',
          cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', flexDirection: 'column', flexShrink: 0
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02) translateY(-4px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1) translateY(0)'}
      >
        <div style={{ height: 145, position: 'relative', background: '#000' }}>
          <img 
            src={`https://img.youtube.com/vi/${video.id || video.youtube_id}/mqdefault.jpg`} 
            alt="" 
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} 
          />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Play size={20} color="#000" style={{ marginLeft: 4 }} />
            </div>
          </div>
          {video.duration && (
            <span style={{ position: 'absolute', bottom: 8, right: 8, background: video.duration === 'LIVE' ? '#dc2626' : 'rgba(0,0,0,0.8)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '3px 6px', borderRadius: 6 }}>
              {video.duration}
            </span>
          )}
          {isCompleted && (
            <span style={{ position: 'absolute', top: 8, right: 8, background: '#16a34a', color: '#fff', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={12} /> Watched
            </span>
          )}
        </div>
        <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {video.title}
          </h3>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, fontWeight: 600 }}>
            {video.channel || (video.teacher?.user?.full_name && `Assigned by ${video.teacher.user.full_name}`)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",sans-serif', minHeight: '100vh', background: '#0f172a', color: '#fff', paddingBottom: 100, overflowX: 'hidden' }}>
        
        {/* Hero Section */}
        <div style={{ position: 'relative', paddingTop: 60, paddingBottom: 60, paddingLeft: 24, paddingRight: 24, background: 'linear-gradient(to bottom, rgba(124,58,237,0.15) 0%, #0f172a 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Tv size={28} color="#a78bfa" />
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Nexora TV</h1>
          </div>
          <p style={{ fontSize: 15, color: '#94a3b8', maxWidth: 600, lineHeight: 1.6, margin: 0 }}>
            Your educational streaming hub. Watch curated science, history, and math videos, or tune into live educational cameras from around the world.
          </p>
        </div>

        {/* Dynamic Teacher Assignments Row */}
        {assignments.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ padding: '0 24px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>📚 Class Assignments</h2>
              <span style={{ fontSize: 11, background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: 99, fontWeight: 800 }}>REQUIRED</span>
            </div>
            <div className="hide-scroll" style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: '0 24px 10px' }}>
              {assignments.map(a => (
                <VideoCard 
                  key={a.id} 
                  video={{ ...a, id: a.youtube_id }} 
                  assignmentId={a.id} 
                  isCompleted={progressMap[a.id]} 
                />
              ))}
            </div>
          </div>
        )}

        {/* Static Curated Rows */}
        {STATIC_ROWS.map((row, idx) => (
          <div key={idx} style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 24px 16px' }}>{row.title}</h2>
            <div className="hide-scroll" style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: '0 24px 10px' }}>
              {row.videos.map(v => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Video Player Modal */}
      {playingVideo && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', display: 'flex', flexDirection: 'column' }}
        >
          {/* Top Bar */}
          <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 20 }}>
              {playingVideo.title}
            </h3>
            <button onClick={() => setPlayingVideo(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', width: 36, height: 36, borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
              <X size={20} />
            </button>
          </div>
          
          {/* Video Container */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
             <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube-nocookie.com/embed/${playingVideo.id || playingVideo.youtube_id}?autoplay=1&rel=0&modestbranding=1`}
                title={playingVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ maxHeight: '100vh', maxWidth: '100vw' }}
              />
          </div>

          {/* Bottom Action Bar (For Assignments) */}
          {playingVideo.assignmentId && !progressMap[playingVideo.assignmentId] && (
            <div style={{ padding: '24px', background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 16px' }}>{playingVideo.instructions || 'Watch the video to complete this assignment.'}</p>
              <button 
                onClick={() => {
                  markAsWatched(playingVideo.assignmentId)
                  setTimeout(() => setPlayingVideo(null), 1000)
                }}
                style={{ width: '100%', padding: '14px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
              >
                Mark as Watched
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
