// src/pages/teacher/SyllabusPage.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm } from '../../hooks/useSettings'

export default function TeacherSyllabusPage() {
    const { user } = useAuth()
    const { data: term } = useCurrentTerm()
    const [syllabus, setSyllabus] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterClass, setFilterClass] = useState('')
    const [classes, setClasses] = useState<any[]>([])
    const [viewingFile, setViewingFile] = useState<{ url: string, name: string } | null>(null)

    useEffect(() => { if (user && term) load() }, [user, term])

    async function load() {
        setLoading(true)
        // Get teacher's assigned class IDs
        const { data: t } = await supabase.from('teachers').select('id').eq('user_id', user!.id).single()
        if (!t) { setLoading(false); return }

        const { data: assignments } = await supabase
            .from('teacher_assignments').select('class_id').eq('teacher_id', t.id)
            .eq('term_id', (term as any).id)

        const classIds = [...new Set((assignments ?? []).map((a: any) => a.class_id))]
        if (!classIds.length) { setLoading(false); return }

        const [{ data: syl }, { data: cls }] = await Promise.all([
            supabase.from('syllabus')
                .select('*, class:classes(id,name), subject:subjects(id,name), uploader:users(full_name)')
                .or(`class_id.in.(${classIds.join(',')}),class_id.is.null`)
                .order('created_at', { ascending: false }),
            supabase.from('classes').select('id,name').in('id', classIds).order('name'),
        ])
        setSyllabus(syl ?? [])
        setClasses(cls ?? [])
        setLoading(false)
    }

    const filtered = syllabus.filter(s => {
        const matchSearch = !search ||
            s.title?.toLowerCase().includes(search.toLowerCase()) ||
            (s.subject && s.subject.name?.toLowerCase().includes(search.toLowerCase()))
        const matchClass = !filterClass || s.class_id === filterClass || s.class_id === null
        return matchSearch && matchClass
    })

    // Group by class
    const generalItems = filtered.filter(s => s.class_id === null)
    const grouped = classes.map(c => ({
        class: c,
        items: filtered.filter(s => s.class_id === c.id),
    })).filter(g => g.items.length > 0)

    const groupedGroups: Array<{ class: { id: string | null, name: string }, items: any[] }> = []
    if (generalItems.length > 0) {
        groupedGroups.push({
            class: { id: null, name: '🌍 School-Wide / All Classes' },
            items: generalItems
        })
    }
    grouped.forEach(g => groupedGroups.push(g))

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _syl_fi{from{opacity:0}to{opacity:1}}
        @keyframes _syl_fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .syl-card:hover{box-shadow:0 6px 20px rgba(109,40,217,.1)!important;transform:translateY(-1px)}
        .syl-card{transition:all .2s}
      `}</style>
            <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', animation: '_syl_fi .4s ease' }}>

                <div style={{ marginBottom: 22 }}>
                    <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Syllabus</h1>
                    <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>Teaching materials uploaded by admin for your classes</p>
                </div>

                {/* Filters */}
                <div style={{ background: '#fff', borderRadius: 14, padding: '12px 16px', border: '1.5px solid #f0eefe', marginBottom: 18, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: '1 1 200px' }}>
                        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>🔍</span>
                        <input placeholder="Search syllabus…" value={search} onChange={e => setSearch(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', background: '#faf5ff', fontFamily: '"DM Sans",sans-serif', boxSizing: 'border-box' as any }} />
                    </div>
                    <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', fontFamily: '"DM Sans",sans-serif', cursor: 'pointer', background: '#faf5ff' }}>
                        <option value="">All Classes</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 'auto' }}>{filtered.length} file{filtered.length !== 1 ? 's' : ''}</span>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_syl_fi .8s linear infinite' }} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
                        <div style={{ fontSize: 52, marginBottom: 12 }}>📚</div>
                        <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
                            {syllabus.length === 0 ? 'No syllabus uploaded yet' : 'No results found'}
                        </h3>
                        <p style={{ fontSize: 13, color: '#9ca3af' }}>
                            {syllabus.length === 0 ? 'Ask admin to upload syllabus files for your classes.' : 'Try a different search or filter.'}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {groupedGroups.map(({ class: cls, items }) => (
                            <div key={cls.id || 'general'}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: cls.id ? '#7c3aed' : '#d97706' }} />
                                    <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 16, fontWeight: 700, color: cls.id ? '#1e1b4b' : '#92400e', margin: 0 }}>
                                        {cls.name}
                                    </h3>
                                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{items.length} file{items.length !== 1 ? 's' : ''}</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
                                    {items.map((s, i) => {
                                        const isImage = s.file_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                                        const isPDF = s.file_name?.match(/\.pdf$/i)
                                        const isWord = s.file_name?.match(/\.(doc|docx)$/i)
                                        const fileIcon = isImage ? '🖼️' : isPDF ? '📑' : isWord ? '📝' : '📄'

                                        return (
                                            <div key={s.id} className="syl-card"
                                                style={{ background: '#fff', borderRadius: 14, padding: '16px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(109,40,217,.06)', animation: `_syl_fu .3s ease ${i * .05}s both` }}>
                                                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                                                        {fileIcon}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</h4>
                                                        <div style={{ fontSize: 11, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.file_name}</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                                                    {s.subject ? (
                                                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: '#eff6ff', color: '#0369a1' }}>{s.subject.name}</span>
                                                    ) : (
                                                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 99, background: 'linear-gradient(135deg,#fae8ff,#f5d0fe)', color: '#a21caf', border: '1px solid #f0abfc' }}>✨ Combined Subject Scheme</span>
                                                    )}
                                                    <span style={{ fontSize: 11, color: '#9ca3af' }}>by {s.uploader?.full_name ?? 'Admin'}</span>
                                                </div>
                                                <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 12 }}>
                                                    Uploaded {new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button onClick={() => setViewingFile({ url: s.file_url, name: s.title })}
                                                        style={{ flex: 1, padding: '7px', borderRadius: 8, border: '1.5px solid #ddd6fe', background: '#f5f3ff', color: '#6d28d9', fontSize: 12, fontWeight: 600, textAlign: 'center', cursor: 'pointer', display: 'block' }}>
                                                        👁️ View
                                                    </button>
                                                    <a href={s.file_url} download={s.file_name}
                                                        style={{ flex: 1, padding: '7px', borderRadius: 8, border: '1.5px solid #ddd6fe', background: '#f5f3ff', color: '#6d28d9', fontSize: 12, fontWeight: 600, textAlign: 'center', textDecoration: 'none', display: 'block' }}>
                                                        ⬇️ Download
                                                    </a>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Document Viewer Modal */}
            {viewingFile && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', flexDirection: 'column', zIndex: 9999, backdropFilter: 'blur(4px)', animation: '_syl_fi .2s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: '#111827', color: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,.3)' }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontFamily: '"DM Sans",sans-serif', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{viewingFile.name}</h3>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <a href={viewingFile.url} download target="_blank" rel="noreferrer" style={{ color: '#d1d5db', textDecoration: 'none', fontSize: 14, fontWeight: 600, padding: '6px 12px', borderRadius: 6, background: 'rgba(255,255,255,.1)' }}>
                                ⬇️ Download
                            </a>
                            <button onClick={() => setViewingFile(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', lineHeight: 1, padding: 0 }}>&times;</button>
                        </div>
                    </div>
                    <div style={{ flex: 1, background: '#e5e7eb', overflow: 'hidden' }}>
                        <iframe src={viewingFile.url} style={{ width: '100%', height: '100%', border: 'none' }} title={viewingFile.name} />
                    </div>
                </div>
            )}
        </>
    )
}