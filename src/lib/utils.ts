// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-GH', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-')
}

export function getEngagingGreeting(role: string = 'admin') {
  const hour = new Date().getHours()
  const morning = hour >= 5 && hour < 12
  const afternoon = hour >= 12 && hour < 17
  const evening = hour >= 17 && hour < 21
  // night is everything else

  const timeSlot = morning ? 'morning' : afternoon ? 'afternoon' : evening ? 'evening' : 'night'
  
  const greetings: Record<string, string[]> = {
    morning: ['Rise and shine', 'Top of the morning', 'Good morning', 'A fresh start today', 'Hello there', 'Morning energy'],
    afternoon: ['Good afternoon', 'Keeping productive?', 'Hope your day is great', 'Taking on the afternoon', 'Midday momentum'],
    evening: ['Good evening', 'Winding down?', 'Hope you had a productive day', 'Relax and recharge', 'Evening focus'],
    night: ['Burning the midnight oil?', 'Late night productivity', 'Quiet hours are here', 'Night owl mode active', 'Moonlight session']
  }

  const roleMessages: Record<string, string[]> = {
    admin: [
      'The control center is ready.',
      'Ready to steer the ship today?',
      'Operations are looking smooth.',
      'Leadership starts with a single click.'
    ],
    super_admin: [
      'Global oversight active.',
      'System-wide management ready.',
      'Platform stability confirmed.',
      'Empowering the entire ecosystem.'
    ],
    teacher: [
      'Ready to inspire some minds?',
      'Your virtual classroom is open.',
      'Time to make an impact.',
      'Knowledge is power, let\'s share it.'
    ],
    student: [
      'Learning mode: ON.',
      'One step closer to your goals.',
      'Ready for today\'s challenges?',
      'Your potential is limitless.'
    ],
    bursar: [
      'Financials at your fingertips.',
      'Keeping the books balanced.',
      'Transparency in every transaction.',
      'Value tracking active.'
    ],
    default: [
      'Welcome back to your dashboard.',
      'Everything is in place.',
      'Have a wonderful session.',
      'Ready to assist you.'
    ]
  }

  const roleKey = roleMessages[role] ? role : 'default'
  
  // Use day of the month + hour to get a pseudo-random index that stays stable for an hour
  const day = new Date().getDate()
  const timeGreetingIdx = (day + hour) % greetings[timeSlot].length
  const roleMessageIdx = (day + hour) % roleMessages[roleKey].length

  return {
    timeGreeting: greetings[timeSlot][timeGreetingIdx],
    roleMessage: roleMessages[roleKey][roleMessageIdx]
  }
}