// src/utils/testPush.ts
// Call this from browser console to test push: 
// import('/src/utils/testPush.ts').then(m => m.sendTestNotification())
import { supabase } from '../lib/supabase'

export async function sendTestNotification() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) { console.error('Not logged in'); return }

  console.log('Sending test push to user:', session.user.id)

  const { data, error } = await supabase.functions.invoke('send-push', {
    body: {
      user_id: session.user.id,
      title: '🔔 Test Notification',
      body: 'Push notifications are working! This is a test from WULA Reports.',
      url: '/teacher/notifications',
    }
  })

  console.log('Result:', data, error)
  return { data, error }
}