// src/services/payment.service.ts

/**
 * Service to handle Paystack payment integration
 */
export const paymentService = {
  /**
   * Load Paystack Inline script
   */
  loadPaystackScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if ((window as any).PaystackPop) {
        resolve(true)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://js.paystack.co/v1/inline.js'
      script.async = true
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  },

  /**
   * Initialize Paystack Payment
   */
  async payWithPaystack(options: {
    email: string
    amount: number
    publicKey: string
    reference: string
    subaccount?: string
    metadata?: any
    onSuccess: (response: any) => void
    onClose: () => void
  }) {
    const isLoaded = await this.loadPaystackScript()
    if (!isLoaded) {
      alert('Failed to load payment gateway. Please check your internet connection.')
      return
    }

    const handler = (window as any).PaystackPop.setup({
      key: options.publicKey,
      email: options.email,
      amount: Math.round(options.amount * 100), // Paystack works in kobo/pesewas
      ref: options.reference,
      subaccount: options.subaccount || undefined,
      metadata: options.metadata || {},
      callback: (response: any) => {
        options.onSuccess(response)
      },
      onClose: () => {
        options.onClose()
      },
    })

    handler.openIframe()
  },

  /**
   * Call Supabase Edge Function to verify payment reference
   */
  async verifyPaymentOnServer(reference: string, studentId: string, termId: string, schoolId: string) {
    const { supabase } = await import('../lib/supabase')
    const { data, error } = await supabase.functions.invoke('verify-payment', {
      body: { reference, student_id: studentId, term_id: termId, school_id: schoolId }
    })
    
    if (error) throw error
    return data
  }
}
