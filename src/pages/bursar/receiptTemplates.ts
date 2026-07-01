// src/pages/bursar/receiptTemplates.ts
// 12 receipt templates — each produces a complete print-ready HTML document

export interface ReceiptData {
  // School
  schoolName: string
  schoolAddress: string
  schoolPhone: string
  schoolEmail: string
  logoHtml: string
  // Student
  studentName: string
  studentId: string
  className: string
  guardianName: string
  // Payment
  receiptNo: string
  payDate: string
  payTime: string
  payMethod: string
  reference: string
  term: string
  academicYear: string
  // Financials
  currency: string
  amountPaid: number
  arrearsPaid: number
  openingArrears: number
  termCharges: number
  netTermCharges: number
  totalBill: number
  totalPaidToDate: number
  finalBalance: number
  pct: number
  feeLines: Array<{ name: string; amount: number }>
}

export interface TemplateTheme {
  accentColor: string   // primary hex
  accentLight: string   // tinted background
  accentDark: string    // darker shade for header
}

export interface ReceiptTemplate {
  id: string
  name: string
  description: string
  paperSize: 'a4' | 'a5' | 'thermal'
  thumbnail: string  // inline SVG string
  generateHTML: (data: ReceiptData, theme: TemplateTheme, copies: 'single' | 'duplicate') => string
}

// ── Shared utilities ─────────────────────────────────────────────────────────
const FMT = (n: number, cur: string) =>
  new Intl.NumberFormat('en-GH', { style: 'currency', currency: cur, minimumFractionDigits: 2 }).format(n)

const GOOGLE_FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700&family=Space+Grotesk:wght@400;600;700&family=IBM+Plex+Mono&display=swap" rel="stylesheet">`

// ── ACCENT COLORS ─────────────────────────────────────────────────────────────
export const ACCENT_COLORS: Array<{ id: string; name: string; hex: string; light: string; dark: string }> = [
  { id: 'violet',   name: 'Violet',   hex: '#7c3aed', light: '#f5f3ff', dark: '#5b21b6' },
  { id: 'navy',     name: 'Navy',     hex: '#1e3a8a', light: '#eff6ff', dark: '#1e3a8a' },
  { id: 'emerald',  name: 'Emerald',  hex: '#059669', light: '#ecfdf5', dark: '#047857' },
  { id: 'crimson',  name: 'Crimson',  hex: '#dc2626', light: '#fef2f2', dark: '#b91c1c' },
  { id: 'amber',    name: 'Amber',    hex: '#d97706', light: '#fffbeb', dark: '#b45309' },
  { id: 'teal',     name: 'Teal',     hex: '#0d9488', light: '#f0fdfa', dark: '#0f766e' },
  { id: 'rose',     name: 'Rose',     hex: '#e11d48', light: '#fff1f2', dark: '#be123c' },
  { id: 'indigo',   name: 'Indigo',   hex: '#4338ca', light: '#eef2ff', dark: '#3730a3' },
  { id: 'slate',    name: 'Slate',    hex: '#334155', light: '#f8fafc', dark: '#1e293b' },
  { id: 'forest',   name: 'Forest',   hex: '#166534', light: '#f0fdf4', dark: '#14532d' },
]

export function getThemeFromColorId(id: string): TemplateTheme {
  const c = ACCENT_COLORS.find(a => a.id === id) || ACCENT_COLORS[0]
  return { accentColor: c.hex, accentLight: c.light, accentDark: c.dark }
}

// ── THUMBNAIL GENERATORS ──────────────────────────────────────────────────────
function thumbA4Classic(c: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 170" fill="none">
    <rect width="120" height="170" rx="4" fill="#fff" stroke="#e2e8f0" stroke-width="1"/>
    <rect x="0" y="0" width="120" height="28" rx="4" fill="${c}"/>
    <circle cx="16" cy="14" r="7" fill="rgba(255,255,255,.25)"/>
    <rect x="28" y="8" width="50" height="4" rx="2" fill="rgba(255,255,255,.8)"/>
    <rect x="28" y="15" width="35" height="3" rx="1.5" fill="rgba(255,255,255,.5)"/>
    <rect x="8" y="36" width="60" height="3" rx="1.5" fill="#cbd5e1"/>
    <rect x="8" y="42" width="45" height="2.5" rx="1.25" fill="#e2e8f0"/>
    <rect x="8" y="48" width="52" height="2.5" rx="1.25" fill="#e2e8f0"/>
    <rect x="8" y="58" width="104" height="0.5" fill="#e2e8f0"/>
    <rect x="8" y="64" width="60" height="2" rx="1" fill="#f1f5f9"/>
    <rect x="8" y="69" width="60" height="2" rx="1" fill="#f1f5f9"/>
    <rect x="8" y="74" width="60" height="2" rx="1" fill="#f1f5f9"/>
    <rect x="8" y="79" width="104" height="0.5" fill="#e2e8f0"/>
    <rect x="8" y="88" width="104" height="16" rx="3" fill="${c}" opacity=".12"/>
    <rect x="14" y="93" width="40" height="3" rx="1.5" fill="${c}"/>
    <rect x="75" y="91" width="30" height="8" rx="2" fill="${c}"/>
    <rect x="8" y="112" width="40" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="8" y="117" width="30" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="8" y="155" width="104" height="0.5" fill="#e2e8f0"/>
    <rect x="8" y="159" width="50" height="2" rx="1" fill="#e2e8f0"/>
  </svg>`
}

function thumbA4Modern(c: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 170" fill="none">
    <rect width="120" height="170" rx="4" fill="#fff" stroke="#e2e8f0" stroke-width="1"/>
    <rect x="0" y="0" width="120" height="50" rx="4" fill="url(#grad1)"/>
    <defs><linearGradient id="grad1" x1="0" y1="0" x2="120" y2="50" gradientUnits="userSpaceOnUse"><stop stop-color="${c}"/><stop offset="1" stop-color="${c}88"/></linearGradient></defs>
    <circle cx="15" cy="20" r="9" fill="rgba(255,255,255,.2)"/>
    <rect x="30" y="14" width="55" height="5" rx="2.5" fill="rgba(255,255,255,.9)"/>
    <rect x="30" y="22" width="38" height="3" rx="1.5" fill="rgba(255,255,255,.6)"/>
    <rect x="8" y="58" width="104" height="22" rx="4" fill="${c}" opacity=".08" stroke="${c}" stroke-width="0.5" stroke-opacity=".3"/>
    <rect x="14" y="64" width="35" height="4" rx="2" fill="${c}"/>
    <rect x="14" y="71" width="25" height="2.5" rx="1.25" fill="#94a3b8"/>
    <rect x="8" y="88" width="50" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="8" y="93" width="40" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="8" y="98" width="55" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="8" y="108" width="104" height="0.5" fill="#e2e8f0"/>
    <rect x="8" y="113" width="40" height="2" rx="1" fill="#f1f5f9"/>
    <rect x="8" y="118" width="40" height="2" rx="1" fill="#f1f5f9"/>
    <rect x="8" y="128" width="104" height="12" rx="3" fill="${c}"/>
    <rect x="14" y="132" width="30" height="3" rx="1.5" fill="rgba(255,255,255,.8)"/>
    <rect x="75" y="131" width="25" height="5" rx="2" fill="rgba(255,255,255,.9)"/>
  </svg>`
}

function thumbA4Minimal(c: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 170" fill="none">
    <rect width="120" height="170" rx="4" fill="#fff" stroke="#e2e8f0" stroke-width="1"/>
    <rect x="0" y="0" width="4" height="170" fill="${c}"/>
    <rect x="10" y="12" width="50" height="6" rx="3" fill="#0f172a"/>
    <rect x="10" y="21" width="35" height="2.5" rx="1.25" fill="#94a3b8"/>
    <rect x="10" y="38" width="100" height="0.5" fill="#e2e8f0"/>
    <rect x="10" y="44" width="60" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="10" y="49" width="45" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="10" y="54" width="52" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="10" y="65" width="100" height="0.5" fill="#e2e8f0"/>
    <rect x="10" y="71" width="55" height="2" rx="1" fill="#f1f5f9"/>
    <rect x="10" y="76" width="50" height="2" rx="1" fill="#f1f5f9"/>
    <rect x="10" y="81" width="55" height="2" rx="1" fill="#f1f5f9"/>
    <rect x="10" y="91" width="100" height="0.5" fill="#0f172a"/>
    <rect x="10" y="96" width="40" height="4" rx="2" fill="#0f172a"/>
    <rect x="75" y="94" width="35" height="7" rx="2" fill="${c}"/>
    <rect x="10" y="110" width="60" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="10" y="115" width="45" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="10" y="160" width="40" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="72" y="160" width="38" height="2" rx="1" fill="#e2e8f0"/>
  </svg>`
}

function thumbA4Corporate(c: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 170" fill="none">
    <rect width="120" height="170" rx="4" fill="#fff" stroke="#e2e8f0" stroke-width="1"/>
    <rect x="0" y="0" width="120" height="36" fill="${c}"/>
    <rect x="0" y="36" width="120" height="6" fill="${c}CC"/>
    <circle cx="18" cy="18" r="9" fill="rgba(255,255,255,.2)"/>
    <rect x="32" y="11" width="55" height="5" rx="2.5" fill="rgba(255,255,255,.9)"/>
    <rect x="32" y="20" width="38" height="3" rx="1.5" fill="rgba(255,255,255,.55)"/>
    <rect x="8" y="54" width="40" height="3" rx="1.5" fill="#334155"/>
    <rect x="8" y="60" width="55" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="8" y="65" width="45" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="8" y="70" width="50" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="8" y="80" width="104" height="0.5" fill="#e2e8f0"/>
    <rect x="8" y="86" width="104" height="7" fill="${c}18"/>
    <rect x="12" y="88" width="30" height="2" rx="1" fill="${c}"/>
    <rect x="90" y="87" width="18" height="4" rx="1" fill="${c}"/>
    <rect x="8" y="95" width="104" height="6" fill="#f8fafc"/>
    <rect x="12" y="97" width="30" height="2" rx="1" fill="#94a3b8"/>
    <rect x="8" y="103" width="104" height="6" fill="#fff"/>
    <rect x="12" y="105" width="30" height="2" rx="1" fill="#94a3b8"/>
    <rect x="8" y="111" width="104" height="6" fill="#f8fafc"/>
    <rect x="12" y="113" width="30" height="2" rx="1" fill="#94a3b8"/>
    <rect x="8" y="125" width="104" height="10" rx="2" fill="${c}"/>
    <rect x="14" y="129" width="30" height="3" rx="1.5" fill="rgba(255,255,255,.8)"/>
    <rect x="78" y="128" width="28" height="5" rx="1.5" fill="rgba(255,255,255,.9)"/>
  </svg>`
}

function thumbA4Elegant(c: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 170" fill="none">
    <rect width="120" height="170" rx="4" fill="#fffdf7" stroke="#e2e8f0" stroke-width="1"/>
    <rect x="4" y="4" width="112" height="162" rx="3" stroke="${c}" stroke-width="0.5" stroke-dasharray="2 2"/>
    <rect x="0" y="0" width="120" height="30" rx="4" fill="#1e293b"/>
    <rect x="8" y="34" width="104" height="0.5" fill="${c}"/>
    <circle cx="60" cy="15" r="8" fill="rgba(255,255,255,.15)"/>
    <rect x="24" y="10" width="72" height="4" rx="2" fill="rgba(255,255,255,.7)"/>
    <rect x="35" y="17" width="50" height="2.5" rx="1.25" fill="rgba(255,255,255,.4)"/>
    <rect x="30" y="40" width="60" height="4" rx="2" fill="#1e293b"/>
    <rect x="40" y="47" width="40" height="2" rx="1" fill="#94a3b8"/>
    <rect x="8" y="56" width="104" height="0.5" fill="${c}88"/>
    <rect x="8" y="62" width="55" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="8" y="67" width="45" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="8" y="80" width="104" height="14" rx="3" stroke="${c}" stroke-width="0.5" fill="none"/>
    <rect x="14" y="85" width="35" height="3" rx="1.5" fill="#1e293b"/>
    <rect x="75" y="84" width="28" height="6" rx="2" fill="${c}"/>
    <rect x="8" y="102" width="50" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="8" y="107" width="40" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="8" y="156" width="104" height="0.5" fill="${c}"/>
    <rect x="38" y="160" width="44" height="2" rx="1" fill="#e2e8f0"/>
  </svg>`
}

function thumbA5Compact(c: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 105 148" fill="none">
    <rect width="105" height="148" rx="4" fill="#fff" stroke="#e2e8f0" stroke-width="1"/>
    <rect x="0" y="0" width="105" height="26" rx="4" fill="${c}"/>
    <circle cx="13" cy="13" r="7" fill="rgba(255,255,255,.2)"/>
    <rect x="24" y="8" width="45" height="4" rx="2" fill="rgba(255,255,255,.85)"/>
    <rect x="24" y="15" width="30" height="2.5" rx="1.25" fill="rgba(255,255,255,.5)"/>
    <rect x="7" y="32" width="91" height="6" rx="2" fill="${c}18"/>
    <rect x="7" y="41" width="91" height="6" rx="2" fill="#f8fafc"/>
    <rect x="7" y="49" width="91" height="6" rx="2" fill="${c}18"/>
    <rect x="7" y="57" width="91" height="6" rx="2" fill="#f8fafc"/>
    <rect x="7" y="70" width="91" height="14" rx="3" fill="${c}"/>
    <rect x="13" y="75" width="30" height="3" rx="1.5" fill="rgba(255,255,255,.8)"/>
    <rect x="65" y="73" width="28" height="7" rx="2" fill="rgba(255,255,255,.9)"/>
    <rect x="7" y="92" width="60" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="7" y="97" width="45" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="7" y="140" width="91" height="0.5" fill="#e2e8f0"/>
    <rect x="7" y="144" width="40" height="2" rx="1" fill="#e2e8f0"/>
  </svg>`
}

function thumbA5LandscapeSplit(c: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 148 105" fill="none">
    <rect width="148" height="105" rx="4" fill="#fff" stroke="#e2e8f0" stroke-width="1"/>
    <rect x="0" y="0" width="74" height="105" rx="4" fill="#fff"/>
    <rect x="74" y="0" width="74" height="105" rx="4" fill="#fafafa"/>
    <line x1="74" y1="0" x2="74" y2="105" stroke="${c}" stroke-width="0.5" stroke-dasharray="3 2"/>
    <rect x="0" y="0" width="74" height="20" fill="${c}"/>
    <rect x="74" y="0" width="74" height="20" fill="${c}CC"/>
    <rect x="5" y="6" width="35" height="3" rx="1.5" fill="rgba(255,255,255,.85)"/>
    <rect x="5" y="12" width="25" height="2" rx="1" fill="rgba(255,255,255,.5)"/>
    <rect x="79" y="6" width="35" height="3" rx="1.5" fill="rgba(255,255,255,.85)"/>
    <rect x="79" y="12" width="25" height="2" rx="1" fill="rgba(255,255,255,.5)"/>
    <rect x="5" y="25" width="62" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="5" y="30" width="50" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="79" y="25" width="62" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="79" y="30" width="50" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="5" y="55" width="62" height="10" rx="2" fill="${c}"/>
    <rect x="79" y="55" width="62" height="10" rx="2" fill="${c}"/>
  </svg>`
}

function thumbA5Bold(c: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 105 148" fill="none">
    <rect width="105" height="148" rx="4" fill="#fff" stroke="#e2e8f0" stroke-width="1"/>
    <rect x="0" y="0" width="105" height="50" rx="4" fill="${c}"/>
    <rect x="15" y="10" width="75" height="7" rx="3.5" fill="rgba(255,255,255,.9)"/>
    <rect x="25" y="20" width="55" height="4" rx="2" fill="rgba(255,255,255,.55)"/>
    <rect x="30" y="28" width="45" height="3" rx="1.5" fill="rgba(255,255,255,.35)"/>
    <rect x="7" y="58" width="91" height="16" rx="3" fill="${c}18" stroke="${c}33" stroke-width="0.5"/>
    <rect x="13" y="63" width="30" height="4" rx="2" fill="${c}"/>
    <rect x="60" y="61" width="35" height="8" rx="2" fill="${c}"/>
    <rect x="7" y="80" width="50" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="7" y="85" width="40" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="7" y="90" width="55" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="7" y="140" width="91" height="0.5" fill="#e2e8f0"/>
    <rect x="7" y="144" width="40" height="2" rx="1" fill="#e2e8f0"/>
  </svg>`
}

function thumbA5ReceiptBook(c: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 105 148" fill="none">
    <rect width="105" height="148" rx="4" fill="#fff" stroke="#e2e8f0" stroke-width="1"/>
    <rect x="0" y="0" width="105" height="22" rx="4" fill="${c}"/>
    <rect x="7" y="6" width="45" height="4" rx="2" fill="rgba(255,255,255,.85)"/>
    <rect x="7" y="13" width="30" height="2.5" rx="1.25" fill="rgba(255,255,255,.5)"/>
    <rect x="7" y="28" width="91" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="7" y="33" width="60" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="7" y="38" width="50" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="7" y="50" width="91" height="0.5" fill="#e2e8f0"/>
    <rect x="7" y="55" width="55" height="2" rx="1" fill="#f1f5f9"/>
    <rect x="7" y="60" width="45" height="2" rx="1" fill="#f1f5f9"/>
    <rect x="7" y="65" width="50" height="2" rx="1" fill="#f1f5f9"/>
    <rect x="7" y="75" width="91" height="10" rx="2" fill="${c}"/>
    <rect x="13" y="79" width="25" height="3" rx="1.5" fill="rgba(255,255,255,.8)"/>
    <rect x="68" y="77" width="26" height="6" rx="2" fill="rgba(255,255,255,.9)"/>
    <rect x="0" y="110" width="105" height="0.5" stroke="${c}" stroke-dasharray="4 3"/>
    <rect x="0" y="112" width="105" height="36" fill="#f8fafc" rx="0"/>
    <rect x="7" y="118" width="40" height="2.5" rx="1.25" fill="#94a3b8"/>
    <rect x="7" y="123" width="55" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="7" y="128" width="45" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="55" y="116" width="40" height="20" rx="2" stroke="${c}" stroke-width="0.5" fill="none"/>
    <rect x="60" y="122" width="30" height="3" rx="1.5" fill="${c}"/>
  </svg>`
}

function thumbThermalClean(c: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 180" fill="none">
    <rect width="80" height="180" rx="3" fill="#fff" stroke="#e2e8f0" stroke-width="1"/>
    <rect x="0" y="0" width="80" height="24" rx="3" fill="${c}"/>
    <rect x="10" y="6" width="60" height="5" rx="2.5" fill="rgba(255,255,255,.85)"/>
    <rect x="15" y="14" width="50" height="3" rx="1.5" fill="rgba(255,255,255,.5)"/>
    <rect x="5" y="30" width="70" height="0.5" fill="#e2e8f0"/>
    <rect x="5" y="34" width="50" height="2" rx="1" fill="#94a3b8"/>
    <rect x="5" y="39" width="60" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="5" y="44" width="45" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="5" y="52" width="70" height="0.5" fill="#e2e8f0"/>
    <rect x="5" y="57" width="45" height="2" rx="1" fill="#f1f5f9"/>
    <rect x="5" y="62" width="50" height="2" rx="1" fill="#f1f5f9"/>
    <rect x="5" y="67" width="45" height="2" rx="1" fill="#f1f5f9"/>
    <rect x="5" y="72" width="50" height="2" rx="1" fill="#f1f5f9"/>
    <rect x="5" y="80" width="70" height="0.5" fill="#e2e8f0"/>
    <rect x="5" y="85" width="70" height="12" rx="2" fill="${c}18"/>
    <rect x="10" y="89" width="25" height="3" rx="1.5" fill="${c}"/>
    <rect x="50" y="87" width="20" height="6" rx="2" fill="${c}"/>
    <rect x="5" y="103" width="70" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="5" y="108" width="60" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="15" y="120" width="50" height="8" rx="2" fill="${c}"/>
    <rect x="20" y="124" width="40" height="2.5" rx="1.25" fill="rgba(255,255,255,.85)"/>
    <rect x="15" y="135" width="50" height="3" rx="1.5" fill="#e2e8f0"/>
    <rect x="20" y="142" width="40" height="2" rx="1" fill="#e2e8f0"/>
  </svg>`
}

function thumbThermalBranded(c: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 180" fill="none">
    <rect width="80" height="180" rx="3" fill="#fff" stroke="#e2e8f0" stroke-width="1"/>
    <circle cx="40" cy="18" r="14" fill="${c}18" stroke="${c}" stroke-width="0.5"/>
    <circle cx="40" cy="18" r="8" fill="${c}"/>
    <rect x="10" y="36" width="60" height="5" rx="2.5" fill="#1e293b"/>
    <rect x="15" y="44" width="50" height="3" rx="1.5" fill="#94a3b8"/>
    <rect x="20" y="51" width="40" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="5" y="58" width="70" height="0.5" fill="${c}"/>
    <rect x="5" y="64" width="55" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="5" y="69" width="45" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="5" y="77" width="70" height="0.5" fill="#e2e8f0"/>
    <rect x="5" y="82" width="45" height="2" rx="1" fill="#f1f5f9"/>
    <rect x="5" y="87" width="50" height="2" rx="1" fill="#f1f5f9"/>
    <rect x="5" y="92" width="45" height="2" rx="1" fill="#f1f5f9"/>
    <rect x="5" y="100" width="70" height="12" rx="2" fill="${c}"/>
    <rect x="10" y="104" width="25" height="3" rx="1.5" fill="rgba(255,255,255,.85)"/>
    <rect x="50" y="103" width="20" height="5" rx="2" fill="rgba(255,255,255,.9)"/>
    <rect x="10" y="125" width="60" height="6" rx="2" fill="#f8fafc" stroke="#e2e8f0" stroke-width="0.5"/>
    <rect x="15" y="128" width="50" height="2" rx="1" fill="#94a3b8"/>
  </svg>`
}

function thumbThermalTabular(c: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 180" fill="none">
    <rect width="80" height="180" rx="3" fill="#fff" stroke="#e2e8f0" stroke-width="1"/>
    <rect x="0" y="0" width="80" height="20" rx="3" fill="#1e293b"/>
    <rect x="5" y="5" width="50" height="4" rx="2" fill="rgba(255,255,255,.8)"/>
    <rect x="5" y="13" width="35" height="2.5" rx="1.25" fill="rgba(255,255,255,.4)"/>
    <rect x="5" y="26" width="70" height="0.5" fill="#e2e8f0"/>
    <rect x="5" y="30" width="25" height="2" rx="1" fill="#94a3b8"/>
    <rect x="50" y="30" width="25" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="5" y="35" width="25" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="50" y="35" width="25" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="5" y="43" width="70" height="0.5" fill="#e2e8f0"/>
    <rect x="5" y="48" width="30" height="2" rx="1" fill="#94a3b8"/>
    <rect x="50" y="48" width="25" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="5" y="53" width="30" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="50" y="53" width="25" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="5" y="58" width="30" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="50" y="58" width="25" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="5" y="66" width="70" height="0.5" fill="${c}"/>
    <rect x="5" y="70" width="30" height="3" rx="1.5" fill="${c}"/>
    <rect x="50" y="69" width="25" height="5" rx="1.5" fill="${c}"/>
    <rect x="5" y="80" width="70" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="5" y="85" width="60" height="2" rx="1" fill="#e2e8f0"/>
    <rect x="15" y="100" width="50" height="7" rx="2" fill="${c}18" stroke="${c}" stroke-width="0.5"/>
    <rect x="20" y="103" width="40" height="2.5" rx="1.25" fill="${c}"/>
  </svg>`
}

// ══════════════════════════════════════════════════════════════════════════════
// ── HTML GENERATORS ──────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function baseHead(pageCSS: string, extraCSS = '') {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">${GOOGLE_FONTS}<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'DM Sans',sans-serif;background:#fff;color:#1e293b;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  @media print{body{background:#fff;}}
  ${pageCSS}
  ${extraCSS}
  </style></head>`
}

// ── A4 Classic Letterhead ─────────────────────────────────────────────────────
function genA4Classic(d: ReceiptData, t: TemplateTheme, copies: 'single' | 'duplicate'): string {
  const copyHTML = (label: string) => `
  <div class="page">
    <div class="header">
      <div class="logo">${d.logoHtml}</div>
      <div class="school-info">
        <h1>${d.schoolName}</h1>
        <p>${d.schoolAddress}</p>
        <p>${d.schoolPhone}${d.schoolEmail ? ' · ' + d.schoolEmail : ''}</p>
      </div>
      <div class="receipt-badge">
        <div class="rb-label">RECEIPT</div>
        <div class="rb-no">#${d.receiptNo}</div>
        <div class="rb-copy">${label}</div>
      </div>
    </div>
    <div class="divider"></div>
    <div class="meta-grid">
      <div><span class="lbl">Student</span><strong>${d.studentName}</strong></div>
      <div><span class="lbl">Student ID</span><strong>${d.studentId}</strong></div>
      <div><span class="lbl">Class</span><strong>${d.className}</strong></div>
      <div><span class="lbl">Guardian</span><strong>${d.guardianName || '—'}</strong></div>
      <div><span class="lbl">Term</span><strong>${d.term}</strong></div>
      <div><span class="lbl">Date</span><strong>${d.payDate} ${d.payTime}</strong></div>
      <div><span class="lbl">Method</span><strong>${d.payMethod.toUpperCase()}</strong></div>
      <div><span class="lbl">Reference</span><strong>${d.reference || '—'}</strong></div>
    </div>
    <table>
      <thead><tr><th>Description</th><th class="amt">Amount</th></tr></thead>
      <tbody>
        ${d.feeLines.map(fl => `<tr><td>${fl.name}</td><td class="amt">${FMT(fl.amount, d.currency)}</td></tr>`).join('')}
        ${d.pct > 0 ? `<tr class="disc"><td>Scholarship Discount (${d.pct}%)</td><td class="amt">-${FMT(d.termCharges - d.netTermCharges, d.currency)}</td></tr>` : ''}
        ${d.openingArrears > 0 ? `<tr><td>Opening Arrears</td><td class="amt">${FMT(d.openingArrears, d.currency)}</td></tr>` : ''}
        <tr class="subtotal"><td>Total Bill</td><td class="amt">${FMT(d.totalBill, d.currency)}</td></tr>
        <tr class="subtotal"><td>Total Paid to Date</td><td class="amt">${FMT(d.totalPaidToDate, d.currency)}</td></tr>
      </tbody>
    </table>
    <div class="amount-row">
      <div>
        <div class="al">Amount Paid This Receipt</div>
        <div class="al-sub">${d.payMethod.toUpperCase()} · ${d.payDate}</div>
      </div>
      <div class="amount">${FMT(d.amountPaid, d.currency)}</div>
    </div>
    <div class="balance-row">
      <span>Outstanding Balance</span>
      <span class="bal ${d.finalBalance <= 0 ? 'paid' : ''}">${d.finalBalance <= 0 ? 'FULLY PAID ✓' : FMT(d.finalBalance, d.currency)}</span>
    </div>
    <div class="footer">
      <p>Thank you for your payment • ${d.schoolName}</p>
      <p>Printed: ${d.payDate} ${d.payTime}</p>
    </div>
  </div>`

  const css = `
  @page{size:A4 portrait;margin:0;}
  .page{width:210mm;min-height:${copies === 'duplicate' ? '148.5mm' : '297mm'};padding:14mm 16mm;page-break-after:always;position:relative;border-bottom:${copies === 'duplicate' ? '1px dashed #cbd5e1' : 'none'};}
  .header{display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;}
  .logo svg,.logo img{width:58px;height:58px;object-fit:contain;}
  .school-info{flex:1;}
  .school-info h1{font-family:'Playfair Display',serif;font-size:17px;color:${t.accentDark};margin-bottom:2px;}
  .school-info p{font-size:10px;color:#64748b;line-height:1.5;}
  .receipt-badge{text-align:right;border:1.5px solid ${t.accentColor};border-radius:8px;padding:8px 12px;min-width:100px;}
  .rb-label{font-size:9px;font-weight:800;letter-spacing:.1em;color:${t.accentColor};text-transform:uppercase;}
  .rb-no{font-size:14px;font-weight:800;color:${t.accentDark};}
  .rb-copy{font-size:9px;color:#94a3b8;font-weight:600;}
  .divider{border:none;border-top:2px solid ${t.accentColor};margin:10px 0;}
  .meta-grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px 10px;margin-bottom:12px;}
  .meta-grid>div{background:${t.accentLight};border-radius:6px;padding:6px 8px;}
  .lbl{display:block;font-size:8.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#64748b;margin-bottom:2px;}
  .meta-grid strong{font-size:10.5px;color:#0f172a;font-weight:700;}
  table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:10px;}
  th{background:${t.accentColor};color:#fff;padding:6px 8px;text-align:left;font-weight:700;font-size:10px;letter-spacing:.04em;text-transform:uppercase;}
  th.amt,td.amt{text-align:right;}
  td{padding:5px 8px;border-bottom:1px solid #f1f5f9;}
  tr:nth-child(even) td{background:#f8fafc;}
  tr.disc td{color:#ef4444;font-style:italic;}
  tr.subtotal td{font-weight:700;background:${t.accentLight};border-top:1.5px solid ${t.accentColor}20;}
  .amount-row{display:flex;justify-content:space-between;align-items:center;background:${t.accentColor};color:#fff;border-radius:10px;padding:12px 16px;margin-bottom:8px;}
  .al{font-size:13px;font-weight:700;}.al-sub{font-size:10px;opacity:.75;margin-top:2px;}
  .amount{font-size:20px;font-weight:800;letter-spacing:-.5px;}
  .balance-row{display:flex;justify-content:space-between;font-size:12px;font-weight:700;padding:8px 12px;background:${t.accentLight};border-radius:8px;margin-bottom:10px;}
  .bal.paid{color:#16a34a;}.bal:not(.paid){color:#dc2626;}
  .footer{position:absolute;bottom:10mm;left:16mm;right:16mm;display:flex;justify-content:space-between;font-size:9px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:6px;}`

  const body = `${baseHead(`@page{size:A4;margin:0;}`, css)}<body onload="setTimeout(()=>window.print(),600)">${copyHTML('Parent Copy')}${copies === 'duplicate' ? copyHTML('School Copy') : ''}</body></html>`
  return body
}

// ── A4 Modern Card ────────────────────────────────────────────────────────────
function genA4Modern(d: ReceiptData, t: TemplateTheme, copies: 'single' | 'duplicate'): string {
  const copyHTML = (label: string) => `
  <div class="page">
    <div class="hero">
      <div class="hero-left">
        <div class="logo-wrap">${d.logoHtml}</div>
        <div>
          <h1>${d.schoolName}</h1>
          <p>${d.schoolAddress}</p>
        </div>
      </div>
      <div class="hero-right">
        <div class="tag">${label}</div>
        <div class="rno">RECEIPT #${d.receiptNo}</div>
        <div class="rdate">${d.payDate}</div>
      </div>
    </div>
    <div class="card">
      <div class="card-grid">
        <div><span class="lbl">Student Name</span><strong>${d.studentName}</strong></div>
        <div><span class="lbl">ID</span><strong>${d.studentId}</strong></div>
        <div><span class="lbl">Class</span><strong>${d.className}</strong></div>
        <div><span class="lbl">Term</span><strong>${d.term}</strong></div>
        <div><span class="lbl">Payment Method</span><strong>${d.payMethod.toUpperCase()}</strong></div>
        <div><span class="lbl">Reference</span><strong>${d.reference || '—'}</strong></div>
      </div>
    </div>
    <div class="breakdown">
      ${d.feeLines.map(fl => `<div class="fee-row"><span>${fl.name}</span><span>${FMT(fl.amount, d.currency)}</span></div>`).join('')}
      ${d.openingArrears > 0 ? `<div class="fee-row"><span>Opening Arrears</span><span>${FMT(d.openingArrears, d.currency)}</span></div>` : ''}
      <div class="fee-row total"><span>Total Bill</span><span>${FMT(d.totalBill, d.currency)}</span></div>
      <div class="fee-row paid"><span>Amount Paid</span><span>${FMT(d.amountPaid, d.currency)}</span></div>
    </div>
    <div class="balance ${d.finalBalance <= 0 ? 'clear' : 'owed'}">
      <span>${d.finalBalance <= 0 ? '✓ Fully Settled' : 'Balance Due'}</span>
      <span>${d.finalBalance <= 0 ? '' : FMT(d.finalBalance, d.currency)}</span>
    </div>
    <p class="foot">Thank you · ${d.schoolName} · ${d.payDate} ${d.payTime}</p>
  </div>`

  const css = `
  @page{size:A4 portrait;margin:0;}
  .page{width:210mm;min-height:${copies === 'duplicate' ? '148.5mm' : '297mm'};padding:12mm 14mm;page-break-after:always;border-bottom:${copies === 'duplicate' ? '1px dashed #cbd5e1' : 'none'};}
  .hero{background:linear-gradient(135deg,${t.accentDark},${t.accentColor});border-radius:12px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;color:#fff;}
  .hero-left{display:flex;align-items:center;gap:12px;}
  .logo-wrap svg,.logo-wrap img{width:52px;height:52px;object-fit:contain;border-radius:8px;background:rgba(255,255,255,.2);padding:4px;}
  .hero-left h1{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;margin-bottom:2px;}
  .hero-left p{font-size:10px;opacity:.75;}
  .hero-right{text-align:right;}
  .tag{font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;background:rgba(255,255,255,.2);padding:3px 8px;border-radius:20px;margin-bottom:4px;display:inline-block;}
  .rno{font-size:13px;font-weight:800;letter-spacing:.03em;}
  .rdate{font-size:10px;opacity:.7;}
  .card{background:${t.accentLight};border:1.5px solid ${t.accentColor}30;border-radius:10px;padding:12px 16px;margin-bottom:12px;}
  .card-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;}
  .lbl{display:block;font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin-bottom:2px;}
  .card-grid strong{font-size:11px;font-weight:700;color:#0f172a;}
  .breakdown{border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:10px;font-size:11px;}
  .fee-row{display:flex;justify-content:space-between;padding:6px 12px;border-bottom:1px solid #f1f5f9;}
  .fee-row:last-child{border-bottom:none;}
  .fee-row.total{background:${t.accentLight};font-weight:700;}
  .fee-row.paid{background:${t.accentColor};color:#fff;font-weight:800;font-size:13px;padding:10px 12px;}
  .balance{display:flex;justify-content:space-between;padding:10px 14px;border-radius:8px;font-size:13px;font-weight:700;margin-bottom:8px;}
  .balance.clear{background:#dcfce7;color:#166534;}
  .balance.owed{background:#fef2f2;color:#991b1b;}
  .foot{font-size:9px;color:#94a3b8;text-align:center;}`

  return `${baseHead('', css)}<body onload="setTimeout(()=>window.print(),600)">${copyHTML('Parent Copy')}${copies === 'duplicate' ? copyHTML('School Copy') : ''}</body></html>`
}

// ── A4 Minimal ────────────────────────────────────────────────────────────────
function genA4Minimal(d: ReceiptData, t: TemplateTheme, copies: 'single' | 'duplicate'): string {
  const copyHTML = (label: string) => `
  <div class="page">
    <div class="topbar"></div>
    <div class="hdr">
      <div>${d.logoHtml}</div>
      <div class="school">
        <div class="sname">${d.schoolName}</div>
        <div class="saddr">${d.schoolAddress} · ${d.schoolPhone}</div>
      </div>
      <div class="rno">
        <div class="rno-label">RECEIPT</div>
        <div class="rno-val">#${d.receiptNo}</div>
        <div class="rno-copy">${label}</div>
      </div>
    </div>
    <hr class="rule"/>
    <div class="two-col">
      <div><div class="lbl">Issued To</div><div class="val">${d.studentName}</div><div class="sub">${d.className} · ID: ${d.studentId}</div></div>
      <div><div class="lbl">Date</div><div class="val">${d.payDate}</div><div class="sub">${d.term} · ${d.academicYear}</div></div>
    </div>
    <div class="items">
      ${d.feeLines.map(fl => `<div class="item"><span>${fl.name}</span><span>${FMT(fl.amount, d.currency)}</span></div>`).join('')}
      ${d.openingArrears > 0 ? `<div class="item"><span>Opening Arrears</span><span>${FMT(d.openingArrears, d.currency)}</span></div>` : ''}
    </div>
    <hr class="rule"/>
    <div class="totals">
      <div class="tot-row"><span>Total Bill</span><span>${FMT(d.totalBill, d.currency)}</span></div>
      <div class="tot-row bold"><span>Amount Paid</span><span style="color:${t.accentColor}">${FMT(d.amountPaid, d.currency)}</span></div>
      <div class="tot-row sm"><span>Balance</span><span style="color:${d.finalBalance > 0 ? '#dc2626' : '#16a34a'}">${d.finalBalance <= 0 ? 'Paid in Full ✓' : FMT(d.finalBalance, d.currency)}</span></div>
    </div>
    <div class="sig-row"><div class="sig-box">Received by: ___________</div><div class="sig-box">Date: ${d.payDate}</div></div>
    <div class="foot">${d.schoolName} — Official Payment Receipt · ${d.payDate} ${d.payTime}</div>
  </div>`

  const css = `
  @page{size:A4 portrait;margin:0;}
  .page{width:210mm;min-height:${copies === 'duplicate' ? '148.5mm' : '297mm'};padding:14mm 18mm;page-break-after:always;position:relative;border-bottom:${copies === 'duplicate' ? '1px dashed #cbd5e1' : 'none'};}
  .topbar{height:5px;background:${t.accentColor};border-radius:0 0 4px 4px;margin:0 -18mm;margin-bottom:10mm;}
  .hdr{display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;}
  .hdr svg,.hdr img{width:52px;height:52px;object-fit:contain;}
  .school{flex:1;}
  .sname{font-size:18px;font-weight:800;color:#0f172a;font-family:'Space Grotesk',sans-serif;}
  .saddr{font-size:10px;color:#64748b;margin-top:2px;}
  .rno{text-align:right;}
  .rno-label{font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${t.accentColor};}
  .rno-val{font-size:16px;font-weight:800;color:#0f172a;font-family:'Space Grotesk',sans-serif;}
  .rno-copy{font-size:9px;color:#94a3b8;}
  hr.rule{border:none;border-top:1.5px solid #e2e8f0;margin:10px 0;}
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px;}
  .lbl{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#94a3b8;margin-bottom:2px;}
  .val{font-size:13px;font-weight:700;color:#0f172a;}
  .sub{font-size:10px;color:#64748b;}
  .items{margin-bottom:8px;font-size:11.5px;}
  .item{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;}
  .totals{background:${t.accentLight};border-radius:8px;padding:10px 14px;margin-bottom:12px;}
  .tot-row{display:flex;justify-content:space-between;font-size:11.5px;padding:4px 0;}
  .tot-row.bold{font-size:15px;font-weight:800;border-top:1px solid ${t.accentColor}30;margin-top:4px;padding-top:6px;}
  .tot-row.sm{font-size:11px;font-weight:700;}
  .sig-row{display:flex;justify-content:space-between;margin-top:14px;}
  .sig-box{font-size:10px;color:#64748b;}
  .foot{position:absolute;bottom:10mm;left:18mm;right:18mm;font-size:9px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0;padding-top:5px;}`

  return `${baseHead('', css)}<body onload="setTimeout(()=>window.print(),600)">${copyHTML('Parent Copy')}${copies === 'duplicate' ? copyHTML('School Copy') : ''}</body></html>`
}

// ── A4 Corporate Stripe ───────────────────────────────────────────────────────
function genA4Corporate(d: ReceiptData, t: TemplateTheme, copies: 'single' | 'duplicate'): string {
  const copyHTML = (label: string) => `
  <div class="page">
    <div class="header">
      <div class="logo-box">${d.logoHtml}</div>
      <div class="school-block">
        <h1>${d.schoolName}</h1>
        <p>${d.schoolAddress}</p>
        <p>${d.schoolPhone}${d.schoolEmail ? ' · ' + d.schoolEmail : ''}</p>
      </div>
      <div class="receipt-info">
        <div class="ri-tag">FEE RECEIPT</div>
        <div class="ri-no">#${d.receiptNo}</div>
        <div class="ri-date">${d.payDate}</div>
        <div class="ri-copy">${label}</div>
      </div>
    </div>
    <div class="stripe"></div>
    <div class="body">
      <table class="meta">
        <tr><td class="lbl">Student</td><td>${d.studentName}</td><td class="lbl">Class</td><td>${d.className}</td></tr>
        <tr><td class="lbl">ID</td><td>${d.studentId}</td><td class="lbl">Guardian</td><td>${d.guardianName || '—'}</td></tr>
        <tr><td class="lbl">Term</td><td>${d.term}</td><td class="lbl">Academic Year</td><td>${d.academicYear}</td></tr>
        <tr><td class="lbl">Method</td><td>${d.payMethod.toUpperCase()}</td><td class="lbl">Reference</td><td>${d.reference || '—'}</td></tr>
      </table>
      <table class="fee-table">
        <thead><tr><th>Fee Item</th><th class="r">Billed</th><th class="r">Status</th></tr></thead>
        <tbody>
          ${d.feeLines.map(fl => `<tr><td>${fl.name}</td><td class="r">${FMT(fl.amount, d.currency)}</td><td class="r status">✓</td></tr>`).join('')}
          ${d.openingArrears > 0 ? `<tr><td>B/F Arrears</td><td class="r">${FMT(d.openingArrears, d.currency)}</td><td class="r status">—</td></tr>` : ''}
          <tr class="sub-row"><td colspan="2">Sub Total</td><td class="r">${FMT(d.totalBill, d.currency)}</td></tr>
          <tr class="paid-row"><td colspan="2">Amount Received</td><td class="r">${FMT(d.amountPaid, d.currency)}</td></tr>
        </tbody>
      </table>
      <div class="bal-row ${d.finalBalance <= 0 ? 'ok' : 'owe'}">
        <span>${d.finalBalance <= 0 ? 'Account Settled ✓' : 'Outstanding Balance'}</span>
        <span>${d.finalBalance <= 0 ? '' : FMT(d.finalBalance, d.currency)}</span>
      </div>
    </div>
    <div class="footer">
      <span>${d.schoolName} · Official Receipt</span>
      <span>Printed: ${d.payDate} ${d.payTime}</span>
    </div>
  </div>`

  const css = `
  @page{size:A4 portrait;margin:0;}
  .page{width:210mm;min-height:${copies === 'duplicate' ? '148.5mm' : '297mm'};padding:12mm 16mm;page-break-after:always;border-bottom:${copies === 'duplicate' ? '1px dashed #cbd5e1' : 'none'};}
  .header{background:${t.accentDark};color:#fff;margin:-12mm -16mm 0;padding:12mm 16mm 14px;display:flex;align-items:center;gap:14px;}
  .logo-box svg,.logo-box img{width:60px;height:60px;object-fit:contain;border-radius:10px;background:rgba(255,255,255,.15);padding:6px;}
  .school-block{flex:1;}
  .school-block h1{font-size:18px;font-weight:800;letter-spacing:-.3px;margin-bottom:3px;}
  .school-block p{font-size:10px;opacity:.7;line-height:1.5;}
  .receipt-info{text-align:right;}
  .ri-tag{font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;background:rgba(255,255,255,.2);padding:3px 8px;border-radius:12px;display:inline-block;margin-bottom:4px;}
  .ri-no{font-size:16px;font-weight:800;}
  .ri-date{font-size:10px;opacity:.7;}
  .ri-copy{font-size:9px;opacity:.5;margin-top:2px;}
  .stripe{height:6px;background:${t.accentColor};margin:0 -16mm;margin-bottom:14px;}
  .body{flex:1;}
  table.meta{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:12px;background:${t.accentLight};border-radius:8px;overflow:hidden;}
  table.meta td{padding:6px 10px;border-bottom:1px solid #e2e8f0;}
  table.meta .lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b;width:80px;}
  table.fee-table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:10px;}
  table.fee-table th{background:${t.accentColor};color:#fff;padding:7px 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;}
  table.fee-table th.r,table.fee-table td.r{text-align:right;}
  table.fee-table td{padding:6px 10px;border-bottom:1px solid #f1f5f9;}
  table.fee-table tr:nth-child(even) td{background:#f8fafc;}
  td.status{color:#16a34a;font-weight:700;}
  tr.sub-row td{font-weight:700;background:${t.accentLight};border-top:1.5px solid ${t.accentColor}40;font-size:12px;}
  tr.paid-row td{font-weight:800;background:${t.accentColor};color:#fff;font-size:13px;}
  .bal-row{display:flex;justify-content:space-between;padding:10px 14px;border-radius:8px;font-size:13px;font-weight:700;margin-bottom:12px;}
  .bal-row.ok{background:#dcfce7;color:#166534;}
  .bal-row.owe{background:#fef2f2;color:#991b1b;}
  .footer{display:flex;justify-content:space-between;font-size:9px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px;margin-top:8px;}`

  return `${baseHead('', css)}<body onload="setTimeout(()=>window.print(),600)">${copyHTML('Parent Copy')}${copies === 'duplicate' ? copyHTML('School Copy') : ''}</body></html>`
}

// ── A4 Elegant Serif ─────────────────────────────────────────────────────────
function genA4Elegant(d: ReceiptData, t: TemplateTheme, copies: 'single' | 'duplicate'): string {
  const copyHTML = (label: string) => `
  <div class="page">
    <div class="border-frame">
      <div class="hdr">
        <div class="orn">❧</div>
        <div class="school-center">
          <div class="logo-circle">${d.logoHtml}</div>
          <h1>${d.schoolName}</h1>
          <p>${d.schoolAddress} · ${d.schoolPhone}</p>
          <div class="orn2">— OFFICIAL FEE RECEIPT —</div>
        </div>
        <div class="orn">❧</div>
      </div>
      <div class="ruled"></div>
      <div class="meta-row">
        <div><span class="lbl">Receipt No</span> <strong>#${d.receiptNo}</strong></div>
        <div><span class="lbl">Date</span> <strong>${d.payDate}</strong></div>
        <div><span class="lbl">Copy</span> <strong>${label}</strong></div>
      </div>
      <div class="ruled-thin"></div>
      <div class="student-section">
        <div><span class="lbl">Student:</span> <strong>${d.studentName}</strong> &nbsp;&nbsp; <span class="lbl">Class:</span> <strong>${d.className}</strong> &nbsp;&nbsp; <span class="lbl">ID:</span> <strong>${d.studentId}</strong></div>
        <div style="margin-top:4px"><span class="lbl">Term:</span> <strong>${d.term}</strong> &nbsp;&nbsp; <span class="lbl">Payment Method:</span> <strong>${d.payMethod.toUpperCase()}</strong></div>
      </div>
      <table>
        <thead><tr><th>Description</th><th class="r">Amount</th></tr></thead>
        <tbody>
          ${d.feeLines.map(fl => `<tr><td>${fl.name}</td><td class="r">${FMT(fl.amount, d.currency)}</td></tr>`).join('')}
          ${d.openingArrears > 0 ? `<tr><td>Balance Brought Forward</td><td class="r">${FMT(d.openingArrears, d.currency)}</td></tr>` : ''}
          <tr class="sub"><td>TOTAL DUE</td><td class="r">${FMT(d.totalBill, d.currency)}</td></tr>
        </tbody>
      </table>
      <div class="amount-panel">
        <div class="ap-label">Amount Received</div>
        <div class="ap-amount">${FMT(d.amountPaid, d.currency)}</div>
        <div class="ap-bal ${d.finalBalance <= 0 ? 'ok' : 'owe'}">${d.finalBalance <= 0 ? '✓ Account Fully Settled' : `Balance: ${FMT(d.finalBalance, d.currency)}`}</div>
      </div>
      <div class="sig-section">
        <div class="sig-line">Cashier Signature: _________________________</div>
        <div class="sig-line">Date: ${d.payDate} &nbsp;&nbsp; Time: ${d.payTime}</div>
      </div>
      <div class="orn bottom-orn">~ Thank you for your payment ~</div>
    </div>
  </div>`

  const css = `
  @page{size:A4 portrait;margin:0;}
  .page{width:210mm;min-height:${copies === 'duplicate' ? '148.5mm' : '297mm'};padding:12mm;page-break-after:always;border-bottom:${copies === 'duplicate' ? '1px dashed #cbd5e1' : 'none'};}
  .border-frame{border:2px solid ${t.accentColor};border-radius:4px;padding:10mm 12mm;height:100%;box-sizing:border-box;}
  .hdr{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;}
  .orn{font-size:28px;color:${t.accentColor};line-height:1;}
  .school-center{text-align:center;flex:1;}
  .logo-circle svg,.logo-circle img{width:56px;height:56px;object-fit:contain;border-radius:50%;border:2px solid ${t.accentColor};padding:3px;margin-bottom:5px;}
  .school-center h1{font-family:'Playfair Display',serif;font-size:20px;color:${t.accentDark};margin-bottom:3px;}
  .school-center p{font-size:10px;color:#64748b;}
  .orn2{font-size:10px;font-weight:700;letter-spacing:.18em;color:${t.accentColor};margin-top:5px;}
  .ruled{border:none;border-top:1.5px solid ${t.accentColor};margin:8px 0;}
  .ruled-thin{border:none;border-top:0.5px solid ${t.accentColor}60;margin:6px 0;}
  .meta-row{display:flex;gap:20px;font-size:11px;justify-content:center;margin-bottom:4px;}
  .meta-row .lbl{color:#94a3b8;}
  .meta-row strong{color:#0f172a;font-weight:700;}
  .student-section{font-size:11px;margin-bottom:8px;color:#334155;}
  .lbl{color:#64748b;font-size:10px;}
  table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:10px;}
  th{border-top:1.5px solid ${t.accentColor};border-bottom:1.5px solid ${t.accentColor};padding:6px 8px;text-align:left;font-family:'Playfair Display',serif;font-size:10.5px;color:${t.accentDark};}
  th.r,td.r{text-align:right;}
  td{padding:5px 8px;border-bottom:1px dotted #e2e8f0;}
  tr.sub td{font-weight:700;border-top:1.5px solid ${t.accentColor};font-family:'Playfair Display',serif;font-size:12px;}
  .amount-panel{background:${t.accentLight};border:1.5px solid ${t.accentColor}50;border-radius:8px;padding:12px 16px;text-align:center;margin-bottom:10px;}
  .ap-label{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${t.accentColor};}
  .ap-amount{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;color:${t.accentDark};margin:4px 0;}
  .ap-bal{font-size:11px;font-weight:600;}
  .ap-bal.ok{color:#16a34a;}.ap-bal.owe{color:#dc2626;}
  .sig-section{display:flex;justify-content:space-between;margin-bottom:10px;font-size:10px;color:#64748b;}
  .sig-line{border-top:1px solid #e2e8f0;padding-top:4px;}
  .bottom-orn{text-align:center;font-size:11px;color:${t.accentColor};font-style:italic;margin-top:6px;}`

  return `${baseHead('', css)}<body onload="setTimeout(()=>window.print(),600)">${copyHTML('Parent Copy')}${copies === 'duplicate' ? copyHTML('School Copy') : ''}</body></html>`
}

// ── A5 Compact Portrait ───────────────────────────────────────────────────────
function genA5Compact(d: ReceiptData, t: TemplateTheme, copies: 'single' | 'duplicate'): string {
  const copyHTML = (label: string) => `
  <div class="page">
    <div class="hdr">
      <div>${d.logoHtml}</div>
      <div class="school"><h1>${d.schoolName}</h1><p>${d.schoolAddress}</p></div>
      <div class="rno"><span class="rno-l">RECEIPT</span><span class="rno-v">#${d.receiptNo}</span><span class="rno-c">${label}</span></div>
    </div>
    <div class="grid4">
      <div><span class="lbl">Student</span><strong>${d.studentName}</strong></div>
      <div><span class="lbl">Class</span><strong>${d.className}</strong></div>
      <div><span class="lbl">Date</span><strong>${d.payDate}</strong></div>
      <div><span class="lbl">Method</span><strong>${d.payMethod.toUpperCase()}</strong></div>
    </div>
    <table>
      <thead><tr><th>Item</th><th class="r">Amount</th></tr></thead>
      <tbody>
        ${d.feeLines.map(fl => `<tr><td>${fl.name}</td><td class="r">${FMT(fl.amount, d.currency)}</td></tr>`).join('')}
        ${d.openingArrears > 0 ? `<tr><td>Arrears B/F</td><td class="r">${FMT(d.openingArrears, d.currency)}</td></tr>` : ''}
      </tbody>
    </table>
    <div class="paid-banner">${FMT(d.amountPaid, d.currency)}<span class="pb-label">PAID</span></div>
    <div class="bal ${d.finalBalance <= 0 ? 'ok' : 'ow'}">${d.finalBalance <= 0 ? 'Account Clear ✓' : 'Balance: ' + FMT(d.finalBalance, d.currency)}</div>
    <div class="foot">${d.schoolName} · ${d.payDate} ${d.payTime}</div>
  </div>`

  const css = `
  @page{size:A5 portrait;margin:0;}
  .page{width:148mm;height:210mm;padding:8mm 10mm;page-break-after:always;font-size:10px;box-sizing:border-box;overflow:hidden;}
  .hdr{display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;}
  .hdr svg,.hdr img{width:42px;height:42px;object-fit:contain;}
  .school{flex:1;}h1{font-family:'Playfair Display',serif;font-size:13px;color:${t.accentDark};margin-bottom:1px;}
  .school p{font-size:8px;color:#64748b;}
  .rno{text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:1px;}
  .rno-l{font-size:7px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:${t.accentColor};}
  .rno-v{font-size:13px;font-weight:800;color:#0f172a;}
  .rno-c{font-size:7px;color:#94a3b8;}
  .grid4{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:8px;}
  .grid4>div{background:${t.accentLight};border-radius:5px;padding:5px 7px;}
  .lbl{display:block;font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin-bottom:1px;}
  .grid4 strong{font-size:10px;color:#0f172a;font-weight:700;}
  table{width:100%;border-collapse:collapse;font-size:9.5px;margin-bottom:8px;}
  th{background:${t.accentColor};color:#fff;padding:4px 6px;font-size:8px;font-weight:700;text-transform:uppercase;}
  th.r,td.r{text-align:right;}
  td{padding:4px 6px;border-bottom:1px solid #f1f5f9;}
  tr:nth-child(even) td{background:#f8fafc;}
  .paid-banner{background:${t.accentColor};color:#fff;border-radius:8px;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;font-size:16px;font-weight:800;margin-bottom:5px;}
  .pb-label{font-size:9px;font-weight:800;letter-spacing:.1em;background:rgba(255,255,255,.25);padding:3px 8px;border-radius:12px;}
  .bal{font-size:10px;font-weight:700;padding:5px 8px;border-radius:5px;margin-bottom:5px;}
  .bal.ok{background:#dcfce7;color:#166534;}.bal.ow{background:#fef2f2;color:#991b1b;}
  .foot{font-size:7.5px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0;padding-top:4px;}`

  return `${baseHead('', css)}<body onload="setTimeout(()=>window.print(),600)">${copyHTML('Parent Copy')}${copies === 'duplicate' ? copyHTML('School Copy') : ''}</body></html>`
}

// ── A5 Landscape Split ────────────────────────────────────────────────────────
function genA5LandscapeSplit(d: ReceiptData, t: TemplateTheme, copies: 'single' | 'duplicate'): string {
  const halfHTML = (label: string) => `
    <div class="half">
      <div class="hdr" style="background:${t.accentColor}">
        <div>${d.logoHtml}</div>
        <div class="hs"><h1>${d.schoolName}</h1><p>${d.schoolAddress}</p></div>
        <div class="rbox"><div class="rl">RECEIPT</div><div class="rv">#${d.receiptNo}</div><div class="rc">${label}</div></div>
      </div>
      <div class="body">
        <div class="row2">
          <div><div class="lbl">Student</div><strong>${d.studentName}</strong></div>
          <div><div class="lbl">Class</div><strong>${d.className}</strong></div>
          <div><div class="lbl">Date</div><strong>${d.payDate}</strong></div>
          <div><div class="lbl">Method</div><strong>${d.payMethod.toUpperCase()}</strong></div>
        </div>
        ${d.feeLines.map(fl => `<div class="fee-item"><span>${fl.name}</span><span>${FMT(fl.amount, d.currency)}</span></div>`).join('')}
        <div class="paid">${FMT(d.amountPaid, d.currency)}<span>PAID</span></div>
        <div class="bal ${d.finalBalance <= 0 ? 'ok' : 'ow'}">${d.finalBalance <= 0 ? '✓ Clear' : 'Bal: ' + FMT(d.finalBalance, d.currency)}</div>
        <div class="foot">${d.payDate} ${d.payTime}</div>
      </div>
    </div>`

  const css = `
  @page{size:A5 landscape;margin:0;}
  body{display:flex;flex-direction:row;width:210mm;height:148mm;overflow:hidden;}
  .half{width:${copies === 'duplicate' ? '105mm' : '210mm'};height:148mm;box-sizing:border-box;display:flex;flex-direction:column;border-right:${copies === 'duplicate' ? '1px dashed #94a3b8' : 'none'};}
  .hdr{display:flex;align-items:center;gap:6px;padding:6mm 6mm 5mm;color:#fff;}
  .hdr svg,.hdr img{width:36px;height:36px;object-fit:contain;border-radius:6px;background:rgba(255,255,255,.2);padding:3px;flex-shrink:0;}
  .hs{flex:1;}h1{font-size:11px;font-weight:800;margin-bottom:1px;}
  .hs p{font-size:7.5px;opacity:.75;}
  .rbox{text-align:right;}
  .rl{font-size:6.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;opacity:.8;}
  .rv{font-size:12px;font-weight:800;}
  .rc{font-size:6.5px;opacity:.6;}
  .body{flex:1;padding:4mm 6mm;display:flex;flex-direction:column;gap:4px;}
  .row2{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:4px;}
  .row2>div{background:${t.accentLight};border-radius:4px;padding:4px 5px;}
  .lbl{font-size:6.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin-bottom:1px;}
  .row2 strong{font-size:9px;color:#0f172a;font-weight:700;}
  .fee-item{display:flex;justify-content:space-between;font-size:8.5px;padding:2px 0;border-bottom:1px solid #f1f5f9;}
  .paid{background:${t.accentColor};color:#fff;border-radius:6px;padding:6px 10px;display:flex;justify-content:space-between;align-items:center;font-size:14px;font-weight:800;margin-top:auto;}
  .paid span{font-size:7px;font-weight:800;letter-spacing:.1em;background:rgba(255,255,255,.25);padding:2px 6px;border-radius:10px;}
  .bal{font-size:8.5px;font-weight:700;padding:3px 6px;border-radius:4px;}
  .bal.ok{background:#dcfce7;color:#166534;}.bal.ow{background:#fef2f2;color:#991b1b;}
  .foot{font-size:7px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0;padding-top:3px;}`

  const twoHalves = copies === 'duplicate' ? `${halfHTML('Parent Copy')}${halfHTML('School Copy')}` : halfHTML('Original')
  return `${baseHead('', css)}<body onload="setTimeout(()=>window.print(),600)">${twoHalves}</body></html>`
}

// ── A5 Bold ───────────────────────────────────────────────────────────────────
function genA5Bold(d: ReceiptData, t: TemplateTheme, copies: 'single' | 'duplicate'): string {
  const copyHTML = (label: string) => `
  <div class="page">
    <div class="top-hero">
      <div class="logo-wrap">${d.logoHtml}</div>
      <h1>${d.schoolName}</h1>
      <p>${d.term} · ${d.academicYear}</p>
      <div class="hero-badges">
        <span class="badge">${label}</span>
        <span class="badge">#${d.receiptNo}</span>
      </div>
    </div>
    <div class="content">
      <div class="info-grid">
        <div><span class="lbl">Student</span><span class="val">${d.studentName}</span></div>
        <div><span class="lbl">ID</span><span class="val">${d.studentId}</span></div>
        <div><span class="lbl">Class</span><span class="val">${d.className}</span></div>
        <div><span class="lbl">Date</span><span class="val">${d.payDate}</span></div>
        <div><span class="lbl">Method</span><span class="val">${d.payMethod.toUpperCase()}</span></div>
        <div><span class="lbl">Ref</span><span class="val">${d.reference || '—'}</span></div>
      </div>
      <div class="fees-list">
        ${d.feeLines.map(fl => `<div class="fi"><span>${fl.name}</span><span>${FMT(fl.amount, d.currency)}</span></div>`).join('')}
        ${d.openingArrears > 0 ? `<div class="fi"><span>B/F Arrears</span><span>${FMT(d.openingArrears, d.currency)}</span></div>` : ''}
      </div>
      <div class="amount-block">
        <div class="ab-label">AMOUNT PAID</div>
        <div class="ab-value">${FMT(d.amountPaid, d.currency)}</div>
      </div>
      <div class="status-block ${d.finalBalance <= 0 ? 'ok' : 'ow'}">
        ${d.finalBalance <= 0 ? '✓ Fully Paid' : 'Balance: ' + FMT(d.finalBalance, d.currency)}
      </div>
    </div>
  </div>`

  const css = `
  @page{size:A5 portrait;margin:0;}
  .page{width:148mm;height:210mm;page-break-after:always;font-size:10px;box-sizing:border-box;overflow:hidden;display:flex;flex-direction:column;}
  .top-hero{background:linear-gradient(135deg,${t.accentDark},${t.accentColor});color:#fff;padding:10mm 10mm 8mm;text-align:center;}
  .logo-wrap svg,.logo-wrap img{width:50px;height:50px;object-fit:contain;border-radius:50%;background:rgba(255,255,255,.2);padding:5px;margin-bottom:5px;}
  h1{font-family:'Space Grotesk',sans-serif;font-size:18px;font-weight:800;margin-bottom:3px;}
  .top-hero p{font-size:9px;opacity:.8;margin-bottom:6px;}
  .hero-badges{display:flex;gap:6px;justify-content:center;}
  .badge{font-size:8px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;background:rgba(255,255,255,.2);padding:3px 8px;border-radius:12px;}
  .content{flex:1;padding:8mm 10mm;display:flex;flex-direction:column;gap:7px;}
  .info-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;}
  .info-grid>div{display:flex;flex-direction:column;gap:1px;}
  .lbl{font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;}
  .val{font-size:10px;font-weight:700;color:#0f172a;}
  .fees-list{border-radius:7px;overflow:hidden;border:1px solid #e2e8f0;}
  .fi{display:flex;justify-content:space-between;font-size:9.5px;padding:5px 8px;border-bottom:1px solid #f1f5f9;}
  .fi:last-child{border-bottom:none;}
  .fi:nth-child(even){background:#f8fafc;}
  .amount-block{background:${t.accentColor};color:#fff;border-radius:8px;padding:10px 14px;text-align:center;}
  .ab-label{font-size:8px;font-weight:800;letter-spacing:.14em;opacity:.8;margin-bottom:2px;}
  .ab-value{font-size:22px;font-weight:800;}
  .status-block{font-size:11px;font-weight:700;padding:6px 10px;border-radius:6px;text-align:center;}
  .status-block.ok{background:#dcfce7;color:#166534;}
  .status-block.ow{background:#fef2f2;color:#991b1b;}`

  return `${baseHead('', css)}<body onload="setTimeout(()=>window.print(),600)">${copyHTML('Parent Copy')}${copies === 'duplicate' ? copyHTML('School Copy') : ''}</body></html>`
}

// ── A5 Receipt Book ───────────────────────────────────────────────────────────
function genA5ReceiptBook(d: ReceiptData, t: TemplateTheme, copies: 'single' | 'duplicate'): string {
  const copyHTML = (label: string) => `
  <div class="page">
    <div class="main">
      <div class="hdr">
        <div>${d.logoHtml}</div>
        <div class="school-info"><h1>${d.schoolName}</h1><p>${d.schoolAddress}</p><p>${d.schoolPhone}</p></div>
        <div class="rno"><div class="rl">RECEIPT</div><div class="rv">#${d.receiptNo}</div><div class="rc">${label}</div></div>
      </div>
      <hr/>
      <div class="stu-info">
        <span><b>Student:</b> ${d.studentName}</span>
        <span><b>Class:</b> ${d.className}</span>
        <span><b>ID:</b> ${d.studentId}</span>
        <span><b>Date:</b> ${d.payDate}</span>
        <span><b>Method:</b> ${d.payMethod.toUpperCase()}</span>
        <span><b>Term:</b> ${d.term}</span>
      </div>
      <table>
        <thead><tr><th>Item</th><th class="r">Amount</th></tr></thead>
        <tbody>
          ${d.feeLines.map(fl => `<tr><td>${fl.name}</td><td class="r">${FMT(fl.amount, d.currency)}</td></tr>`).join('')}
          ${d.openingArrears > 0 ? `<tr><td>Arrears Carried Forward</td><td class="r">${FMT(d.openingArrears, d.currency)}</td></tr>` : ''}
          <tr class="tot"><td>Amount Received</td><td class="r">${FMT(d.amountPaid, d.currency)}</td></tr>
        </tbody>
      </table>
      <div class="sig">
        <div>Cashier: ______________</div>
        <div>Stamp Box: <span class="stamp-box"></span></div>
      </div>
    </div>
    <div class="stub-cut">✂ &nbsp;— — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — —</div>
    <div class="stub">
      <div class="stub-left">
        <div class="lbl">Student</div><strong>${d.studentName}</strong>
        <div class="lbl" style="margin-top:4px">Class</div><strong>${d.className}</strong>
      </div>
      <div class="stub-center">
        <div class="lbl">Receipt</div><strong>#${d.receiptNo}</strong>
        <div class="lbl" style="margin-top:4px">Date</div><strong>${d.payDate}</strong>
      </div>
      <div class="stub-right">
        <div class="lbl">Amount Paid</div>
        <div class="stub-amount">${FMT(d.amountPaid, d.currency)}</div>
        <div class="${d.finalBalance <= 0 ? 'stub-ok' : 'stub-ow'}">${d.finalBalance <= 0 ? 'CLEAR ✓' : 'BAL DUE'}</div>
      </div>
    </div>
  </div>`

  const css = `
  @page{size:A5 portrait;margin:0;}
  .page{width:148mm;height:210mm;page-break-after:always;font-size:9.5px;box-sizing:border-box;overflow:hidden;display:flex;flex-direction:column;}
  .main{flex:1;padding:7mm 8mm 3mm;display:flex;flex-direction:column;gap:5px;}
  .hdr{display:flex;align-items:flex-start;gap:8px;margin-bottom:6px;}
  .hdr svg,.hdr img{width:40px;height:40px;object-fit:contain;}
  .school-info{flex:1;}h1{font-family:'Playfair Display',serif;font-size:12px;color:${t.accentDark};margin-bottom:1px;}
  .school-info p{font-size:7.5px;color:#64748b;line-height:1.4;}
  .rno{text-align:right;}.rl{font-size:7px;font-weight:800;letter-spacing:.1em;color:${t.accentColor};text-transform:uppercase;}
  .rv{font-size:14px;font-weight:800;color:#0f172a;}.rc{font-size:7px;color:#94a3b8;}
  hr{border:none;border-top:1.5px solid ${t.accentColor};margin:2px 0;}
  .stu-info{display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px 10px;font-size:8.5px;margin-bottom:4px;}
  table{width:100%;border-collapse:collapse;font-size:9px;}
  th{background:${t.accentColor};color:#fff;padding:4px 6px;font-size:8px;font-weight:700;text-transform:uppercase;}
  th.r,td.r{text-align:right;}
  td{padding:3.5px 6px;border-bottom:1px solid #f1f5f9;}
  tr:nth-child(even) td{background:#f8fafc;}
  tr.tot td{font-weight:800;background:${t.accentColor};color:#fff;font-size:11px;}
  .sig{display:flex;justify-content:space-between;font-size:8.5px;color:#64748b;margin-top:6px;}
  .stamp-box{display:inline-block;width:50px;height:20px;border:1px solid #cbd5e1;border-radius:3px;vertical-align:middle;}
  .stub-cut{font-size:8.5px;color:#94a3b8;padding:3px 8mm;letter-spacing:.05em;border-top:1px solid #e2e8f0;}
  .stub{display:flex;gap:10px;padding:4mm 8mm;background:${t.accentLight};flex:0 0 auto;}
  .lbl{font-size:7px;font-weight:700;text-transform:uppercase;color:#64748b;letter-spacing:.05em;}
  .stub strong{font-size:10px;color:#0f172a;font-weight:700;}
  .stub-left{flex:1;}.stub-center{flex:1;}.stub-right{text-align:right;flex:1;}
  .stub-amount{font-size:16px;font-weight:800;color:${t.accentDark};}
  .stub-ok{font-size:8px;font-weight:800;color:#16a34a;letter-spacing:.08em;}
  .stub-ow{font-size:8px;font-weight:800;color:#dc2626;letter-spacing:.08em;}`

  return `${baseHead('', css)}<body onload="setTimeout(()=>window.print(),600)">${copyHTML('Parent Copy')}${copies === 'duplicate' ? copyHTML('School Copy') : ''}</body></html>`
}

// ── Thermal Clean ─────────────────────────────────────────────────────────────
function genThermalClean(d: ReceiptData, t: TemplateTheme, copies: 'single' | 'duplicate'): string {
  const pageW = '80mm'
  const dashes = '—'.repeat(32)
  const copyHTML = (label: string) => `
  <div class="receipt">
    <div class="top-bar"></div>
    <div class="header">
      <div class="logo-sm">${d.logoHtml}</div>
      <div class="school-nm">${d.schoolName}</div>
      <div class="school-sub">${d.schoolAddress}</div>
      <div class="school-sub">${d.schoolPhone}</div>
    </div>
    <div class="dash">${dashes}</div>
    <div class="row"><span>Receipt No</span><span>#${d.receiptNo}</span></div>
    <div class="row"><span>Date</span><span>${d.payDate}</span></div>
    <div class="row"><span>Time</span><span>${d.payTime}</span></div>
    <div class="row"><span>Copy</span><span>${label}</span></div>
    <div class="dash">${dashes}</div>
    <div class="row"><span>Student</span><span class="r">${d.studentName}</span></div>
    <div class="row"><span>Class</span><span class="r">${d.className}</span></div>
    <div class="row"><span>Term</span><span class="r">${d.term}</span></div>
    <div class="row"><span>Method</span><span class="r">${d.payMethod.toUpperCase()}</span></div>
    ${d.reference ? `<div class="row"><span>Ref</span><span class="r">${d.reference}</span></div>` : ''}
    <div class="dash">${dashes}</div>
    ${d.feeLines.map(fl => `<div class="row"><span>${fl.name}</span><span>${FMT(fl.amount, d.currency)}</span></div>`).join('')}
    ${d.openingArrears > 0 ? `<div class="row"><span>Arrears B/F</span><span>${FMT(d.openingArrears, d.currency)}</span></div>` : ''}
    <div class="dash">${dashes}</div>
    <div class="row bold"><span>TOTAL DUE</span><span>${FMT(d.totalBill, d.currency)}</span></div>
    <div class="amount-box"><div class="ab-sm">AMOUNT RECEIVED</div><div class="ab-val">${FMT(d.amountPaid, d.currency)}</div></div>
    <div class="bal-row ${d.finalBalance <= 0 ? 'ok' : 'ow'}">${d.finalBalance <= 0 ? '★ FULLY PAID ★' : 'BALANCE: ' + FMT(d.finalBalance, d.currency)}</div>
    <div class="dash">${dashes}</div>
    <div class="thank">Thank you for your payment</div>
    <div class="thank" style="font-size:8px;margin-top:2px;">${d.schoolName}</div>
    <div class="dash">${dashes}</div>
    <div style="height:12mm"></div>
  </div>`

  const css = `
  @page{size:${pageW} auto;margin:0;}
  *{font-family:'IBM Plex Mono',monospace;font-size:10px;}
  .receipt{width:${pageW};padding:4mm 3mm;word-break:break-word;}
  .top-bar{height:4px;background:${t.accentColor};margin-bottom:6px;}
  .header{text-align:center;margin-bottom:6px;}
  .logo-sm svg,.logo-sm img{width:36px;height:36px;object-fit:contain;border-radius:50%;margin-bottom:3px;}
  .school-nm{font-size:12px;font-weight:800;font-family:'DM Sans',sans-serif;}
  .school-sub{font-size:8.5px;color:#64748b;}
  .dash{color:#94a3b8;font-size:8px;overflow:hidden;white-space:nowrap;margin:3px 0;}
  .row{display:flex;justify-content:space-between;margin:2px 0;font-size:9.5px;}
  .row .r{max-width:55%;text-align:right;word-break:break-word;}
  .row.bold{font-weight:800;font-size:10.5px;}
  .amount-box{background:${t.accentColor};color:#fff;border-radius:6px;padding:7px;text-align:center;margin:6px 0;}
  .ab-sm{font-size:7.5px;font-weight:800;letter-spacing:.1em;opacity:.85;margin-bottom:2px;}
  .ab-val{font-size:17px;font-weight:800;font-family:'DM Sans',sans-serif;}
  .bal-row{text-align:center;font-size:9.5px;font-weight:800;padding:4px;border-radius:4px;margin:4px 0;}
  .bal-row.ok{background:#dcfce7;color:#166534;}.bal-row.ow{background:#fef2f2;color:#991b1b;}
  .thank{text-align:center;font-size:9px;color:#64748b;}`

  const dupeDiv = copies === 'duplicate' ? `<div style="border-top:1px dashed #94a3b8;margin:4px 0;font-size:8px;text-align:center;padding:2px 0;color:#94a3b8;">✂ SCHOOL COPY</div>${copyHTML('School Copy')}` : ''

  return `${baseHead('', css)}<body onload="setTimeout(()=>window.print(),600)">${copyHTML('Parent Copy')}${dupeDiv}</body></html>`
}

// ── Thermal Branded ───────────────────────────────────────────────────────────
function genThermalBranded(d: ReceiptData, t: TemplateTheme, copies: 'single' | 'duplicate'): string {
  const dashes = '-'.repeat(34)
  const copyHTML = (label: string) => `
  <div class="receipt">
    <div class="brand-header">
      <div class="logo-ring">${d.logoHtml}</div>
      <div class="school-nm">${d.schoolName}</div>
      <div class="tag-line">${d.schoolAddress}</div>
      <div class="tag-line">${d.schoolPhone}</div>
    </div>
    <div class="title-bar">★ OFFICIAL FEE RECEIPT ★</div>
    <div class="dash">${dashes}</div>
    <div class="row"><b>No:</b> #${d.receiptNo} &nbsp; ${label}</div>
    <div class="row"><b>Date:</b> ${d.payDate} ${d.payTime}</div>
    <div class="dash">${dashes}</div>
    <div class="row"><b>Student:</b> ${d.studentName}</div>
    <div class="row"><b>Class:</b> ${d.className} · ${d.term}</div>
    <div class="row"><b>Method:</b> ${d.payMethod.toUpperCase()}</div>
    ${d.reference ? `<div class="row"><b>Ref:</b> ${d.reference}</div>` : ''}
    <div class="dash">${dashes}</div>
    ${d.feeLines.map(fl => `<div class="fee-row"><span>${fl.name}</span><span>${FMT(fl.amount, d.currency)}</span></div>`).join('')}
    ${d.openingArrears > 0 ? `<div class="fee-row"><span>Arrears B/F</span><span>${FMT(d.openingArrears, d.currency)}</span></div>` : ''}
    <div class="dash">${dashes}</div>
    <div class="fee-row bold"><span>TOTAL DUE</span><span>${FMT(d.totalBill, d.currency)}</span></div>
    <div class="big-amount">
      <div class="ba-lbl">RECEIVED</div>
      <div class="ba-val">${FMT(d.amountPaid, d.currency)}</div>
    </div>
    <div class="status ${d.finalBalance <= 0 ? 'ok' : 'ow'}">${d.finalBalance <= 0 ? '✓ FULLY SETTLED' : 'BALANCE DUE: ' + FMT(d.finalBalance, d.currency)}</div>
    <div class="dash">${dashes}</div>
    <div class="footer-msg">Thank you · God Bless You</div>
    <div style="height:14mm"></div>
  </div>`

  const css = `
  @page{size:80mm auto;margin:0;}
  *{font-family:'DM Sans',sans-serif;font-size:10px;}
  .receipt{width:80mm;padding:4mm 4mm;word-break:break-word;}
  .brand-header{text-align:center;padding:4px 0 8px;}
  .logo-ring svg,.logo-ring img{width:44px;height:44px;object-fit:contain;border-radius:50%;border:2px solid ${t.accentColor};padding:3px;margin-bottom:4px;}
  .school-nm{font-size:14px;font-weight:800;color:${t.accentDark};}
  .tag-line{font-size:8px;color:#64748b;}
  .title-bar{background:${t.accentColor};color:#fff;text-align:center;font-size:9px;font-weight:800;letter-spacing:.1em;padding:4px;border-radius:4px;margin:5px 0;}
  .dash{font-size:8px;color:#e2e8f0;overflow:hidden;white-space:nowrap;margin:3px 0;letter-spacing:1px;}
  .row{font-size:9.5px;margin:2px 0;}
  .fee-row{display:flex;justify-content:space-between;font-size:9.5px;margin:2px 0;}
  .fee-row.bold{font-weight:800;font-size:10.5px;}
  .big-amount{background:${t.accentColor};color:#fff;border-radius:8px;padding:8px;text-align:center;margin:6px 0;}
  .ba-lbl{font-size:8px;font-weight:700;letter-spacing:.1em;opacity:.8;margin-bottom:2px;}
  .ba-val{font-size:20px;font-weight:800;}
  .status{text-align:center;font-size:10px;font-weight:800;padding:5px;border-radius:4px;margin:4px 0;}
  .status.ok{background:#dcfce7;color:#166534;}.status.ow{background:#fef2f2;color:#991b1b;}
  .footer-msg{text-align:center;font-size:9px;color:#64748b;padding:4px 0;}`

  const dupeDiv = copies === 'duplicate' ? `<div style="border-top:1px dashed #94a3b8;margin:4px 0;font-size:8px;text-align:center;padding:2px 0;color:#94a3b8;">✂ SCHOOL COPY</div>${copyHTML('School Copy')}` : ''

  return `${baseHead('', css)}<body onload="setTimeout(()=>window.print(),600)">${copyHTML('Parent Copy')}${dupeDiv}</body></html>`
}

// ── Thermal Tabular ───────────────────────────────────────────────────────────
function genThermalTabular(d: ReceiptData, t: TemplateTheme, copies: 'single' | 'duplicate'): string {
  const dashes = '─'.repeat(34)
  const dotLine = (label: string, value: string) =>
    `<div class="dl"><span class="dl-k">${label}</span><span class="dl-dots"></span><span class="dl-v">${value}</span></div>`

  const copyHTML = (label: string) => `
  <div class="receipt">
    <div class="hdr">
      <div class="hdr-logo">${d.logoHtml}</div>
      <div>
        <div class="school-nm">${d.schoolName}</div>
        <div class="school-sub">${d.schoolAddress}</div>
      </div>
    </div>
    <div class="center-title">PAYMENT RECEIPT · ${label}</div>
    <div class="dash">${dashes}</div>
    ${dotLine('Receipt', '#' + d.receiptNo)}
    ${dotLine('Date', d.payDate)}
    ${dotLine('Time', d.payTime)}
    <div class="dash">${dashes}</div>
    ${dotLine('Student', d.studentName)}
    ${dotLine('Class', d.className)}
    ${dotLine('Term', d.term)}
    ${dotLine('Method', d.payMethod.toUpperCase())}
    ${d.reference ? dotLine('Reference', d.reference) : ''}
    <div class="dash">${dashes}</div>
    <div class="section-hdr">FEE BREAKDOWN</div>
    ${d.feeLines.map(fl => dotLine(fl.name, FMT(fl.amount, d.currency))).join('')}
    ${d.openingArrears > 0 ? dotLine('Arrears B/F', FMT(d.openingArrears, d.currency)) : ''}
    <div class="dash">${dashes}</div>
    ${dotLine('Total Due', FMT(d.totalBill, d.currency))}
    <div class="paid-box">
      <span class="pb-lbl">AMOUNT PAID</span>
      <span class="pb-val">${FMT(d.amountPaid, d.currency)}</span>
    </div>
    <div class="bal ${d.finalBalance <= 0 ? 'ok' : 'ow'}">${d.finalBalance <= 0 ? '◆ ACCOUNT SETTLED ◆' : 'BALANCE: ' + FMT(d.finalBalance, d.currency)}</div>
    <div class="dash">${dashes}</div>
    <div class="foot">— Thank you for your prompt payment —</div>
    <div class="foot" style="margin-top:2px">${d.schoolName}</div>
    <div style="height:14mm"></div>
  </div>`

  const css = `
  @page{size:80mm auto;margin:0;}
  *{font-family:'IBM Plex Mono',monospace;font-size:9.5px;}
  .receipt{width:80mm;padding:4mm 3mm;}
  .hdr{display:flex;align-items:center;gap:6px;margin-bottom:6px;}
  .hdr-logo svg,.hdr-logo img{width:32px;height:32px;object-fit:contain;border-radius:4px;}
  .school-nm{font-family:'DM Sans',sans-serif;font-size:12px;font-weight:800;color:${t.accentDark};}
  .school-sub{font-size:7.5px;color:#64748b;}
  .center-title{text-align:center;font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;border-top:1.5px solid ${t.accentColor};border-bottom:1.5px solid ${t.accentColor};padding:3px 0;margin:5px 0;color:${t.accentColor};}
  .dash{font-size:8px;color:#e2e8f0;white-space:nowrap;overflow:hidden;margin:3px 0;}
  .dl{display:flex;align-items:baseline;margin:2px 0;}
  .dl-k{white-space:nowrap;font-size:9px;color:#334155;}
  .dl-dots{flex:1;border-bottom:1px dotted #cbd5e1;margin:0 3px 2px;}
  .dl-v{white-space:nowrap;font-size:9px;font-weight:700;color:#0f172a;}
  .section-hdr{font-size:8px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:${t.accentColor};margin:3px 0;}
  .paid-box{background:${t.accentColor};color:#fff;border-radius:6px;padding:6px;display:flex;justify-content:space-between;align-items:center;margin:6px 0;}
  .pb-lbl{font-size:8px;font-weight:700;letter-spacing:.08em;opacity:.85;}
  .pb-val{font-size:16px;font-weight:800;font-family:'DM Sans',sans-serif;}
  .bal{text-align:center;font-size:9.5px;font-weight:800;padding:4px;border-radius:4px;margin:4px 0;}
  .bal.ok{background:#dcfce7;color:#166534;}.bal.ow{background:#fef2f2;color:#991b1b;}
  .foot{text-align:center;font-size:8.5px;color:#94a3b8;}`

  const dupeDiv = copies === 'duplicate' ? `<div style="border-top:1px dashed #94a3b8;margin:4px 0;font-size:8px;text-align:center;padding:2px 0;color:#94a3b8;">✂ SCHOOL COPY ✂</div>${copyHTML('School Copy')}` : ''

  return `${baseHead('', css)}<body onload="setTimeout(()=>window.print(),600)">${copyHTML('Parent Copy')}${dupeDiv}</body></html>`
}

// ══════════════════════════════════════════════════════════════════════════════
// ── TEMPLATE REGISTRY ────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
export const RECEIPT_TEMPLATES: ReceiptTemplate[] = [
  // A4
  {
    id: 'a4-classic', name: 'Classic Letterhead', description: 'Timeless serif header with ruled fee table',
    paperSize: 'a4', get thumbnail() { return thumbA4Classic('#7c3aed') },
    generateHTML: genA4Classic,
  },
  {
    id: 'a4-modern', name: 'Modern Card', description: 'Gradient hero banner with card-style layout',
    paperSize: 'a4', get thumbnail() { return thumbA4Modern('#7c3aed') },
    generateHTML: genA4Modern,
  },
  {
    id: 'a4-minimal', name: 'Minimal Clean', description: 'Stripped-back, typography-first design',
    paperSize: 'a4', get thumbnail() { return thumbA4Minimal('#7c3aed') },
    generateHTML: genA4Minimal,
  },
  {
    id: 'a4-corporate', name: 'Corporate Stripe', description: 'Bold dark header with professional table',
    paperSize: 'a4', get thumbnail() { return thumbA4Corporate('#7c3aed') },
    generateHTML: genA4Corporate,
  },
  {
    id: 'a4-elegant', name: 'Elegant Serif', description: 'Playfair Display headings with ornamental frame',
    paperSize: 'a4', get thumbnail() { return thumbA4Elegant('#7c3aed') },
    generateHTML: genA4Elegant,
  },
  // A5
  {
    id: 'a5-compact', name: 'Compact Portrait', description: 'Dense A5 grid layout for fast printing',
    paperSize: 'a5', get thumbnail() { return thumbA5Compact('#7c3aed') },
    generateHTML: genA5Compact,
  },
  {
    id: 'a5-landscape-split', name: 'Landscape Split', description: 'Two halves on one A5 landscape sheet',
    paperSize: 'a5', get thumbnail() { return thumbA5LandscapeSplit('#7c3aed') },
    generateHTML: genA5LandscapeSplit,
  },
  {
    id: 'a5-bold', name: 'Bold Hero', description: 'Large gradient header with school name prominent',
    paperSize: 'a5', get thumbnail() { return thumbA5Bold('#7c3aed') },
    generateHTML: genA5Bold,
  },
  {
    id: 'a5-receipt-book', name: 'Receipt Book', description: 'Detachable stub at the bottom',
    paperSize: 'a5', get thumbnail() { return thumbA5ReceiptBook('#7c3aed') },
    generateHTML: genA5ReceiptBook,
  },
  // Thermal
  {
    id: 'thermal-clean', name: 'Clean Thermal', description: 'Standard POS-style clean receipt',
    paperSize: 'thermal', get thumbnail() { return thumbThermalClean('#7c3aed') },
    generateHTML: genThermalClean,
  },
  {
    id: 'thermal-branded', name: 'Branded Header', description: 'Circular logo with prominent school name',
    paperSize: 'thermal', get thumbnail() { return thumbThermalBranded('#7c3aed') },
    generateHTML: genThermalBranded,
  },
  {
    id: 'thermal-tabular', name: 'Tabular Dotted', description: 'Dotted leader lines for perfect alignment',
    paperSize: 'thermal', get thumbnail() { return thumbThermalTabular('#7c3aed') },
    generateHTML: genThermalTabular,
  },
]
