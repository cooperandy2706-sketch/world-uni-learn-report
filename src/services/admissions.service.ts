// src/services/admissions.service.ts
import { supabase } from '../lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export type BillCategory = 'books' | 'uniform' | 'admission_fee' | 'scholarship' | 'other'

export interface BillItem {
    id: string
    school_id: string
    class_id: string | null
    academic_year_id: string | null
    category: BillCategory
    item_name: string
    description?: string | null
    amount: number
    is_optional: boolean
    created_at?: string
    updated_at?: string
}

export interface Scholarship {
    id: string
    school_id: string
    name: string
    type: 'full' | 'partial'
    discount_pct?: number | null
    description?: string | null
    created_at?: string
}

export type EnquiryStatus = 'enquiry' | 'applied' | 'admitted' | 'rejected' | 'waitlisted'

export interface AdmissionEnquiry {
    id: string
    school_id: string
    student_name: string
    date_of_birth?: string | null
    gender?: string | null
    applying_class_id?: string | null
    parent_name: string
    parent_phone: string
    parent_email?: string | null
    parent_address?: string | null
    previous_school?: string | null
    reason_for_leaving?: string | null
    dismissed_from_prev: boolean
    scholarship_id?: string | null
    status: EnquiryStatus
    notes?: string | null
    created_at?: string
    updated_at?: string
    // joined
    classes?: { name: string } | null
    scholarships?: { name: string } | null
}

export type ApplicationStatus = 'pending' | 'reviewing' | 'admitted' | 'rejected' | 'deferred'

export interface AdmissionApplication {
    id: string
    school_id: string
    application_no: string
    student_first_name: string
    student_last_name: string
    date_of_birth?: string | null
    gender?: string | null
    nationality?: string | null
    religion?: string | null
    blood_group?: string | null
    applying_class_id?: string | null
    father_name?: string | null
    father_phone?: string | null
    father_email?: string | null
    father_occupation?: string | null
    mother_name?: string | null
    mother_phone?: string | null
    mother_email?: string | null
    mother_occupation?: string | null
    previous_school?: string | null
    previous_class?: string | null
    home_address?: string | null
    allergies?: string | null
    scholarship_id?: string | null
    status: ApplicationStatus
    created_at?: string
    updated_at?: string
    // joined
    classes?: { name: string } | null
    scholarships?: { name: string } | null
}

// ─── Bills Service ────────────────────────────────────────────────────────────

export const billsService = {
    /**
     * List bill items for a school, optionally filtered by class and/or academic year.
     */
    async list(
        schoolId: string,
        classId: string | null | undefined = undefined,
        academicYearId: string | null = null
    ) {
        let q = supabase
            .from('admission_bills')
            .select('*')
            .eq('school_id', schoolId)
            .order('category')
            .order('item_name')

        if (classId !== undefined) {
            if (classId === null) q = q.is('class_id', null)
            else q = q.eq('class_id', classId)
        }
        if (academicYearId) q = q.eq('academic_year_id', academicYearId)

        return q
    },

    /**
     * Upsert one or more bill items (insert or update by id).
     * Pass items without `id` to insert; with `id` to update.
     */
    async upsert(items: Partial<BillItem>[]) {
        return supabase
            .from('admission_bills')
            .upsert(items, { onConflict: 'id' })
            .select()
    },

    async delete(id: string) {
        return supabase.from('admission_bills').delete().eq('id', id)
    },

    /**
     * Fetch bills for a specific class PLUS any school-wide bills (class_id IS NULL).
     * Use this for the booklist / print flow.
     */
    async listForClass(
        schoolId: string,
        classId: string,
        academicYearId: string | null = null
    ) {
        let q = supabase
            .from('admission_bills')
            .select('*')
            .eq('school_id', schoolId)
            .or(`class_id.eq.${classId},class_id.is.null`)
            .order('category')
            .order('item_name')

        if (academicYearId) q = q.eq('academic_year_id', academicYearId)

        return q
    },
}

// ─── Scholarships Service ─────────────────────────────────────────────────────

export const scholarshipsService = {
    async list(schoolId: string) {
        return supabase
            .from('admission_scholarships')
            .select('*')
            .eq('school_id', schoolId)
            .order('name')
    },

    async upsert(scholarship: Partial<Scholarship>) {
        return supabase
            .from('admission_scholarships')
            .upsert(scholarship, { onConflict: 'id' })
            .select()
            .single()
    },

    async delete(id: string) {
        return supabase.from('admission_scholarships').delete().eq('id', id)
    },
}

// ─── Enquiries Service ────────────────────────────────────────────────────────

export const enquiriesService = {
    async list(schoolId: string, filters: { status?: EnquiryStatus } = {}) {
        let q = supabase
            .from('admission_enquiries')
            .select(`
        *,
        classes ( name ),
        scholarships:admission_scholarships ( name )
      `)
            .eq('school_id', schoolId)
            .order('created_at', { ascending: false })

        if (filters.status) q = q.eq('status', filters.status)

        return q
    },

    async create(data: Omit<AdmissionEnquiry, 'id' | 'created_at' | 'updated_at'>) {
        return supabase
            .from('admission_enquiries')
            .insert(data)
            .select()
            .single()
    },

    async update(id: string, data: Partial<AdmissionEnquiry>) {
        return supabase
            .from('admission_enquiries')
            .update({ ...data, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()
    },

    async delete(id: string) {
        return supabase.from('admission_enquiries').delete().eq('id', id)
    },
}

// ─── Applications Service ─────────────────────────────────────────────────────

export const applicationsService = {
    async list(schoolId: string, filters: { status?: ApplicationStatus } = {}) {
        let q = supabase
            .from('admission_applications')
            .select(`
        *,
        classes ( name ),
        scholarships:admission_scholarships ( name )
      `)
            .eq('school_id', schoolId)
            .order('created_at', { ascending: false })

        if (filters.status) q = q.eq('status', filters.status)

        return q
    },

    async create(data: Omit<AdmissionApplication, 'id' | 'application_no' | 'created_at' | 'updated_at'>) {
        // Generate application number: ADM-<year>-<random 4-digit>
        const year = new Date().getFullYear()
        const rand = Math.floor(1000 + Math.random() * 9000)
        const application_no = `ADM-${year}-${rand}`

        return supabase
            .from('admission_applications')
            .insert({ ...data, application_no })
            .select()
            .single()
    },

    async update(id: string, data: Partial<AdmissionApplication>) {
        return supabase
            .from('admission_applications')
            .update({ ...data, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()
    },

    async delete(id: string) {
        return supabase.from('admission_applications').delete().eq('id', id)
    },
}

// ─── School Supplies Service ──────────────────────────────────────────────────

export type SupplyCategory = 'textbook' | 'stationery' | 'uniform' | 'other'

export interface SchoolSupply {
    id: string
    school_id: string
    class_id: string | null
    academic_year_id: string | null
    category: SupplyCategory
    item_name: string
    description?: string | null
    quantity: number           // e.g. 1 copy, 2 notebooks
    unit: string               // e.g. "copy", "piece", "set", "pair"
    unit_price?: number | null // optional estimated price
    is_required: boolean
    supplier_note?: string | null  // e.g. "Available at school store"
    inventory_item_id?: string | null // Link to inventory
    created_at?: string
    updated_at?: string
    // joined
    classes?: { name: string } | null
}

export const suppliesService = {
    async list(
        schoolId: string,
        classId: string | null | undefined = undefined,
        academicYearId: string | null = null
    ) {
        let q = supabase
            .from('school_supplies')
            .select('*, classes(name)')
            .eq('school_id', schoolId)
            .order('category')
            .order('item_name')

        if (classId !== undefined) {
            if (classId === null) q = q.is('class_id', null)
            else q = q.eq('class_id', classId)
        }
        if (academicYearId) q = q.eq('academic_year_id', academicYearId)

        return q
    },
    
    // Explicit listAll for dashboard overview when no class is selected
    async listAll(schoolId: string, academicYearId: string | null = null) {
        let q = supabase
            .from('school_supplies')
            .select('*, classes(name)')
            .eq('school_id', schoolId)
            .order('category')
            .order('item_name')
        if (academicYearId) q = q.eq('academic_year_id', academicYearId)
        return q
    },

    async upsert(items: Partial<SchoolSupply>[]) {
        return supabase
            .from('school_supplies')
            .upsert(items, { onConflict: 'id' })
            .select()
    },

    async delete(id: string) {
        return supabase.from('school_supplies').delete().eq('id', id)
    },

    /**
     * Fetch supplies for a specific class PLUS school-wide supplies (class_id IS NULL).
     * This is the correct query to use when building a per-class booklist.
     * Uses a single Supabase OR filter instead of two separate calls.
     */
    async listForClass(
        schoolId: string,
        classId: string,
        academicYearId: string | null = null
    ) {
        let q = supabase
            .from('school_supplies')
            .select('*, classes(name)')
            .eq('school_id', schoolId)
            .or(`class_id.eq.${classId},class_id.is.null`)
            .order('category')
            .order('item_name')

        if (academicYearId) q = q.eq('academic_year_id', academicYearId)

        return q
    },
}