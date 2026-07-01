// src/pages/bursar/ReceiptTemplateSelector.tsx
import { useState } from 'react'
import { RECEIPT_TEMPLATES, ACCENT_COLORS, getThemeFromColorId } from './receiptTemplates'
import type { ReceiptData } from './receiptTemplates'
import { Check, Palette, Eye, Printer, ChevronRight } from 'lucide-react'

const PAPER_TABS = [
  { id: 'a4', label: 'A4', icon: '📄', desc: '210 × 297mm' },
  { id: 'a5', label: 'A5', icon: '📋', desc: '148 × 210mm' },
  { id: 'thermal', label: 'Thermal', icon: '🖨️', desc: '80mm roll' },
] as const

type PaperFilter = 'a4' | 'a5' | 'thermal'

interface Props {
  selectedTemplateId: string
  selectedColorId: string
  onSelectTemplate: (id: string) => void
  onSelectColor: (id: string) => void
  sampleData?: Partial<ReceiptData>
}

const SAMPLE: ReceiptData = {
  schoolName: 'Springfield Academy',
  schoolAddress: '12 Education Lane, Accra',
  schoolPhone: '+233 24 000 0000',
  schoolEmail: 'info@springfield.edu.gh',
  logoHtml: `<svg width="52" height="52" viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
    <circle cx="26" cy="26" r="24" fill="none" stroke="#7c3aed" stroke-width="1.5"/>
    <polygon points="26,8 30,20 43,20 33,27 37,40 26,33 15,40 19,27 9,20 22,20"
      fill="none" stroke="#7c3aed" stroke-width="1.3" stroke-linejoin="round"/>
    <circle cx="26" cy="26" r="4" fill="#7c3aed" opacity="0.75"/>
  </svg>`,
  studentName: 'Akosua Mensah',
  studentId: 'STU-2024-0042',
  className: 'JHS 3',
  guardianName: 'Kwame Mensah',
  receiptNo: 'A3F2B1C9',
  payDate: '30 Jun 2026',
  payTime: '10:35 AM',
  payMethod: 'momo',
  reference: 'MOM-GH-78423',
  term: 'Term 1',
  academicYear: '2025/2026',
  currency: 'GHS',
  amountPaid: 1850,
  arrearsPaid: 350,
  openingArrears: 350,
  termCharges: 2400,
  netTermCharges: 2400,
  totalBill: 2750,
  totalPaidToDate: 1850,
  finalBalance: 900,
  pct: 0,
  feeLines: [
    { name: 'Tuition Fee', amount: 1800 },
    { name: 'ICT Levy', amount: 200 },
    { name: 'Library Fee', amount: 150 },
    { name: 'Sports Fee', amount: 250 },
  ],
}

export default function ReceiptTemplateSelector({
  selectedTemplateId,
  selectedColorId,
  onSelectTemplate,
  onSelectColor,
  sampleData,
}: Props) {
  const [paperFilter, setPaperFilter] = useState<PaperFilter>('a4')
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null)

  const data = { ...SAMPLE, ...sampleData }
  const theme = getThemeFromColorId(selectedColorId)
  const color = ACCENT_COLORS.find(c => c.id === selectedColorId) || ACCENT_COLORS[0]

  const filtered = RECEIPT_TEMPLATES.filter(t => t.paperSize === paperFilter)

  // Generate live preview HTML
  function getPreviewHTML(templateId: string): string {
    const tpl = RECEIPT_TEMPLATES.find(t => t.id === templateId)
    if (!tpl) return ''
    // Inject the current accent color into thumbnails for preview
    const previewData = {
      ...data,
      logoHtml: data.logoHtml.replace(/#7c3aed/g, theme.accentColor),
    }
    return tpl.generateHTML(previewData, theme, 'single')
  }

  function handlePrintTemplate(templateId: string) {
    const html = getPreviewHTML(templateId)
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) return
    win.document.write(html)
    win.document.close()
  }

  const previewTpl = previewTemplateId ? RECEIPT_TEMPLATES.find(t => t.id === previewTemplateId) : null
  const previewHTML = previewTemplateId ? getPreviewHTML(previewTemplateId) : ''

  // Color-inject thumbnail SVG
  function coloredThumb(tpl: typeof RECEIPT_TEMPLATES[number]) {
    const c = color.hex
    return tpl.thumbnail.replace(/#7c3aed/g, c)
  }

  return (
    <div style={{ display: 'flex', gap: 24, height: '100%', flex: 1, minHeight: 0 }}>
      {/* ── LEFT PANEL: Template List ── */}
      <div style={{ flex: '0 0 380px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', paddingRight: 8, paddingBottom: 24, height: '100%' }}>
        {/* Paper Size Tabs */}
        <div style={{ display: 'flex', gap: 8, background: '#f8fafc', borderRadius: 12, padding: 4 }}>
          {PAPER_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setPaperFilter(tab.id)}
              style={{
                flex: 1, padding: '10px 6px', borderRadius: 8, border: 'none',
                background: paperFilter === tab.id ? '#fff' : 'transparent',
                color: paperFilter === tab.id ? '#5b21b6' : '#64748b',
                fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif',
                boxShadow: paperFilter === tab.id ? '0 1px 6px rgba(0,0,0,.1)' : 'none',
                transition: 'all .18s',
              }}
            >
              <div>{tab.icon} {tab.label}</div>
              <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.6, marginTop: 1 }}>{tab.desc}</div>
            </button>
          ))}
        </div>

        {/* Color Palette */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1.5px solid #f0eefe', padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Palette size={15} color="#7c3aed" />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Accent Color</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{color.name}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ACCENT_COLORS.map(c => (
              <button
                key={c.id}
                title={c.name}
                onClick={() => onSelectColor(c.id)}
                style={{
                  width: 28, height: 28, borderRadius: '50%', background: c.hex, border: 'none', cursor: 'pointer',
                  outline: selectedColorId === c.id ? `3px solid ${c.hex}` : '3px solid transparent',
                  outlineOffset: 2, transition: 'all .15s', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,.2)',
                }}
              >
                {selectedColorId === c.id && <Check size={14} color="#fff" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>

        {/* Template Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {filtered.map(tpl => {
            const isSelected = selectedTemplateId === tpl.id
            const isPreviewing = previewTemplateId === tpl.id
            return (
              <div
                key={tpl.id}
                style={{
                  borderRadius: 12, border: `2px solid ${isSelected ? color.hex : '#e2e8f0'}`,
                  background: isSelected ? color.light : 'var(--bg-card)',
                  cursor: 'pointer', transition: 'all .18s', overflow: 'hidden',
                  boxShadow: isSelected ? `0 4px 16px ${color.hex}30` : '0 1px 4px rgba(0,0,0,.06)',
                }}
                onClick={() => onSelectTemplate(tpl.id)}
              >
                {/* Thumbnail */}
                <div
                  style={{
                    background: '#f8fafc', padding: 10, display: 'flex', justifyContent: 'center', alignItems: 'center',
                    borderBottom: '1px solid #e2e8f0', position: 'relative', height: paperFilter === 'a5' && tpl.id === 'a5-landscape-split' ? 80 : 110,
                  }}
                  dangerouslySetInnerHTML={{ __html: `<div style="max-height:100%;max-width:100%;display:flex;align-items:center;justify-content:center">${coloredThumb(tpl)}</div>` }}
                />

                {/* Card footer */}
                <div style={{ padding: '8px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: isSelected ? color.hex : 'var(--text-main)', fontFamily: '"DM Sans",sans-serif' }}>
                      {tpl.name}
                    </span>
                    {isSelected && (
                      <span style={{ width: 18, height: 18, borderRadius: '50%', background: color.hex, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={11} color="#fff" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 9.5, color: '#94a3b8', lineHeight: 1.4 }}>{tpl.description}</p>
                  {/* Preview button */}
                  <button
                    onClick={e => { e.stopPropagation(); setPreviewTemplateId(isPreviewing ? null : tpl.id) }}
                    style={{
                      marginTop: 7, width: '100%', padding: '5px 0', borderRadius: 6, border: `1px solid ${isPreviewing ? color.hex : '#e2e8f0'}`,
                      background: isPreviewing ? color.light : 'transparent',
                      color: isPreviewing ? color.hex : '#64748b', fontSize: 10.5, fontWeight: 700,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    }}
                  >
                    <Eye size={11} /> Preview
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Selected info */}
        {selectedTemplateId && (
          <div style={{ background: 'linear-gradient(135deg,' + color.hex + '15,' + color.light + ')', border: '1.5px solid ' + color.hex + '40', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: color.hex, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Printer size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-main)' }}>
                {RECEIPT_TEMPLATES.find(t => t.id === selectedTemplateId)?.name}
              </div>
              <div style={{ fontSize: 10, color: '#64748b' }}>Active template · {color.name} accent</div>
            </div>
            <ChevronRight size={14} color="#94a3b8" style={{ marginLeft: 'auto' }} />
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL: Live Preview ── */}
      <div style={{ flex: 1, position: 'sticky', top: 0 }}>
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1.5px solid #e2e8f0', overflow: 'hidden', minHeight: 560 }}>
          {previewTpl ? (
            <>
              {/* Preview header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg,#f8fafc,#f5f3ff)' }}>
                <Eye size={16} color="#7c3aed" />
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-main)', flex: 1 }}>
                  Preview: <span style={{ color: color.hex }}>{previewTpl.name}</span>
                </span>
                <button
                  onClick={() => handlePrintTemplate(previewTpl.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: 'none', background: color.hex, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  <Printer size={12} /> Print Sample
                </button>
                <button
                  onClick={() => setPreviewTemplateId(null)}
                  style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                >
                  ✕
                </button>
              </div>
              {/* Iframe Preview */}
              <div style={{ background: '#e2e8f0', padding: 12, display: 'flex', justifyContent: 'center', minHeight: 500, overflow: 'auto' }}>
                <iframe
                  key={previewTemplateId + selectedColorId}
                  srcDoc={previewHTML}
                  style={{
                    width: previewTpl.paperSize === 'thermal' ? 320 : previewTpl.id.includes('landscape') ? 600 : 500,
                    height: previewTpl.paperSize === 'thermal' ? 640 : previewTpl.id.includes('landscape') ? 420 : 620,
                    border: 'none', background: '#fff', borderRadius: 6,
                    boxShadow: '0 4px 24px rgba(0,0,0,.2)',
                  }}
                  title="Receipt Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 560, gap: 14, color: '#94a3b8', padding: 24 }}>
              {/* Grid of tiny template thumbs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, opacity: 0.3, width: '100%', maxWidth: 320 }}>
                {RECEIPT_TEMPLATES.slice(0, 9).map(t => (
                  <div key={t.id} style={{ borderRadius: 6, overflow: 'hidden', background: '#f1f5f9' }}
                    dangerouslySetInnerHTML={{ __html: `<div style="transform:scale(.8);transform-origin:top center;width:100%;overflow:hidden">${coloredThumb(t)}</div>` }} />
                ))}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>Live Preview</div>
                <div style={{ fontSize: 12, color: '#94a3b8', maxWidth: 260 }}>
                  Click <strong>Preview</strong> on any template to see a full-size sample receipt using your school's colors.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
