// src/utils/pushNotifications.ts
// Handles browser push subscription and sending
import { supabase } from '../lib/supabase'

// Your VAPID public key — replace after generating
export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

export async function subscribeToPush(userId: string): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push not supported')
      return false
    }

    // Request permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false

    // Register service worker
    const reg = await navigator.serviceWorker.register('/sw.js')
    await reg.update()

    // Subscribe
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })

    const subJson = sub.toJSON()
    const keys = subJson.keys as any

    // Save to Supabase
    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    }, { onConflict: 'endpoint' })

    if (error) { console.error('Push save error:', error); return false }
    console.log('Push subscription saved')
    return true
  } catch (e) {
    console.error('Push subscribe error:', e)
    return false
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration()
  if (!reg) return
  const sub = await reg.pushManager.getSubscription()
  if (sub) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
    await sub.unsubscribe()
  }
}

export async function isPushSubscribed(): Promise<boolean> {
  const reg = await navigator.serviceWorker.getRegistration()
  if (!reg) return false
  const sub = await reg.pushManager.getSubscription()
  return !!sub
}