// src/services/bursar.service.ts
import { supabase } from '../lib/supabase'

// ── Fee Structures ─────────────────────────────────────────────────
export const feeStructuresService = {
  async getAll(schoolId: string, termId?: string) {
    let q = supabase
      .from('fee_structures')
      .select('*, class:classes(id,name), term:terms(id,name)')
      .eq('school_id', schoolId)
      .order('class(name)')
    if (termId) q = q.eq('term_id', termId)
    return q
  },
  async create(data: any) {
    return supabase.from('fee_structures').insert(data).select().single()
  },
  async update(id: string, data: any) {
    return supabase.from('fee_structures').update(data).eq('id', id).select().single()
  },
  async delete(id: string) {
    return supabase.from('fee_structures').delete().eq('id', id)
  },
}

// ── Fee Payments ───────────────────────────────────────────────────
export const feePaymentsService = {
  async getAll(schoolId: string, termId?: string) {
    let q = supabase
      .from('fee_payments')
      .select('*, student:students(id, full_name, student_id, fees_arrears, class:classes(id,name)), fee_structure:fee_structures(id,fee_name,amount)')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
    if (termId) q = q.eq('term_id', termId)
    return q
  },

  /**
   * Smart Payment Recording with Automatic Arrears Allocation
   * ─────────────────────────────────────────────────────────
   * 1. Fetches student's current fees_arrears
   * 2. If arrears > 0, allocates payment toward arrears FIRST
   * 3. Reduces student's fees_arrears in the DB
   * 4. Records how much went to arrears vs current in the payment row
   * 5. Returns the payment record + allocation breakdown
   */
  async createWithAllocation(data: any): Promise<{
    payment: any
    allocation: {
      totalPaid: number
      arrearsPaid: number
      currentTermPaid: number
      previousArrears: number
      remainingArrears: number
      arrearsCleared: boolean
    }
  }> {
    const studentId = data.student_id
    const amountPaid = Number(data.amount_paid)

    // Step 1: Get student's current arrears
    const { data: student } = await supabase
      .from('students')
      .select('fees_arrears')
      .eq('id', studentId)
      .single()

    const previousArrears = Number(student?.fees_arrears || 0)

    // Step 2: Calculate allocation — arrears are paid FIRST
    const arrearsPaid = Math.min(amountPaid, Math.max(0, previousArrears))
    const currentTermPaid = amountPaid - arrearsPaid
    const remainingArrears = Math.max(0, previousArrears - arrearsPaid)
    const arrearsCleared = previousArrears > 0 && remainingArrears === 0

    // Step 3: Reduce student's arrears in DB
    if (arrearsPaid > 0) {
      await supabase
        .from('students')
        .update({ fees_arrears: remainingArrears })
        .eq('id', studentId)
    }

    // Step 4: Insert payment record with allocation data
    const paymentData = {
      ...data,
      arrears_paid: arrearsPaid,
      arrears_balance_after: remainingArrears,
    }

    const { data: payment, error } = await supabase
      .from('fee_payments')
      .insert(paymentData)
      .select()
      .single()

    if (error) throw error

    return {
      payment,
      allocation: {
        totalPaid: amountPaid,
        arrearsPaid,
        currentTermPaid,
        previousArrears,
        remainingArrears,
        arrearsCleared,
      },
    }
  },

  /** Legacy create without allocation (fallback) */
  async create(data: any) {
    return supabase.from('fee_payments').insert(data).select().single()
  },

  async delete(id: string) {
    // When deleting a payment, we need to restore the balance
    const { data: payment } = await supabase
      .from('fee_payments')
      .select('student_id, term_id, amount_paid, arrears_paid, school_id')
      .eq('id', id)
      .single()

    if (payment) {
      // Get the current term for this school
      const { data: currentTerm } = await supabase
        .from('terms')
        .select('id')
        .eq('school_id', payment.school_id)
        .eq('is_current', true)
        .maybeSingle()

      // If the payment belongs to a past term, its FULL amount was rolled over into the current arrears.
      // If it belongs to the current term, only the portion marked as 'arrears_paid' affected the student.fees_arrears field.
      const isPastTerm = currentTerm && payment.term_id !== currentTerm.id
      const amountToRestore = isPastTerm ? Number(payment.amount_paid) : Number(payment.arrears_paid)

      if (amountToRestore !== 0) {
        const { data: student } = await supabase
          .from('students')
          .select('fees_arrears')
          .eq('id', payment.student_id)
          .single()

        const currentArrears = Number(student?.fees_arrears || 0)
        await supabase
          .from('students')
          .update({ fees_arrears: currentArrears + amountToRestore })
          .eq('id', payment.student_id)
      }
    }

    return supabase.from('fee_payments').delete().eq('id', id)
  },

  // Returns aggregated paid amounts per student per term
  async getSummaryByClass(classId: string, termId: string) {
    return supabase
      .from('fee_payments')
      .select('student_id, amount_paid')
      .eq('term_id', termId)
      .in('student_id',
        supabase.from('students').select('id').eq('class_id', classId).eq('is_active', true) as any
      )
  },
}

// ── Staff Payroll ──────────────────────────────────────────────────
export const payrollService = {
  async getAll(schoolId: string, month: string) {
    return supabase
      .from('staff_payroll')
      .select('*, user:users(id, full_name, email, role, phone)')
      .eq('school_id', schoolId)
      .eq('month', month)
      .order('created_at')
  },
  async upsert(data: any) {
    return supabase
      .from('staff_payroll')
      .upsert(data, { onConflict: 'school_id,user_id,month' })
      .select()
      .single()
  },
  async markPaid(id: string, paidDate: string, paymentDetails?: {
    payment_method?: string
    bank_name?: string
    bank_reference?: string
    momo_number?: string
    momo_network?: string
  }) {
    return supabase
      .from('staff_payroll')
      .update({
        is_paid: true,
        paid_date: paidDate,
        payment_method: paymentDetails?.payment_method ?? 'cash',
        bank_name: paymentDetails?.bank_name ?? null,
        bank_reference: paymentDetails?.bank_reference ?? null,
        momo_number: paymentDetails?.momo_number ?? null,
        momo_network: paymentDetails?.momo_network ?? null,
      })
      .eq('id', id)
      .select('*, user:users(id, full_name, email, role, phone)')
      .single()
  },
  async delete(id: string) {
    return supabase.from('staff_payroll').delete().eq('id', id)
  },

  // ── Adjustments ──────────────────────────────────────────────────
  async getAdjustments(userId: string, month: string, type?: string) {
    let q = supabase
      .from('payroll_adjustments')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .order('recorded_at')
    if (type) q = q.eq('type', type)
    return q
  },
  async getAdjustmentsBySchoolMonth(schoolId: string, month: string, types?: string[]) {
    let q = supabase
      .from('payroll_adjustments')
      .select('*, user:users(id, full_name, email, role, phone)')
      .eq('school_id', schoolId)
      .eq('month', month)
      .order('recorded_at', { ascending: false })
    if (types && types.length > 0) q = q.in('type', types)
    return q
  },
  async saveAdjustment(data: any) {
    return supabase.from('payroll_adjustments').upsert(data).select().single()
  },
  async markAdjPaid(id: string, paidDate: string, paymentDetails?: {
    payment_method?: string
    bank_name?: string
    bank_reference?: string
    momo_number?: string
    momo_network?: string
  }) {
    return supabase
      .from('payroll_adjustments')
      .update({
        is_paid: true,
        paid_date: paidDate,
        payment_method: paymentDetails?.payment_method ?? 'cash',
        bank_name: paymentDetails?.bank_name ?? null,
        bank_reference: paymentDetails?.bank_reference ?? null,
        momo_number: paymentDetails?.momo_number ?? null,
        momo_network: paymentDetails?.momo_network ?? null,
      })
      .eq('id', id)
      .select()
      .single()
  },
  async deleteAdjustment(id: string) {
    return supabase.from('payroll_adjustments').delete().eq('id', id)
  },

  // ── Weekly / Daily Config ─────────────────────────────────────────
  async getWeeklyConfig(schoolId: string, month: string) {
    return supabase
      .from('payroll_weekly_config')
      .select('*, user:users(id, full_name, role)')
      .eq('school_id', schoolId)
      .eq('month', month)
  },
  async upsertWeeklyConfig(data: any) {
    return supabase
      .from('payroll_weekly_config')
      .upsert(data, { onConflict: 'school_id,user_id,month' })
      .select()
      .single()
  },

  // ── Analytics ──────────────────────────────────────────────────────
  async getMonthlyAnalytics(schoolId: string, year: string) {
    return supabase
      .from('staff_payroll')
      .select('month, basic_salary, allowances, deductions, is_paid, user:users(id, full_name)')
      .eq('school_id', schoolId)
      .gte('month', `${year}-01`)
      .lte('month', `${year}-12`)
      .order('month')
  },
}

// ── Income Records ─────────────────────────────────────────────────
export const incomeService = {
  async getAll(schoolId: string, year?: number) {
    let q = supabase
      .from('income_records')
      .select('*')
      .eq('school_id', schoolId)
      .order('date', { ascending: false })
    if (year) {
      q = q.gte('date', `${year}-01-01`).lte('date', `${year}-12-31`)
    }
    return q
  },
  async create(data: any) {
    return supabase.from('income_records').insert(data).select().single()
  },
  async delete(id: string) {
    return supabase.from('income_records').delete().eq('id', id)
  },
}

// ── Expense Records ────────────────────────────────────────────────
export const expenseService = {
  async getAll(schoolId: string, year?: number) {
    let q = supabase
      .from('expense_records')
      .select('*')
      .eq('school_id', schoolId)
      .order('date', { ascending: false })
    if (year) {
      q = q.gte('date', `${year}-01-01`).lte('date', `${year}-12-31`)
    }
    return q
  },
  async create(data: any) {
    return supabase.from('expense_records').insert(data).select().single()
  },
  async delete(id: string) {
    return supabase.from('expense_records').delete().eq('id', id)
  },
}

// ── Daily Fees & Collections ───────────────────────────────────────
export const dailyFeesService = {
  // Config
  async getConfig(schoolId: string, termId: string) {
    return supabase.from('daily_fee_class_rates').select('*').eq('school_id', schoolId).eq('term_id', termId)
  },
  async upsertConfig(data: any[]) {
    return supabase.from('daily_fee_class_rates').upsert(data, { onConflict: 'school_id,term_id,class_id' }).select()
  },
  
  // Collectors
  async getCollectors(schoolId: string) {
    return supabase.from('daily_fee_collectors').select('*, teacher:teachers(id, user:users(id, full_name, email))').eq('school_id', schoolId)
  },
  async addCollector(data: any) {
    return supabase.from('daily_fee_collectors').insert(data).select().single()
  },
  async removeCollector(id: string) {
    return supabase.from('daily_fee_collectors').delete().eq('id', id)
  },
  async isTeacherCollector(userId: string) {
    const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', userId).maybeSingle()
    if (!teacher) return null
    return supabase.from('daily_fee_collectors').select('*').eq('teacher_id', teacher.id).maybeSingle()
  },

  // Collections
  async getCollectionsByDate(schoolId: string, termId: string, date: string) {
    return supabase.from('daily_fees_collected').select('*, student:students(id, full_name, class_id), collector:users(full_name)').eq('school_id', schoolId).eq('term_id', termId).eq('date', date)
  },
  async getCollectionsForStudent(studentId: string, termId: string) {
    return supabase.from('daily_fees_collected').select('*').eq('student_id', studentId).eq('term_id', termId)
  },
  async recordCollection(data: any) {
    return supabase.from('daily_fees_collected').insert(data).select().single()
  },
  async deleteCollection(id: string) {
    return supabase.from('daily_fees_collected').delete().eq('id', id)
  }
}

// ── Scholarship & Arrears Management ──────────────────────────────
export const scholarshipService = {
  async updateStudent(studentId: string, scholarshipType: string, scholarshipPercentage: number) {
    return supabase
      .from('students')
      .update({ scholarship_type: scholarshipType, scholarship_percentage: scholarshipPercentage })
      .eq('id', studentId)
      .select()
      .single()
  },
  async getScholarshipStudents(schoolId: string) {
    return supabase
      .from('students')
      .select('id, full_name, student_id, scholarship_type, scholarship_percentage, class:classes(id,name)')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .neq('scholarship_type', 'none')
      .order('full_name')
  },
  async updateStudentArrears(studentId: string, amount: number) {
    return supabase.from('students').update({ fees_arrears: amount }).eq('id', studentId).select().single()
  },
  async rolloverTermArrears(schoolId: string, termId: string) {
    const { data: students } = await supabase.from('students').select('id').eq('school_id', schoolId).eq('is_active', true)
    if (!students) return []
    const updates = await Promise.all(students.map(async (s) => {
      const bill = await billSheetService.getStudentBillData(s.id, termId, schoolId)
      return { id: s.id, fees_arrears: bill.summary.balance }
    }))
    await Promise.all(updates.map(u => supabase.from('students').update({ fees_arrears: u.fees_arrears }).eq('id', u.id)))
    return updates
  }
}

// ── Bill Sheet Aggregation ─────────────────────────────────────
export const billSheetService = {
  async getStudentBillData(studentId: string, termId: string, schoolId: string) {
    const resData = await Promise.all([
      supabase.from('students').select('*, class:classes(id,name)').eq('id', studentId).single(),
      supabase.from('fee_structures').select('*').eq('school_id', schoolId).eq('term_id', termId),
      supabase.from('fee_payments').select('*, fee_structure:fee_structures(fee_name)').eq('student_id', studentId).eq('term_id', termId).order('payment_date', { ascending: false }),
      supabase.from('daily_fee_class_rates').select('*').eq('school_id', schoolId).eq('term_id', termId),
      supabase.from('daily_fees_collected').select('*').eq('student_id', studentId).eq('term_id', termId),
      supabase.from('attendance').select('days_present').eq('student_id', studentId).eq('term_id', termId).maybeSingle(),
    ])

    const [studentRes, structuresRes, paymentsRes, dailyConfigRes, dailyCollectionsRes, attendanceRes] = resData as any

    const student = studentRes.data
    const structures = (structuresRes.data ?? []).filter((s: any) => !student?.class_id || s.class_id === student.class_id)
    const payments = paymentsRes.data ?? []
    const dailyConfigs = dailyConfigRes.data ?? []
    const dailyCollections = dailyCollectionsRes.data ?? []
    const attendanceRecord = attendanceRes?.data

    // Tuition fees - split by discountable status
    const discountableTuition = structures
      .filter((f: any) => f.is_discountable !== false)
      .reduce((s: number, f: any) => s + (f.amount || 0), 0)
    
    const nonDiscountableTuition = structures
      .filter((f: any) => f.is_discountable === false)
      .reduce((s: number, f: any) => s + (f.amount || 0), 0)

    const totalTuition = discountableTuition + nonDiscountableTuition
    const scholarshipPct = student?.scholarship_percentage || 0
    const scholarshipDiscount = discountableTuition * (scholarshipPct / 100)
    const netTuition = totalTuition - scholarshipDiscount

    // Daily fees expected
    const classConfig = dailyConfigs.find((c: any) => c.class_id === student?.class_id)
    const feeMode = student?.daily_fee_mode || 'all'
    const baseFeedingRate = classConfig?.expected_feeding_fee || 0
    const baseStudiesRate = classConfig?.expected_studies_fee || 0
    
    const feedingRate = feeMode === 'none' ? 0 : baseFeedingRate
    const studiesRate = (feeMode === 'none' || feeMode === 'feeding') ? 0 : baseStudiesRate

    const daysPresent = attendanceRecord?.days_present || 0
    const expectedFeeding = feedingRate * daysPresent
    const expectedStudies = studiesRate * daysPresent

    // Daily fees paid
    const feedingPaid = dailyCollections.filter((c: any) => c.fee_type === 'feeding').reduce((s: number, c: any) => s + Number(c.amount), 0)
    const studiesPaid = dailyCollections.filter((c: any) => c.fee_type === 'studies').reduce((s: number, c: any) => s + Number(c.amount), 0)

    // Tuition payments (includes both arrears and current term payments)
    const tuitionPaid = payments.reduce((s: number, p: any) => s + (p.amount_paid || 0), 0)

    // Arrears — reconstruct the opening arrears balance for THIS specific term.
    //
    // ⚠️  DO NOT use student.fees_arrears directly here. That field is a single
    //     mutable number representing the student's CURRENT live arrears balance.
    //     It becomes wrong for historical terms because later payments have already
    //     reduced it, making the bill for an old term show inflated or incorrect arrears.
    //
    // CORRECT approach: read the opening arrears from the payment history.
    //   • Sort term payments by date (ascending) → first payment.
    //   • openingArrears = firstPayment.arrears_paid + firstPayment.arrears_balance_after
    //     (= the arrears balance that existed BEFORE the first payment of this term)
    //   • If there are no payments this term: fall back to student.fees_arrears
    //     (only safe for the current / most-recent open term).
    let startingArrears = 0
    if (payments.length > 0) {
      // Sort ascending by payment_date to find the earliest payment this term.
      const sortedPayments = [...payments].sort(
        (a: any, b: any) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime()
      )
      const firstPayment = sortedPayments[0]
      // The arrears balance BEFORE the first payment = arrears_paid + arrears_balance_after
      startingArrears = Number(firstPayment.arrears_paid || 0) + Number(firstPayment.arrears_balance_after || 0)
    } else {
      // No payments yet this term — use the current live balance.
      // This is only accurate for the current/open term; for old closed terms
      // with no payments the arrears would genuinely be 0.
      startingArrears = Number(student?.fees_arrears || 0)
    }

    // Totals
    const totalCharges = startingArrears + netTuition + expectedFeeding + expectedStudies
    const totalPaid = tuitionPaid + feedingPaid + studiesPaid
    const balance = totalCharges - totalPaid

    return {
      student,
      structures,
      payments,
      dailyConfig: classConfig,
      arrears: startingArrears,
      scholarship: { type: student?.scholarship_type || 'none', percentage: scholarshipPct, discount: scholarshipDiscount },
      tuition: { total: totalTuition, discount: scholarshipDiscount, net: netTuition, paid: tuitionPaid, owed: Math.max(0, netTuition - tuitionPaid) },
      dailyFees: {
        feeding: { rate: feedingRate, days: daysPresent, expected: expectedFeeding, paid: feedingPaid, owed: Math.max(0, expectedFeeding - feedingPaid) },
        studies: { rate: studiesRate, days: daysPresent, expected: expectedStudies, paid: studiesPaid, owed: Math.max(0, expectedStudies - studiesPaid) },
      },
      summary: { totalCharges, totalPaid, balance: balance, status: balance <= 0 ? 'paid' : tuitionPaid + feedingPaid + studiesPaid > 0 ? 'partial' : 'unpaid' },
    }
  },
}
