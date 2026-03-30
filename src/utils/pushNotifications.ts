// src/utils/pushNotifications.ts
import { supabase } from '../lib/supabase'

export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64: string) {
  const pad = '='.repeat((4 - base64.length % 4) % 4)
  const b64 = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export async function requestAndSubscribe(userId: string): Promise<'granted' | 'denied' | 'unsupported' | 'error'> {
  try {
    // 1. Browser support check
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      console.warn('[Push] Not supported in this browser')
      return 'unsupported'
    }

    // 2. Check VAPID key
    if (!VAPID_PUBLIC_KEY) {
      console.error('[Push] VITE_VAPID_PUBLIC_KEY is not set in environment variables')
      return 'error'
    }

    // 3. Request permission — this shows the browser popup
    const permission = await Notification.requestPermission()
    console.log('[Push] Permission:', permission)
    if (permission !== 'granted') return 'denied'

    // 4. Wait for SW to be ready
    const reg = await navigator.serviceWorker.ready
    console.log('[Push] SW ready:', reg.scope)

    // 5. Unsubscribe old subscription if exists
    const existing = await reg.pushManager.getSubscription()
    if (existing) {
      console.log('[Push] Removing old subscription')
      await existing.unsubscribe()
    }

    // 6. Subscribe with VAPID
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
    console.log('[Push] Subscribed:', sub.endpoint.slice(0, 50) + '...')

    const json = sub.toJSON()
    const keys = json.keys as any

    // 7. Save to Supabase
    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id:  userId,
      endpoint: sub.endpoint,
      p256dh:   keys.p256dh,
      auth:     keys.auth,
    }, { onConflict: 'endpoint' })

    if (error) {
      console.error('[Push] Save error:', error)
      return 'error'
    }

    console.log('[Push] Saved to database ✓')
    return 'granted'
  } catch (e: any) {
    console.error('[Push] Error:', e.message)
    return 'error'
  }
}

export async function isPushSubscribed(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator)) return false
    const reg = await navigator.serviceWorker.getRegistration()
    if (!reg) return false
    const sub = await reg.pushManager.getSubscription()
    return !!sub
  } catch { return false }
}

export async function unsubscribe(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    const sub = await reg?.pushManager.getSubscription()
    if (sub) {
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
      await sub.unsubscribe()
    }
  } catch (e) { console.error('[Push] Unsubscribe error:', e) }
}