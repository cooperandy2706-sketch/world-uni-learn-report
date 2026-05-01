import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm } from '../../hooks/useSettings'
import { billSheetService } from '../../services/bursar.service'
import { Wallet, Receipt, CreditCard, Download, Clock, Info, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import toast from 'react-hot-toast'

export default function StudentBillingPage() {
  const { user } = useAuth()
  const { data: term } = useCurrentTerm()
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<any>(null)
  const [billData, setBillData] = useState<any>(null)
  const [showHistory, setShowHistory] = useState(true)

  useEffect(() => {
    if (user?.id && term?.id) loadBilling()
  }, [user?.id, term?.id])

  async function loadBilling() {
    setLoading(true)
    try {
      const { data: s } = await supabase
        .from('students')
        .select('id, full_name, student_id, class_id, school_id, school:schools(*)')
        .eq('user_id', user!.id)
        .single()
      
      if (s && term?.id) {
        setStudent(s)
        const data = await billSheetService.getStudentBillData(s.id, term.id, s.school_id)
        setBillData(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const downloadReceipt = (payment: any) => {
    const doc = new jsPDF()
    const school = student.school
    
    // Header
    doc.setFontSize(20); doc.setTextColor(30, 27, 75); doc.text(school.name || 'School Name', 105, 20, { align: 'center' })
    doc.setFontSize(10); doc.setTextColor(100); doc.text(school.address || 'School Address', 105, 26, { align: 'center' })
    doc.text(`Phone: ${school.phone || 'N/A'} | Email: ${school.email || 'N/A'}`, 105, 31, { align: 'center' })
    
    doc.setDrawColor(240); doc.line(20, 38, 190, 38)
    
    // Title
    doc.setFontSize(16); doc.setTextColor(30, 27, 75); doc.text('OFFICIAL PAYMENT RECEIPT', 105, 50, { align: 'center' })
    
    // Receipt Info
    doc.setFontSize(10); doc.setTextColor(0);
    doc.text(`Receipt No: #${payment.id.slice(0, 8).toUpperCase()}`, 20, 65)
    doc.text(`Date: ${new Date(payment.payment_date).toLocaleDateString()}`, 190, 65, { align: 'right' })
    
    // Student Info
    doc.setFillColor(248, 250, 252); doc.rect(20, 75, 170, 25, 'F')
    doc.text('BILL TO:', 25, 82)
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.text(student.full_name, 25, 89)
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.text(`ID: ${student.student_id} | Class: ${student.class?.name}`, 25, 94)
    
    // Details Table
    const tableData = [[
      'Fee Description', 
      payment.payment_method?.toUpperCase() || 'CASH', 
      `GH₵ ${payment.amount.toLocaleString()}`
    ]]
    
    ;(doc as any).autoTable({
      startY: 110,
      head: [['Description', 'Method', 'Amount']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillStyle: [76, 29, 149], textColor: 255 },
      styles: { fontSize: 10 }
    })
    
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.text(`TOTAL PAID: GH₵ ${payment.amount.toLocaleString()}`, 190, finalY, { align: 'right' })
    
    // Footer
    doc.setFontSize(8); doc.setFont('helvetica', 'italic'); doc.setTextColor(150);
    doc.text('This is a computer-generated receipt. No signature required.', 105, 280, { align: 'center' })
    
    doc.save(`Receipt_${payment.id.slice(0, 8)}.pdf`)
    toast.success('Receipt downloaded')
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2.5px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_ssp 0.8s linear infinite' }} />
      <style>{`@keyframes _ssp { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ fontFamily: '"DM Sans", sans-serif', paddingBottom: 40 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        
        .billing-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 24px;
        }

        @media (max-width: 1024px) {
          .billing-grid {
            grid-template-columns: 1fr;
          }
          .billing-sidebar {
            order: -1;
          }
        }

        @media (max-width: 640px) {
          .billing-header h1 { font-size: 24px !important; }
          .billing-card-padding { padding: 16px !important; }
          .billing-table th, .billing-table td { padding: 12px 0 !important; }
          .balance-amount { font-size: 36px !important; }
          .balance-card { padding: 24px !important; }
        }

        .billing-card {
          background: #fff;
          border-radius: 24px;
          border: 1.5px solid #f1f5f9;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
          transition: transform 0.2s;
        }
        
        .billing-table {
          width: 100%;
          border-collapse: collapse;
        }
      `}</style>

      <div className="billing-header" style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 }}>Fees & Billing</h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>View your payment history and manage school fees.</p>
      </div>

      <div className="billing-grid">
        
        {/* Left Column: Detailed Statement */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Fee Statement Card */}
          <div className="billing-card">
            <div className="billing-card-padding" style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafbff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={20} color="#7c3aed" />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Term Fee Statement</h3>
                  <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>{term?.name} Breakdown</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#6d28d9', background: '#ede9fe', padding: '4px 12px', borderRadius: 99, textTransform: 'uppercase' }}>
                  {billData?.summary.balance > 0 ? 'Payment Required' : 'Cleared'}
                </span>
              </div>
            </div>

            <div className="billing-card-padding" style={{ padding: '0 24px' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="billing-table">
                  <thead>
                    <tr style={{ textAlign: 'left' }}>
                      <th style={{ padding: '16px 0', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</th>
                      <th style={{ padding: '16px 0', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Previous Arrears */}
                    {billData?.arrears > 0 && (
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 0' }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#ef4444' }}>Previous Balance (Arrears)</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>Brought forward from previous terms</div>
                        </td>
                        <td style={{ padding: '14px 0', textAlign: 'right', fontSize: 14, fontWeight: 700, color: '#ef4444' }}>
                          GH₵ {billData.arrears.toLocaleString()}
                        </td>
                      </tr>
                    )}

                    {/* Fee Structures */}
                    {billData?.structures.map((f: any) => (
                      <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 0' }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>{f.fee_name}</div>
                        </td>
                        <td style={{ padding: '14px 0', textAlign: 'right', fontSize: 14, fontWeight: 700, color: '#334155' }}>
                          GH₵ {f.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}

                    {/* Scholarship */}
                    {billData?.scholarship.discount > 0 && (
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 0' }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}>
                            Scholarship Discount ({billData.scholarship.percentage}%)
                          </div>
                        </td>
                        <td style={{ padding: '14px 0', textAlign: 'right', fontSize: 14, fontWeight: 700, color: '#059669' }}>
                          - GH₵ {billData.scholarship.discount.toLocaleString()}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Subtotal of Charges */}
            <div className="billing-card-padding" style={{ padding: '20px 24px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Total Term Charges</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>GH₵ {billData?.summary.totalCharges.toLocaleString()}</span>
            </div>

            {/* Payment Summary */}
            <div className="billing-card-padding" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>Payments Applied</h4>
                <button onClick={() => setShowHistory(!showHistory)} style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {showHistory ? 'Hide' : 'Show'} History
                </button>
              </div>

              {showHistory && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {billData?.payments.length === 0 ? (
                    <div style={{ padding: '12px', textAlign: 'center', border: '1px dashed #e2e8f0', borderRadius: 12, fontSize: 12, color: '#94a3b8' }}>No payments recorded this term</div>
                  ) : billData?.payments.map((p: any) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#065f46' }}>Payment received</div>
                          <div style={{ fontSize: 10, color: '#059669', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{new Date(p.payment_date).toLocaleDateString()} · {p.payment_method}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#065f46' }}>GH₵ {p.amount_paid.toLocaleString()}</div>
                        <button onClick={() => downloadReceipt(p)} style={{ fontSize: 9, fontWeight: 800, color: '#059669', background: 'none', border: 'none', padding: 0, textDecoration: 'underline', cursor: 'pointer' }}>Receipt →</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #f1f5f9', paddingTop: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Total Amount Paid</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#16a34a' }}>GH₵ {billData?.summary.totalPaid.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Balance Summary Card */}
        <div className="billing-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          <div className="balance-card" style={{ 
            background: 'linear-gradient(135deg, #1e1b4b, #312e81)', 
            borderRadius: 24, 
            padding: 32, 
            color: '#fff',
            boxShadow: '0 20px 40px rgba(30,27,75,0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', right: -20, top: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, opacity: 0.8 }}>
              <Wallet size={20} color="#a5b4fc" />
              <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Current Balance</span>
            </div>

            <div className="balance-amount" style={{ fontSize: 44, fontWeight: 900, fontFamily: 'monospace', marginBottom: 12, lineHeight: 1 }}>
              GH₵ {billData?.summary.balance.toLocaleString()}
            </div>

            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 8, 
              padding: '6px 14px', 
              borderRadius: 99, 
              background: billData?.summary.balance > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              border: `1px solid ${billData?.summary.balance > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              fontSize: 12,
              fontWeight: 700,
              color: billData?.summary.balance > 0 ? '#fca5a5' : '#6ee7b7'
            }}>
              {billData?.summary.balance > 0 ? '⚠️ Payment Required' : '✅ Fully Paid'}
            </div>

            <div style={{ marginTop: 32, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20 }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '0 0 12px' }}>Student Identification</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👤</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student?.full_name}</div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>ID: {student?.student_id}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="billing-card" style={{ padding: 24 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Info size={16} color="#7c3aed" /> Payment Methods
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
                Payments can be made at the Bursary office or via Mobile Money. Please ensure you receive a receipt for every payment.
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <div style={{ flex: 1, padding: '10px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: 10, fontWeight: 700 }}>💵 CASH</div>
                <div style={{ flex: 1, padding: '10px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: 10, fontWeight: 700 }}>📱 MOMO</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

