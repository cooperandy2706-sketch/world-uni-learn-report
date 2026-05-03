// src/components/admin/GradingSetupTab.tsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

const GRADING_TEMPLATES = {
  GES: {
    name: 'GES Standard',
    description: '30% Class Score, 70% Exam Score',
    scale: {
      name: 'Standard GES A-F',
      levels: [
        { label: 'A', min_score: 80, max_score: 100, color_code: '#16a34a' },
        { label: 'B', min_score: 70, max_score: 79.99, color_code: '#2563eb' },
        { label: 'C', min_score: 60, max_score: 69.99, color_code: '#ca8a04' },
        { label: 'D', min_score: 50, max_score: 59.99, color_code: '#d97706' },
        { label: 'E', min_score: 40, max_score: 49.99, color_code: '#ea580c' },
        { label: 'F', min_score: 0, max_score: 39.99, color_code: '#dc2626' },
      ]
    },
    categories: [
      { name: 'Class Score', weight_percentage: 30, max_score: 30 },
      { name: 'Exam Score', weight_percentage: 70, max_score: 70 }
    ]
  },
  BRITISH: {
    name: 'British Curriculum (IGCSE)',
    description: '20% Coursework, 20% Practical, 60% Final Exam',
    scale: {
      name: 'British A*-G',
      levels: [
        { label: 'A*', min_score: 90, max_score: 100, color_code: '#16a34a' },
        { label: 'A', min_score: 80, max_score: 89.99, color_code: '#22c55e' },
        { label: 'B', min_score: 70, max_score: 79.99, color_code: '#3b82f6' },
        { label: 'C', min_score: 60, max_score: 69.99, color_code: '#eab308' },
        { label: 'D', min_score: 50, max_score: 59.99, color_code: '#f59e0b' },
        { label: 'E', min_score: 40, max_score: 49.99, color_code: '#ef4444' },
        { label: 'U', min_score: 0, max_score: 39.99, color_code: '#991b1b' },
      ]
    },
    categories: [
      { name: 'Coursework', weight_percentage: 20, max_score: 100 },
      { name: 'Practical', weight_percentage: 20, max_score: 100 },
      { name: 'Final Exam', weight_percentage: 60, max_score: 100 }
    ]
  },
  PRESCHOOL: {
    name: 'Pre-School (EYFS)',
    description: '100% Observational Assessment',
    scale: {
      name: 'EYFS Milestones',
      levels: [
        { label: 'Exceeding', min_score: 85, max_score: 100, color_code: '#16a34a' },
        { label: 'Expected', min_score: 50, max_score: 84.99, color_code: '#3b82f6' },
        { label: 'Emerging', min_score: 0, max_score: 49.99, color_code: '#f59e0b' },
      ]
    },
    categories: [
      { name: 'Observational Assessment', weight_percentage: 100, max_score: 100 }
    ]
  }
}

export default function GradingSetupTab() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [applying, setApplying] = useState<string | null>(null)

  // Fetch Departments
  const { data: departments, isLoading: loadingDepts } = useQuery({
    queryKey: ['departments', user?.school_id],
    queryFn: async () => {
      const { data, error } = await supabase.from('departments').select('*').eq('school_id', user?.school_id).order('name')
      if (error) throw error
      return data || []
    },
    enabled: !!user?.school_id
  })

  // Fetch current configs
  const { data: configs, isLoading: loadingConfigs } = useQuery({
    queryKey: ['grading_configs', user?.school_id],
    queryFn: async () => {
      // Get categories
      const { data: cats, error: e1 } = await supabase.from('department_grading_categories').select('*').eq('school_id', user?.school_id)
      if (e1) throw e1
      
      // Get scales
      const { data: scales, error: e2 } = await supabase.from('grading_scales').select('*, levels:grading_scale_levels(*)').eq('school_id', user?.school_id)
      if (e2) throw e2

      // Group by department
      const mapped: Record<string, any> = {}
      cats?.forEach(c => {
        if (!mapped[c.department_id]) mapped[c.department_id] = { categories: [], scale: null }
        mapped[c.department_id].categories.push(c)
      })
      scales?.forEach(s => {
        if (!mapped[s.department_id]) mapped[s.department_id] = { categories: [], scale: null }
        mapped[s.department_id].scale = s
      })

      return mapped
    },
    enabled: !!user?.school_id
  })

  const applyTemplate = async (departmentId: string, templateKey: keyof typeof GRADING_TEMPLATES) => {
    if (!user?.school_id) return
    const tpl = GRADING_TEMPLATES[templateKey]
    if (!window.confirm(`Apply ${tpl.name} to this department? This will override its current grading setup.`)) return

    setApplying(departmentId)
    try {
      // 1. Delete existing categories & scales for this department
      await supabase.from('department_grading_categories').delete().eq('department_id', departmentId)
      await supabase.from('grading_scales').delete().eq('department_id', departmentId)

      // 2. Insert new scale
      const { data: scaleData, error: sErr } = await supabase.from('grading_scales').insert({
        school_id: user.school_id,
        department_id: departmentId,
        name: tpl.scale.name
      }).select('id').single()
      if (sErr) throw sErr

      // 3. Insert scale levels
      const levels = tpl.scale.levels.map(l => ({
        scale_id: scaleData.id,
        label: l.label,
        min_score: l.min_score,
        max_score: l.max_score,
        color_code: l.color_code
      }))
      const { error: lErr } = await supabase.from('grading_scale_levels').insert(levels)
      if (lErr) throw lErr

      // 4. Insert categories
      const cats = tpl.categories.map(c => ({
        school_id: user.school_id,
        department_id: departmentId,
        name: c.name,
        weight_percentage: c.weight_percentage,
        max_score: c.max_score
      }))
      const { error: cErr } = await supabase.from('department_grading_categories').insert(cats)
      if (cErr) throw cErr

      toast.success(`${tpl.name} applied successfully`)
      qc.invalidateQueries({ queryKey: ['grading_configs', user.school_id] })
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to apply template')
    } finally {
      setApplying(null)
    }
  }

  if (loadingDepts || loadingConfigs) return <div style={{ padding: 20 }}>Loading...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 14, padding: '16px 20px' }}>
        <h3 style={{ margin: '0 0 8px', color: '#1e3a8a', fontSize: 16 }}>Curriculum Templates</h3>
        <p style={{ margin: 0, fontSize: 13, color: '#1e40af' }}>
          Assign a curriculum template to each department. This dictates exactly what grade columns teachers will see when entering scores for classes in that department.
        </p>
      </div>

      {departments?.map(dept => {
        const config = configs?.[dept.id]
        const hasConfig = !!config?.scale || (config?.categories && config.categories.length > 0)

        return (
          <div key={dept.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: '20px', display: 'flex', gap: 20, flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 18, color: '#111827' }}>{dept.name}</h4>
                {hasConfig ? (
                  <span style={{ display: 'inline-block', marginTop: 4, padding: '2px 8px', background: '#dcfce7', color: '#166534', fontSize: 11, fontWeight: 700, borderRadius: 10 }}>Configured</span>
                ) : (
                  <span style={{ display: 'inline-block', marginTop: 4, padding: '2px 8px', background: '#fee2e2', color: '#991b1b', fontSize: 11, fontWeight: 700, borderRadius: 10 }}>Not Configured</span>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: 8 }}>
                {Object.entries(GRADING_TEMPLATES).map(([key, tpl]) => (
                  <button
                    key={key}
                    onClick={() => applyTemplate(dept.id, key as keyof typeof GRADING_TEMPLATES)}
                    disabled={applying === dept.id}
                    style={{
                      padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      background: '#fff', border: '1px solid #d1d5db', color: '#374151', transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    Apply {tpl.name}
                  </button>
                ))}
              </div>
            </div>

            {hasConfig && (
              <div style={{ display: 'flex', gap: 20, borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
                <div style={{ flex: 1 }}>
                  <h5 style={{ margin: '0 0 10px', fontSize: 12, color: '#6b7280', textTransform: 'uppercase' }}>Score Categories</h5>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {config.categories?.map((c: any) => (
                      <div key={c.id} style={{ background: '#f3f4f6', padding: '6px 12px', borderRadius: 6, fontSize: 13, color: '#374151', fontWeight: 500 }}>
                        {c.name} <span style={{ color: '#6d28d9', fontWeight: 700 }}>({c.weight_percentage}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <h5 style={{ margin: '0 0 10px', fontSize: 12, color: '#6b7280', textTransform: 'uppercase' }}>Grading Scale: {config.scale?.name}</h5>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {config.scale?.levels?.sort((a: any, b: any) => b.min_score - a.min_score).map((l: any) => (
                      <div key={l.id} style={{ background: `${l.color_code}15`, color: l.color_code, border: `1px solid ${l.color_code}40`, padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                        {l.label} ({l.min_score}+)
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
