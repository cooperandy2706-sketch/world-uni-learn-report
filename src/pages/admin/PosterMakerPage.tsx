// src/pages/admin/PosterMakerPage.tsx
import { useState, useRef, useCallback, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import html2canvas from 'html2canvas'
import {
  Printer, Settings, AlignLeft, AlignCenter, AlignRight,
  Plus, Trash2, Copy, Image as ImageIcon, Tag, Move,
  ChevronUp, ChevronDown, Grid, Users, Layout, Download,
  RotateCcw, Layers, FileText, Star, Zap, BookOpen,
  Trophy, Calendar, Music, ChevronLeft, ChevronRight, Eye,
  Share2, Save, FolderOpen, Megaphone, AlertTriangle,
  Gift, Award, Heart, BookMarked, GraduationCap, Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type Orientation = 'landscape' | 'portrait'
type TextAlign = 'left' | 'center' | 'right'
type ElementType = 'title' | 'subtitle' | 'body' | 'footer' | 'image' | 'shape'
type TagStyle = 'lanyard' | 'badge' | 'sticker' | 'tent'

interface PosterElement {
  id: string
  type: ElementType
  content: string
  x: number
  y: number
  width: number
  fontSize: number
  fontFamily: string
  color: string
  bold: boolean
  italic: boolean
  align: TextAlign
  bgColor: string
  borderColor: string
  borderWidth: number
  opacity: number
  imageUrl?: string
  zIndex: number
  locked: boolean
}

interface TagSide {
  bgColor: string
  primaryColor: string
  accentColor: string
  showLogo: boolean
  showName: boolean
  showRole: boolean
  showClass: boolean
  showStudentId: boolean
  showBarcode: boolean
  showPhoto: boolean
  customText: string
  pattern: 'none' | 'dots' | 'lines' | 'diagonal'
}

interface TagConfig {
  style: TagStyle
  orientation: 'portrait' | 'landscape'
  width: number
  height: number
  fontFamily: string
  logoUrl: string
  schoolName: string
  cornerRadius: number
  front: TagSide
  back: TagSide
}

interface Student {
  id: string
  studentId?: string
  name: string
  role: string
  className: string
  photoUrl?: string
}

type ActiveTab = 'poster' | 'tags' | 'flyer'

// ─────────────────────────────────────────────
// Templates
// ─────────────────────────────────────────────
interface PosterTemplate {
  id: string
  name: string
  icon: any
  category: string
  orientation: Orientation
  bgColor: string
  primaryColor: string
  accentColor: string
  borderStyle: string
  borderWidth: number
  showDecorations: boolean
  elements: Omit<PosterElement, 'id'>[]
}

const POSTER_TEMPLATES: PosterTemplate[] = [
  {
    id: 'election',
    name: 'Elections',
    icon: Star,
    category: 'School Events',
    orientation: 'landscape',
    bgColor: '#f8fafc',
    primaryColor: '#6d28d9',
    accentColor: '#f59e0b',
    borderStyle: 'solid',
    borderWidth: 15,
    showDecorations: true,
    elements: [
      { type: 'title', content: '2025 PREFECTORIAL ELECTIONS', x: 50, y: 38, width: 82, fontSize: 52, fontFamily: "'Inter', sans-serif", color: '#6d28d9', bold: true, italic: false, align: 'center', bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
      { type: 'subtitle', content: 'VOTING CENTER', x: 50, y: 56, width: 38, fontSize: 26, fontFamily: "'Inter', sans-serif", color: '#1e293b', bold: true, italic: false, align: 'center', bgColor: '#f59e0b', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 3, locked: false },
      { type: 'body', content: 'Please have your student ID ready. Ensure a peaceful and fair electoral process.', x: 50, y: 72, width: 70, fontSize: 16, fontFamily: "'Inter', sans-serif", color: '#334155', bold: false, italic: false, align: 'center', bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
    ]
  },
  {
    id: 'sports-day',
    name: 'Sports Day',
    icon: Trophy,
    category: 'School Events',
    orientation: 'landscape',
    bgColor: '#0f172a',
    primaryColor: '#f59e0b',
    accentColor: '#ef4444',
    borderStyle: 'solid',
    borderWidth: 12,
    showDecorations: true,
    elements: [
      { type: 'title', content: 'ANNUAL SPORTS DAY', x: 50, y: 30, width: 85, fontSize: 62, fontFamily: 'Impact, sans-serif', color: '#f59e0b', bold: true, italic: false, align: 'center', bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
      { type: 'subtitle', content: '2025', x: 50, y: 48, width: 30, fontSize: 80, fontFamily: 'Impact, sans-serif', color: '#ffffff', bold: true, italic: false, align: 'center', bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 0.12, zIndex: 1, locked: false },
      { type: 'subtitle', content: 'LET THE GAMES BEGIN!', x: 50, y: 58, width: 60, fontSize: 24, fontFamily: "'Inter', sans-serif", color: '#ffffff', bold: true, italic: false, align: 'center', bgColor: '#ef4444', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 3, locked: false },
      { type: 'body', content: 'Saturday 14th June 2025  ·  School Grounds  ·  8:00 AM', x: 50, y: 74, width: 70, fontSize: 16, fontFamily: "'Inter', sans-serif", color: '#94a3b8', bold: false, italic: false, align: 'center', bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
    ]
  },
  {
    id: 'exam-notice',
    name: 'Exam Notice',
    icon: BookOpen,
    category: 'Notices',
    orientation: 'portrait',
    bgColor: '#ffffff',
    primaryColor: '#1e40af',
    accentColor: '#dc2626',
    borderStyle: 'solid',
    borderWidth: 10,
    showDecorations: false,
    elements: [
      { type: 'subtitle', content: 'IMPORTANT NOTICE', x: 50, y: 18, width: 70, fontSize: 18, fontFamily: "'Inter', sans-serif", color: '#ffffff', bold: true, italic: false, align: 'center', bgColor: '#dc2626', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 3, locked: false },
      { type: 'title', content: 'END OF TERM\nEXAMINATIONS', x: 50, y: 34, width: 80, fontSize: 46, fontFamily: "'Inter', sans-serif", color: '#1e40af', bold: true, italic: false, align: 'center', bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
      { type: 'body', content: 'All students are reminded that end-of-term examinations commence on Monday 23rd June 2025. Students must arrive 30 minutes before their scheduled exam time.', x: 50, y: 56, width: 76, fontSize: 16, fontFamily: 'Georgia, serif', color: '#334155', bold: false, italic: false, align: 'center', bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
      { type: 'body', content: '• Mobile phones strictly prohibited\n• Student ID cards must be worn\n• No late entry after 15 minutes', x: 50, y: 74, width: 70, fontSize: 15, fontFamily: "'Inter', sans-serif", color: '#1e40af', bold: false, italic: false, align: 'left', bgColor: '#eff6ff', borderColor: '#bfdbfe', borderWidth: 1, opacity: 1, zIndex: 2, locked: false },
      { type: 'footer', content: 'For enquiries contact the School Office | office@school.edu', x: 50, y: 90, width: 80, fontSize: 12, fontFamily: "'Inter', sans-serif", color: '#64748b', bold: false, italic: false, align: 'center', bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
    ]
  },
  {
    id: 'graduation',
    name: 'Graduation',
    icon: Star,
    category: 'Ceremonies',
    orientation: 'landscape',
    bgColor: '#1a0a00',
    primaryColor: '#d4a017',
    accentColor: '#ffffff',
    borderStyle: 'double',
    borderWidth: 18,
    showDecorations: false,
    elements: [
      { type: 'subtitle', content: 'CLASS OF 2025', x: 50, y: 22, width: 50, fontSize: 18, fontFamily: 'Georgia, serif', color: '#d4a017', bold: false, italic: true, align: 'center', bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
      { type: 'title', content: 'GRADUATION\nCEREMONY', x: 50, y: 45, width: 88, fontSize: 64, fontFamily: 'Georgia, serif', color: '#d4a017', bold: true, italic: false, align: 'center', bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
      { type: 'body', content: '━━━━━━━━━━━━━━━━━━━━━━━━', x: 50, y: 62, width: 60, fontSize: 14, fontFamily: 'Georgia, serif', color: '#d4a017', bold: false, italic: false, align: 'center', bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 0.5, zIndex: 2, locked: false },
      { type: 'body', content: 'Friday, 27th June 2025  |  Assembly Hall  |  10:00 AM', x: 50, y: 73, width: 72, fontSize: 16, fontFamily: 'Georgia, serif', color: '#d4a017', bold: false, italic: false, align: 'center', bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
    ]
  },
  {
    id: 'cultural-day',
    name: 'Cultural Day',
    icon: Music,
    category: 'School Events',
    orientation: 'landscape',
    bgColor: '#fefce8',
    primaryColor: '#b45309',
    accentColor: '#16a34a',
    borderStyle: 'solid',
    borderWidth: 14,
    showDecorations: true,
    elements: [
      { type: 'title', content: 'CULTURAL DAY\nCELEBRATION', x: 50, y: 36, width: 80, fontSize: 54, fontFamily: "'Playfair Display', serif", color: '#b45309', bold: true, italic: false, align: 'center', bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
      { type: 'subtitle', content: '🎭  FOOD  ·  MUSIC  ·  DANCE  ·  ART  🎨', x: 50, y: 56, width: 80, fontSize: 18, fontFamily: "'Inter', sans-serif", color: '#16a34a', bold: true, italic: false, align: 'center', bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 3, locked: false },
      { type: 'body', content: 'Come celebrate the rich diversity of our school community!\nSaturday 5th July 2025 · School Grounds · 9:00 AM – 5:00 PM', x: 50, y: 72, width: 75, fontSize: 15, fontFamily: "'Inter', sans-serif", color: '#78350f', bold: false, italic: false, align: 'center', bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
    ]
  },
  {
    id: 'pta-meeting',
    name: 'PTA Meeting',
    icon: Calendar,
    category: 'Notices',
    orientation: 'portrait',
    bgColor: '#f0fdf4',
    primaryColor: '#166534',
    accentColor: '#15803d',
    borderStyle: 'solid',
    borderWidth: 8,
    showDecorations: false,
    elements: [
      { type: 'title', content: 'PTA\nMEETING', x: 50, y: 28, width: 78, fontSize: 58, fontFamily: "'Inter', sans-serif", color: '#166534', bold: true, italic: false, align: 'center', bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
      { type: 'subtitle', content: 'PARENTS & TEACHERS ASSOCIATION', x: 50, y: 46, width: 78, fontSize: 16, fontFamily: "'Inter', sans-serif", color: '#ffffff', bold: true, italic: false, align: 'center', bgColor: '#166534', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 3, locked: false },
      { type: 'body', content: 'You are cordially invited to the quarterly PTA meeting. Your presence and contribution to the academic welfare of our students is greatly valued.', x: 50, y: 62, width: 78, fontSize: 16, fontFamily: 'Georgia, serif', color: '#14532d', bold: false, italic: false, align: 'center', bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
      { type: 'body', content: '📅  Saturday, 12th July 2025\n🕐  2:00 PM – 4:00 PM\n📍  School Assembly Hall', x: 50, y: 78, width: 68, fontSize: 15, fontFamily: "'Inter', sans-serif", color: '#166534', bold: false, italic: false, align: 'left', bgColor: '#dcfce7', borderColor: '#86efac', borderWidth: 1, opacity: 1, zIndex: 2, locked: false },
    ]
  },
  {
    id: 'open-day',
    name: 'Open Day',
    icon: Zap,
    category: 'School Events',
    orientation: 'landscape',
    bgColor: '#fdf4ff',
    primaryColor: '#7e22ce',
    accentColor: '#ec4899',
    borderStyle: 'dashed',
    borderWidth: 10,
    showDecorations: true,
    elements: [
      { type: 'title', content: 'OPEN DAY', x: 50, y: 32, width: 80, fontSize: 72, fontFamily: 'Impact, sans-serif', color: '#7e22ce', bold: false, italic: false, align: 'center', bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
      { type: 'subtitle', content: 'EXPLORE · DISCOVER · BELONG', x: 50, y: 52, width: 65, fontSize: 20, fontFamily: "'Inter', sans-serif", color: '#ffffff', bold: true, italic: false, align: 'center', bgColor: '#ec4899', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 3, locked: false },
      { type: 'body', content: 'Tour classrooms, labs, and sports facilities. Meet our dedicated teaching staff and current students. Prospective families welcome!', x: 50, y: 68, width: 72, fontSize: 15, fontFamily: "'Inter', sans-serif", color: '#581c87', bold: false, italic: false, align: 'center', bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
      { type: 'footer', content: 'Saturday 19th July 2025  ·  9:00 AM – 1:00 PM', x: 50, y: 81, width: 60, fontSize: 14, fontFamily: "'Inter', sans-serif", color: '#7e22ce', bold: true, italic: false, align: 'center', bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
    ]
  },
  {
    id: 'science-fair',
    name: 'Science Fair',
    icon: Zap,
    category: 'School Events',
    orientation: 'landscape',
    bgColor: '#f0f9ff',
    primaryColor: '#0369a1',
    accentColor: '#0ea5e9',
    borderStyle: 'solid',
    borderWidth: 12,
    showDecorations: true,
    elements: [
      { type: 'title', content: 'SCIENCE &\nINNOVATION FAIR', x: 50, y: 36, width: 80, fontSize: 52, fontFamily: "'Inter', sans-serif", color: '#0369a1', bold: true, italic: false, align: 'center', bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
      { type: 'subtitle', content: '⚗️  EXPERIMENT  ·  INNOVATE  ·  INSPIRE  🔭', x: 50, y: 56, width: 78, fontSize: 17, fontFamily: "'Inter', sans-serif", color: '#0369a1', bold: true, italic: false, align: 'center', bgColor: '#e0f2fe', borderColor: '#7dd3fc', borderWidth: 1, opacity: 1, zIndex: 3, locked: false },
      { type: 'body', content: 'Projects across Biology, Chemistry, Physics, Mathematics & Technology.\nPrizes for 1st, 2nd & 3rd place in each category!', x: 50, y: 72, width: 74, fontSize: 15, fontFamily: "'Inter', sans-serif", color: '#0c4a6e', bold: false, italic: false, align: 'center', bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
    ]
  },
  {
    id: 'end-of-year',
    name: 'End of Year Party',
    icon: Gift,
    category: 'School Events',
    orientation: 'landscape' as Orientation,
    bgColor: '#1c1917',
    primaryColor: '#ef4444',
    accentColor: '#fbbf24',
    borderStyle: 'solid',
    borderWidth: 14,
    showDecorations: true,
    elements: [
      { type: 'title' as ElementType, content: 'END OF YEAR\nPARTY 🎉', x: 50, y: 34, width: 85, fontSize: 60, fontFamily: 'Impact, sans-serif', color: '#fbbf24', bold: true, italic: false, align: 'center' as TextAlign, bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
      { type: 'subtitle' as ElementType, content: 'YOU ARE INVITED!', x: 50, y: 54, width: 50, fontSize: 22, fontFamily: "'Inter', sans-serif", color: '#ffffff', bold: true, italic: false, align: 'center' as TextAlign, bgColor: '#ef4444', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 3, locked: false },
      { type: 'body' as ElementType, content: 'Music · Food · Games · Awards\nFriday 18th July 2025  ·  School Hall  ·  4:00 PM', x: 50, y: 72, width: 70, fontSize: 16, fontFamily: "'Inter', sans-serif", color: '#d6d3d1', bold: false, italic: false, align: 'center' as TextAlign, bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
    ]
  },
  {
    id: 'school-reopening',
    name: 'School Reopening',
    icon: BookMarked,
    category: 'Notices',
    orientation: 'portrait' as Orientation,
    bgColor: '#f0fdf4',
    primaryColor: '#059669',
    accentColor: '#34d399',
    borderStyle: 'solid',
    borderWidth: 10,
    showDecorations: false,
    elements: [
      { type: 'subtitle' as ElementType, content: '📢 ATTENTION PARENTS & STUDENTS', x: 50, y: 15, width: 80, fontSize: 16, fontFamily: "'Inter', sans-serif", color: '#ffffff', bold: true, italic: false, align: 'center' as TextAlign, bgColor: '#059669', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 3, locked: false },
      { type: 'title' as ElementType, content: 'SCHOOL\nREOPENING', x: 50, y: 34, width: 80, fontSize: 52, fontFamily: "'Inter', sans-serif", color: '#059669', bold: true, italic: false, align: 'center' as TextAlign, bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
      { type: 'body' as ElementType, content: 'We are pleased to announce that school resumes for all students on the date below. Please ensure all requirements are met before resumption.', x: 50, y: 54, width: 78, fontSize: 15, fontFamily: 'Georgia, serif', color: '#1f2937', bold: false, italic: false, align: 'center' as TextAlign, bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
      { type: 'body' as ElementType, content: '📅  Monday, 8th September 2025\n🕐  Reporting Time: 7:30 AM\n📍  All classes resume normal schedule', x: 50, y: 72, width: 72, fontSize: 15, fontFamily: "'Inter', sans-serif", color: '#059669', bold: false, italic: false, align: 'left' as TextAlign, bgColor: '#ecfdf5', borderColor: '#a7f3d0', borderWidth: 1, opacity: 1, zIndex: 2, locked: false },
      { type: 'footer' as ElementType, content: 'Items to bring: School fees receipt · Report card · Exercise books', x: 50, y: 90, width: 82, fontSize: 12, fontFamily: "'Inter', sans-serif", color: '#6b7280', bold: false, italic: false, align: 'center' as TextAlign, bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
    ]
  },
  {
    id: 'awards-ceremony',
    name: 'Awards Night',
    icon: Award,
    category: 'Ceremonies',
    orientation: 'landscape' as Orientation,
    bgColor: '#0c1445',
    primaryColor: '#c9a94e',
    accentColor: '#ffffff',
    borderStyle: 'double',
    borderWidth: 16,
    showDecorations: false,
    elements: [
      { type: 'subtitle' as ElementType, content: '✦  ANNUAL  ✦', x: 50, y: 20, width: 40, fontSize: 16, fontFamily: 'Georgia, serif', color: '#c9a94e', bold: false, italic: true, align: 'center' as TextAlign, bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 0.9, zIndex: 2, locked: false },
      { type: 'title' as ElementType, content: 'AWARDS\nCEREMONY', x: 50, y: 42, width: 85, fontSize: 64, fontFamily: 'Georgia, serif', color: '#c9a94e', bold: true, italic: false, align: 'center' as TextAlign, bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
      { type: 'body' as ElementType, content: '━━━━━  ★  ━━━━━', x: 50, y: 60, width: 40, fontSize: 16, fontFamily: 'Georgia, serif', color: '#c9a94e', bold: false, italic: false, align: 'center' as TextAlign, bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 0.6, zIndex: 2, locked: false },
      { type: 'body' as ElementType, content: 'Celebrating Academic Excellence & Outstanding Achievement\nSaturday 26th July 2025  |  Assembly Hall  |  6:00 PM', x: 50, y: 74, width: 75, fontSize: 15, fontFamily: 'Georgia, serif', color: '#e2d9b5', bold: false, italic: false, align: 'center' as TextAlign, bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
    ]
  },
  {
    id: 'emergency-notice',
    name: 'Emergency Alert',
    icon: AlertTriangle,
    category: 'Notices',
    orientation: 'portrait' as Orientation,
    bgColor: '#ffffff',
    primaryColor: '#dc2626',
    accentColor: '#fbbf24',
    borderStyle: 'solid',
    borderWidth: 16,
    showDecorations: false,
    elements: [
      { type: 'subtitle' as ElementType, content: '⚠️  URGENT NOTICE  ⚠️', x: 50, y: 15, width: 80, fontSize: 20, fontFamily: "'Inter', sans-serif", color: '#ffffff', bold: true, italic: false, align: 'center' as TextAlign, bgColor: '#dc2626', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 3, locked: false },
      { type: 'title' as ElementType, content: 'SCHOOL\nCLOSURE', x: 50, y: 36, width: 82, fontSize: 56, fontFamily: 'Impact, sans-serif', color: '#dc2626', bold: true, italic: false, align: 'center' as TextAlign, bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
      { type: 'body' as ElementType, content: 'Due to unforeseen circumstances, school will be closed on the date(s) indicated below. All students are to remain at home until further notice.', x: 50, y: 56, width: 78, fontSize: 16, fontFamily: "'Inter', sans-serif", color: '#1f2937', bold: false, italic: false, align: 'center' as TextAlign, bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
      { type: 'body' as ElementType, content: '📅  Effective: [DATE]\n📞  Emergency Contact: [PHONE]\n📧  Email: [EMAIL]', x: 50, y: 74, width: 72, fontSize: 15, fontFamily: "'Inter', sans-serif", color: '#dc2626', bold: true, italic: false, align: 'left' as TextAlign, bgColor: '#fef2f2', borderColor: '#fca5a5', borderWidth: 1, opacity: 1, zIndex: 2, locked: false },
      { type: 'footer' as ElementType, content: 'Updates will be communicated via SMS and the school portal.', x: 50, y: 90, width: 80, fontSize: 13, fontFamily: "'Inter', sans-serif", color: '#6b7280', bold: false, italic: true, align: 'center' as TextAlign, bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
    ]
  },
  {
    id: 'library-week',
    name: 'Library Week',
    icon: BookOpen,
    category: 'School Events',
    orientation: 'landscape' as Orientation,
    bgColor: '#faf5ff',
    primaryColor: '#0d9488',
    accentColor: '#f97316',
    borderStyle: 'dashed',
    borderWidth: 10,
    showDecorations: true,
    elements: [
      { type: 'title' as ElementType, content: '📖 LIBRARY WEEK', x: 50, y: 30, width: 80, fontSize: 56, fontFamily: "'Playfair Display', serif", color: '#0d9488', bold: true, italic: false, align: 'center' as TextAlign, bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
      { type: 'subtitle' as ElementType, content: 'READ  ·  EXPLORE  ·  IMAGINE', x: 50, y: 50, width: 65, fontSize: 20, fontFamily: "'Inter', sans-serif", color: '#ffffff', bold: true, italic: false, align: 'center' as TextAlign, bgColor: '#f97316', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 3, locked: false },
      { type: 'body' as ElementType, content: 'Book Fair · Reading Competitions · Author Visit · Storytelling\nMonday 14th – Friday 18th July 2025 · School Library', x: 50, y: 70, width: 75, fontSize: 15, fontFamily: "'Inter', sans-serif", color: '#134e4a', bold: false, italic: false, align: 'center' as TextAlign, bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
    ]
  },
  {
    id: 'speech-day',
    name: 'Speech & Prize Day',
    icon: GraduationCap,
    category: 'Ceremonies',
    orientation: 'landscape' as Orientation,
    bgColor: '#1a0a1e',
    primaryColor: '#a855f7',
    accentColor: '#fbbf24',
    borderStyle: 'double',
    borderWidth: 16,
    showDecorations: true,
    elements: [
      { type: 'subtitle' as ElementType, content: 'YOU ARE CORDIALLY INVITED TO THE', x: 50, y: 22, width: 60, fontSize: 14, fontFamily: 'Georgia, serif', color: '#c084fc', bold: false, italic: true, align: 'center' as TextAlign, bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
      { type: 'title' as ElementType, content: 'SPEECH &\nPRIZE GIVING DAY', x: 50, y: 42, width: 88, fontSize: 54, fontFamily: "'Playfair Display', serif", color: '#fbbf24', bold: true, italic: false, align: 'center' as TextAlign, bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
      { type: 'body' as ElementType, content: '━━━━━  ✦  ━━━━━', x: 50, y: 60, width: 40, fontSize: 14, fontFamily: 'Georgia, serif', color: '#a855f7', bold: false, italic: false, align: 'center' as TextAlign, bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 0.5, zIndex: 2, locked: false },
      { type: 'body' as ElementType, content: 'Guest of Honour: [DISTINGUISHED GUEST]\nSaturday 2nd August 2025  |  Main Hall  |  10:00 AM', x: 50, y: 74, width: 75, fontSize: 15, fontFamily: 'Georgia, serif', color: '#e9d5ff', bold: false, italic: false, align: 'center' as TextAlign, bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, zIndex: 2, locked: false },
    ]
  },
]

const FONTS = [
  { label: 'Inter', value: "'Inter', sans-serif" },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Playfair', value: "'Playfair Display', serif" },
  { label: 'Courier', value: "'Courier New', monospace" },
  { label: 'Impact', value: 'Impact, sans-serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
]

const BORDER_STYLES = ['solid', 'dashed', 'dotted', 'double', 'none']

const TAG_STYLES: { value: TagStyle; label: string; desc: string }[] = [
  { value: 'lanyard', label: 'Lanyard Card', desc: 'Portrait card with hole punch at top' },
  { value: 'badge', label: 'Name Badge', desc: 'Landscape badge with color header' },
  { value: 'sticker', label: 'Round Sticker', desc: 'Circle sticker with name' },
  { value: 'tent', label: 'Tent Card', desc: 'Folds at centre for desk display' },
]

const uid = () => Math.random().toString(36).slice(2, 9)

function readFile(file: File): Promise<string> {
  return new Promise(res => {
    const r = new FileReader()
    r.onload = e => res(e.target?.result as string)
    r.readAsDataURL(file)
  })
}

function mmToPx(mm: number) { return Math.round(mm * 3.7795) }

// ─────────────────────────────────────────────
// Code128 Barcode Generator (pure JS, no deps)
// ─────────────────────────────────────────────
const CODE128B: Record<string, number[]> = {}
const CODE128_CHARS = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~'
const CODE128_PATTERNS = [
  [2,1,2,2,2,2],[2,2,2,1,2,2],[2,2,2,2,2,1],[1,2,1,2,2,3],[1,2,1,3,2,2],
  [1,3,1,2,2,2],[1,2,2,2,1,3],[1,2,2,3,1,2],[1,3,2,2,1,2],[2,2,1,2,1,3],
  [2,2,1,3,1,2],[2,3,1,2,1,2],[1,1,2,2,3,2],[1,2,2,1,3,2],[1,2,2,2,3,1],
  [1,1,3,2,2,2],[1,2,3,1,2,2],[1,2,3,2,2,1],[2,2,3,2,1,1],[2,2,1,1,3,2],
  [2,2,1,2,3,1],[2,1,3,2,1,2],[2,2,3,1,1,2],[3,1,2,1,3,1],[3,1,1,2,2,2],
  [3,2,1,1,2,2],[3,2,1,2,2,1],[3,1,2,2,1,2],[3,2,2,1,1,2],[3,2,2,2,1,1],
  [2,1,2,1,2,3],[2,1,2,3,2,1],[2,3,2,1,2,1],[1,1,1,3,2,3],[1,3,1,1,2,3],
  [1,3,1,3,2,1],[1,1,2,3,1,3],[1,3,2,1,1,3],[1,3,2,3,1,1],[2,1,1,3,1,3],
  [2,3,1,1,1,3],[2,3,1,3,1,1],[1,1,2,1,3,3],[1,1,2,3,3,1],[1,3,2,1,3,1],
  [1,1,3,1,2,3],[1,1,3,3,2,1],[1,3,3,1,2,1],[3,1,3,1,2,1],[2,1,1,3,3,1],
  [2,3,1,1,3,1],[2,1,3,1,1,3],[2,1,3,3,1,1],[2,1,3,1,3,1],[3,1,1,1,2,3],
  [3,1,1,3,2,1],[3,3,1,1,2,1],[3,1,2,1,1,3],[3,1,2,3,1,1],[3,3,2,1,1,1],
  [3,1,4,1,1,1],[2,2,1,4,1,1],[4,3,1,1,1,1],[1,1,1,2,2,4],[1,1,1,4,2,2],
  [1,2,1,1,2,4],[1,2,1,4,2,1],[1,4,1,1,2,2],[1,4,1,2,2,1],[1,1,2,2,1,4],
  [1,1,2,4,1,2],[1,2,2,1,1,4],[1,2,2,4,1,1],[1,4,2,1,1,2],[1,4,2,2,1,1],
  [2,4,1,2,1,1],[2,2,1,1,1,4],[4,1,3,1,1,1],[2,4,1,1,1,2],[1,3,4,1,1,1],
  [1,1,1,2,4,2],[1,2,1,1,4,2],[1,2,1,2,4,1],[1,1,4,2,1,2],[1,2,4,1,1,2],
  [1,2,4,2,1,1],[4,1,1,2,1,2],[4,2,1,1,1,2],[4,2,1,2,1,1],[2,1,2,1,4,1],
  [2,1,4,1,2,1],[4,1,2,1,2,1],[1,1,1,1,4,3],[1,1,1,3,4,1],[1,3,1,1,4,1],
  [1,1,4,1,1,3],[1,1,4,3,1,1],[4,1,1,1,1,3],[4,1,1,3,1,1],[1,1,3,1,4,1],
  [1,1,4,1,3,1],[3,1,1,1,4,1],[4,1,1,1,3,1],[2,1,1,4,1,2],[2,1,1,2,1,4],
  [2,1,1,2,3,2],[2,3,3,1,1,1,2],
]
CODE128_CHARS.split('').forEach((c, i) => { CODE128B[c] = CODE128_PATTERNS[i] })

function generateBarcodeSVG(text: string, height = 40, moduleWidth = 1.5): string {
  if (!text) return ''
  const START_B = 104
  const STOP = CODE128_PATTERNS[CODE128_PATTERNS.length - 1]
  let checksum = START_B
  const bars: number[][] = [CODE128_PATTERNS[START_B]]
  for (let i = 0; i < text.length; i++) {
    const idx = CODE128_CHARS.indexOf(text[i])
    if (idx === -1) continue
    bars.push(CODE128_PATTERNS[idx])
    checksum += idx * (i + 1)
  }
  bars.push(CODE128_PATTERNS[checksum % 103])
  bars.push(STOP)
  let x = 0
  let svgBars = ''
  for (const pattern of bars) {
    for (let j = 0; j < pattern.length; j++) {
      const w = pattern[j] * moduleWidth
      if (j % 2 === 0) svgBars += `<rect x="${x}" y="0" width="${w}" height="${height}" fill="#000"/>`
      x += w
    }
  }
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${x}" height="${height}" viewBox="0 0 ${x} ${height}">${svgBars}</svg>`)}`
}

// Social format presets for flyer
const SOCIAL_FORMATS = [
  { id: 'square', label: 'Instagram (1:1)', w: 1080, h: 1080 },
  { id: 'story', label: 'WhatsApp Status (9:16)', w: 1080, h: 1920 },
  { id: 'fb', label: 'Facebook (1.91:1)', w: 1200, h: 628 },
  { id: 'twitter', label: 'Twitter/X (16:9)', w: 1200, h: 675 },
  { id: 'a4-land', label: 'A4 Landscape', w: 1123, h: 794 },
  { id: 'a4-port', label: 'A4 Portrait', w: 794, h: 1123 },
]

function defaultElements(): PosterElement[] {
  return POSTER_TEMPLATES[0].elements.map(e => ({ ...e, id: uid() }))
}

const defaultSide = (isPrimary: boolean): TagSide => ({
  bgColor: isPrimary ? '#ffffff' : '#6d28d9',
  primaryColor: isPrimary ? '#6d28d9' : '#ffffff',
  accentColor: '#f59e0b',
  showLogo: true,
  showName: isPrimary,
  showRole: isPrimary,
  showClass: isPrimary,
  showStudentId: isPrimary,
  showBarcode: false,
  showPhoto: isPrimary,
  customText: isPrimary ? '' : 'This card is property of the school. If found, please return to the school office.',
  pattern: isPrimary ? 'none' : 'diagonal',
})

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function PosterMakerPage() {
  const { user } = useAuth()
  const school = user?.school as any
  const defaultSchoolName = school?.name || 'World Uni-Learn Portal'
  const defaultLogo = school?.logo_url || ''

  const [activeTab, setActiveTab] = useState<ActiveTab>('poster')
  const [showTemplates, setShowTemplates] = useState(false)

  // ── Poster state ──
  const [orientation, setOrientation] = useState<Orientation>('landscape')
  const [primaryColor, setPrimaryColor] = useState('#6d28d9')
  const [accentColor, setAccentColor] = useState('#f59e0b')
  const [bgColor, setBgColor] = useState('#f8fafc')
  const [borderStyle, setBorderStyle] = useState('solid')
  const [borderWidth, setBorderWidth] = useState(15)
  const [showDecorations, setShowDecorations] = useState(true)
  const [showSchoolName, setShowSchoolName] = useState(true)
  const [schoolName, setSchoolName] = useState(defaultSchoolName)
  const [logoUrl, setLogoUrl] = useState(defaultLogo)
  const [logoX, setLogoX] = useState(50)
  const [logoY, setLogoY] = useState(18)
  const [logoSize, setLogoSize] = useState(12)
  const [bgImageUrl, setBgImageUrl] = useState('')
  const [bgImageOpacity, setBgImageOpacity] = useState(0.15)
  const [elements, setElements] = useState<PosterElement[]>(defaultElements)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [snapToGrid, setSnapToGrid] = useState(false)
  const [gridSize] = useState(2)

  // ── Tag state ──
  const [tagConfig, setTagConfig] = useState<TagConfig>({
    style: 'lanyard', orientation: 'portrait',
    width: 55, height: 85,
    fontFamily: "'Inter', sans-serif",
    logoUrl: defaultLogo, schoolName: defaultSchoolName,
    cornerRadius: 8,
    front: defaultSide(true),
    back: defaultSide(false),
  })
  const [tagViewSide, setTagViewSide] = useState<'front' | 'back'>('front')
  const [students, setStudents] = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)

  // ── Flyer state ──
  const [flyerFormat, setFlyerFormat] = useState(SOCIAL_FORMATS[0])
  const [flyerExporting, setFlyerExporting] = useState(false)
  const flyerCanvasRef = useRef<HTMLDivElement>(null)

  // ── Custom templates ──
  interface SavedTemplate { id: string; name: string; category: string; orientation: Orientation; bg_color: string; primary_color: string; accent_color: string; border_style: string; border_width: number; show_decorations: boolean; elements: any[]; created_at: string }
  const [customTemplates, setCustomTemplates] = useState<SavedTemplate[]>([])
  const [loadingCustom, setLoadingCustom] = useState(false)
  const [saveTemplateName, setSaveTemplateName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  useEffect(() => {
    async function fetchStudents() {
      if (!user?.school_id) return
      setLoadingStudents(true)
      const { data } = await supabase
        .from('students')
        .select('id, student_id, full_name, photo_url, class:classes(name)')
        .eq('school_id', user.school_id)
        .eq('is_active', true)
      if (data) {
        setStudents(data.map(s => ({
          id: s.id,
          studentId: s.student_id,
          name: s.full_name,
          role: 'Student',
          className: (s as any).class?.name || '',
          photoUrl: s.photo_url,
        })))
      }
      setLoadingStudents(false)
    }
    fetchStudents()
  }, [user?.school_id])

  const [newStudent, setNewStudent] = useState({ name: '', role: 'Student', className: '' })
  const [bulkText, setBulkText] = useState('')
  const [showBulk, setShowBulk] = useState(false)

  // ── Refs ──
  const canvasRef = useRef<HTMLDivElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const tagLogoInputRef = useRef<HTMLInputElement>(null)
  const bgImgInputRef = useRef<HTMLInputElement>(null)
  const elemImgInputRef = useRef<HTMLInputElement>(null)
  const dragging = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null)
  const logoDragging = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)

  const selected = elements.find(e => e.id === selectedId) || null

  // ─────────────────────────────────────────────
  // Apply Template
  // ─────────────────────────────────────────────
  const applyTemplate = (tpl: PosterTemplate) => {
    setOrientation(tpl.orientation)
    setPrimaryColor(tpl.primaryColor)
    setAccentColor(tpl.accentColor)
    setBgColor(tpl.bgColor)
    setBorderStyle(tpl.borderStyle)
    setBorderWidth(tpl.borderWidth)
    setShowDecorations(tpl.showDecorations)
    setElements(tpl.elements.map(e => ({ ...e, id: uid() })))
    setSelectedId(null)
    setShowTemplates(false)
  }

  // ─────────────────────────────────────────────
  // Custom Template CRUD
  // ─────────────────────────────────────────────
  const fetchCustomTemplates = useCallback(async () => {
    if (!user?.school_id) return
    setLoadingCustom(true)
    const { data } = await supabase
      .from('poster_templates')
      .select('*')
      .eq('school_id', user.school_id)
      .order('created_at', { ascending: false })
    if (data) setCustomTemplates(data as SavedTemplate[])
    setLoadingCustom(false)
  }, [user?.school_id])

  useEffect(() => { fetchCustomTemplates() }, [fetchCustomTemplates])

  const saveCurrentAsTemplate = async () => {
    if (!saveTemplateName.trim() || !user?.school_id) return
    const payload = {
      school_id: user.school_id,
      created_by: user.id,
      name: saveTemplateName.trim(),
      category: 'Custom',
      orientation,
      bg_color: bgColor,
      primary_color: primaryColor,
      accent_color: accentColor,
      border_style: borderStyle,
      border_width: borderWidth,
      show_decorations: showDecorations,
      elements: elements.map(({ id, ...rest }) => rest),
    }
    const { error } = await supabase.from('poster_templates').insert(payload)
    if (error) { toast.error('Failed to save template'); return }
    toast.success(`Template "${saveTemplateName}" saved!`)
    setSaveTemplateName('')
    setShowSaveDialog(false)
    fetchCustomTemplates()
  }

  const deleteCustomTemplate = async (id: string) => {
    const { error } = await supabase.from('poster_templates').delete().eq('id', id)
    if (error) { toast.error('Failed to delete'); return }
    toast.success('Template deleted')
    setCustomTemplates(t => t.filter(x => x.id !== id))
  }

  const applyCustomTemplate = (t: SavedTemplate) => {
    setOrientation(t.orientation)
    setPrimaryColor(t.primary_color)
    setAccentColor(t.accent_color)
    setBgColor(t.bg_color)
    setBorderStyle(t.border_style)
    setBorderWidth(t.border_width)
    setShowDecorations(t.show_decorations)
    setElements((t.elements || []).map((e: any) => ({ ...e, id: uid() })))
    setSelectedId(null)
    setShowTemplates(false)
  }

  // ─────────────────────────────────────────────
  // Flyer share helpers
  // ─────────────────────────────────────────────
  const captureFlyerAsBlob = async (): Promise<Blob | null> => {
    if (!flyerCanvasRef.current) return null
    setFlyerExporting(true)
    try {
      const canvas = await html2canvas(flyerCanvasRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        width: flyerCanvasRef.current.offsetWidth,
        height: flyerCanvasRef.current.offsetHeight,
      })
      return new Promise(resolve => canvas.toBlob(b => { setFlyerExporting(false); resolve(b) }, 'image/png'))
    } catch {
      setFlyerExporting(false)
      toast.error('Failed to capture flyer')
      return null
    }
  }

  const downloadFlyer = async () => {
    const blob = await captureFlyerAsBlob()
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `flyer-${Date.now()}.png`; a.click()
    URL.revokeObjectURL(url)
    toast.success('Flyer downloaded!')
  }

  const shareFlyer = async (platform?: string) => {
    const blob = await captureFlyerAsBlob()
    if (!blob) return
    const file = new File([blob], 'school-flyer.png', { type: 'image/png' })

    // Try Web Share API first (works on mobile & some desktop)
    if (navigator.share && !platform) {
      try {
        await navigator.share({
          title: schoolName + ' - Announcement',
          text: 'Check out this announcement from ' + schoolName,
          files: [file],
        })
        return
      } catch (err: any) {
        if (err.name === 'AbortError') return // user cancelled
      }
    }

    // Platform-specific fallbacks (desktop)
    const text = encodeURIComponent('Check out this announcement from ' + schoolName)
    if (platform === 'whatsapp') {
      // Can't attach image directly via URL, so download + open WhatsApp
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob); a.download = 'school-flyer.png'; a.click()
      setTimeout(() => window.open(`https://wa.me/?text=${text}`, '_blank'), 500)
      toast.success('Image downloaded — attach it in WhatsApp!')
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?quote=${text}`, '_blank')
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob); a.download = 'school-flyer.png'; a.click()
      toast.success('Image downloaded — paste it in your Facebook post!')
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob); a.download = 'school-flyer.png'; a.click()
      toast.success('Image downloaded — attach it in your tweet!')
    } else if (platform === 'copy') {
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        toast.success('Image copied to clipboard!')
      } catch {
        toast.error('Copy not supported in this browser')
      }
    }
  }

  // ─────────────────────────────────────────────
  // Element helpers
  // ─────────────────────────────────────────────
  const updateEl = useCallback((id: string, patch: Partial<PosterElement>) => {
    setElements(els => els.map(e => e.id === id ? { ...e, ...patch } : e))
  }, [])

  const addTextElement = (type: ElementType) => {
    const el: PosterElement = {
      id: uid(), type, content: type === 'title' ? 'NEW TITLE' : type === 'subtitle' ? 'Subtitle' : 'Body text here',
      x: 50, y: 50, width: 60,
      fontSize: type === 'title' ? 40 : type === 'subtitle' ? 22 : 14,
      fontFamily: "'Inter', sans-serif", color: '#1e293b',
      bold: type === 'title', italic: false, align: 'center',
      bgColor: 'transparent', borderColor: 'transparent', borderWidth: 0,
      opacity: 1, zIndex: elements.length + 2, locked: false,
    }
    setElements(els => [...els, el])
    setSelectedId(el.id)
  }

  const addImageElement = async (file: File) => {
    const url = await readFile(file)
    const el: PosterElement = {
      id: uid(), type: 'image', content: '', x: 50, y: 50, width: 30,
      fontSize: 0, fontFamily: '', color: '', bold: false, italic: false,
      align: 'center', bgColor: 'transparent', borderColor: 'transparent',
      borderWidth: 0, opacity: 1, imageUrl: url, zIndex: elements.length + 2, locked: false,
    }
    setElements(els => [...els, el])
    setSelectedId(el.id)
  }

  const addShapeElement = () => {
    const el: PosterElement = {
      id: uid(), type: 'shape', content: '', x: 50, y: 50, width: 20,
      fontSize: 0, fontFamily: '', color: '', bold: false, italic: false,
      align: 'center', bgColor: accentColor, borderColor: primaryColor,
      borderWidth: 2, opacity: 0.8, zIndex: elements.length + 2, locked: false,
    }
    setElements(els => [...els, el])
    setSelectedId(el.id)
  }

  const deleteSelected = () => {
    if (!selectedId) return
    setElements(els => els.filter(e => e.id !== selectedId))
    setSelectedId(null)
  }

  const duplicateSelected = () => {
    if (!selected) return
    const copy = { ...selected, id: uid(), x: selected.x + 3, y: selected.y + 3, zIndex: selected.zIndex + 1 }
    setElements(els => [...els, copy])
    setSelectedId(copy.id)
  }

  const moveZ = (dir: 'up' | 'down') => {
    if (!selected) return
    updateEl(selected.id, { zIndex: selected.zIndex + (dir === 'up' ? 1 : -1) })
  }

  // ─────────────────────────────────────────────
  // Drag handlers
  // ─────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const el = elements.find(el => el.id === id)
    if (!el || el.locked) return
    setSelectedId(id)
    dragging.current = { id, startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y }
  }, [elements])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const dx = ((e.clientX - dragging.current.startX) / rect.width) * 100
      const dy = ((e.clientY - dragging.current.startY) / rect.height) * 100
      let nx = Math.min(98, Math.max(2, dragging.current.origX + dx))
      let ny = Math.min(98, Math.max(2, dragging.current.origY + dy))
      if (snapToGrid) { nx = Math.round(nx / gridSize) * gridSize; ny = Math.round(ny / gridSize) * gridSize }
      updateEl(dragging.current.id, { x: nx, y: ny })
    }
    const onUp = () => { dragging.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [updateEl, snapToGrid, gridSize])

  const onLogoDragStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    logoDragging.current = { startX: e.clientX, startY: e.clientY, origX: logoX, origY: logoY }
  }
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!logoDragging.current || !canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const dx = ((e.clientX - logoDragging.current.startX) / rect.width) * 100
      const dy = ((e.clientY - logoDragging.current.startY) / rect.height) * 100
      setLogoX(Math.min(95, Math.max(5, logoDragging.current.origX + dx)))
      setLogoY(Math.min(95, Math.max(5, logoDragging.current.origY + dy)))
    }
    const onUp = () => { logoDragging.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [])

  // ─────────────────────────────────────────────
  // Build poster HTML (shared between print & PDF)
  // ─────────────────────────────────────────────
  const buildPosterHTML = (forPrint: boolean) => {
    const isLand = orientation === 'landscape'
    const pw = isLand ? '297mm' : '210mm'
    const ph = isLand ? '210mm' : '297mm'
    const bVal = borderStyle === 'none' ? 'none' : `${borderWidth}mm ${borderStyle} ${primaryColor}`

    const elHtml = [...elements].sort((a, b) => a.zIndex - b.zIndex).map(el => {
      const base = `position:absolute;left:${el.x}%;top:${el.y}%;transform:translate(-50%,-50%);width:${el.width}%;opacity:${el.opacity};z-index:${el.zIndex};`
      if (el.type === 'image') return `<img src="${el.imageUrl}" style="${base}max-width:100%;object-fit:contain;" />`
      if (el.type === 'shape') return `<div style="${base}height:${el.width * 0.6}%;background:${el.bgColor};border:${el.borderWidth}px solid ${el.borderColor};border-radius:8px;"></div>`
      const ts = `font-size:${el.fontSize}pt;font-family:${el.fontFamily};color:${el.color};font-weight:${el.bold ? '900' : '400'};font-style:${el.italic ? 'italic' : 'normal'};text-align:${el.align};background:${el.bgColor};border:${el.borderWidth}px solid ${el.borderColor};padding:${el.bgColor !== 'transparent' ? '6px 16px' : '0'};border-radius:${el.bgColor !== 'transparent' ? '40px' : '0'};line-height:1.2;white-space:pre-wrap;word-break:break-word;`
      return `<div style="${base}${ts}">${el.content}</div>`
    }).join('')

    const decoHtml = showDecorations ? `
      <div style="position:absolute;width:50%;padding-top:50%;background:${accentColor};border-radius:50%;opacity:0.08;top:-15%;right:-15%;"></div>
      <div style="position:absolute;width:60%;padding-top:60%;background:${primaryColor};border-radius:50%;opacity:0.05;bottom:-20%;left:-20%;"></div>
    ` : ''
    const schHtml = showSchoolName ? `<div style="position:absolute;top:6%;left:50%;transform:translateX(-50%);font-size:11pt;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:2px;white-space:nowrap;">${schoolName}</div>` : ''
    const logoHtml = logoUrl ? `<img src="${logoUrl}" style="position:absolute;left:${logoX}%;top:${logoY}%;transform:translate(-50%,-50%);max-height:${logoSize}%;max-width:20%;object-fit:contain;" />` : ''
    const bgImgHtml = bgImageUrl ? `<div style="position:absolute;inset:0;background-image:url('${bgImageUrl}');background-size:cover;background-position:center;opacity:${bgImageOpacity};"></div>` : ''

    return `<html><head><title>Poster</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
      <style>
        body{margin:0;padding:0;background:#fff;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
        ${forPrint ? `@page{size:${isLand ? 'A4 landscape' : 'A4 portrait'};margin:0mm;}` : ''}
        .p{width:${pw};height:${ph};position:relative;overflow:hidden;background-color:${bgColor};border:${bVal};box-sizing:border-box;}
      </style></head><body>
      <div class="p">${bgImgHtml}${decoHtml}${schHtml}${logoHtml}${elHtml}</div>
    </body></html>`
  }

  // ─────────────────────────────────────────────
  // Print poster
  // ─────────────────────────────────────────────
  const printPoster = () => {
    const html = buildPosterHTML(true)
    const win = window.open('', '_blank')
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 900) }
  }

  // ─────────────────────────────────────────────
  // Save as PDF (using print dialog with PDF option)
  // ─────────────────────────────────────────────
  const savePDF = () => {
    const isLand = orientation === 'landscape'
    const html = buildPosterHTML(true)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank')
    if (win) {
      win.onload = () => {
        setTimeout(() => {
          win.focus()
          win.print()
        }, 1200)
      }
    }
  }

  // ─────────────────────────────────────────────
  // Build tag HTML (front or back) for one student
  // ─────────────────────────────────────────────
  const buildTagHTML = (s: Student, side: TagSide, isFront: boolean) => {
    const tc = tagConfig
    const tagW = mmToPx(tc.width)
    const tagH = mmToPx(tc.height)
    const patternStyle = side.pattern === 'dots'
      ? `background-image:radial-gradient(circle,${side.primaryColor}18 1px,transparent 1px);background-size:8px 8px;`
      : side.pattern === 'lines'
        ? `background-image:repeating-linear-gradient(0deg,${side.primaryColor}12 0,${side.primaryColor}12 1px,transparent 1px,transparent 8px);`
        : side.pattern === 'diagonal'
          ? `background-image:repeating-linear-gradient(45deg,${side.primaryColor}12 0,${side.primaryColor}12 1px,transparent 1px,transparent 8px);`
          : ''

    if (tc.style === 'sticker') {
      return `<div style="width:${tagW}px;height:${tagH}px;border-radius:50%;background:${side.bgColor};${patternStyle}border:3px solid ${side.primaryColor};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;overflow:hidden;flex-shrink:0;">
        ${isFront ? `
          ${side.showLogo && tc.logoUrl ? `<img src="${tc.logoUrl}" style="height:${tagH * 0.18}px;object-fit:contain;margin-bottom:4px;" />` : ''}
          ${side.showName ? `<div style="font-size:${Math.max(9, tagW * 0.085)}px;font-weight:700;color:${side.primaryColor};font-family:${tc.fontFamily};line-height:1.1;padding:0 8px;">${s.name}</div>` : ''}
          ${side.showRole ? `<div style="font-size:${Math.max(7, tagW * 0.06)}px;color:#666;font-family:${tc.fontFamily};">${s.role}</div>` : ''}
          ${side.showStudentId && s.studentId ? `<div style="font-size:${Math.max(6, tagW * 0.055)}px;color:#888;font-family:${tc.fontFamily};margin-top:2px;">${s.studentId}</div>` : ''}
        ` : `
          <div style="font-size:${Math.max(6, tagW * 0.06)}px;color:${side.primaryColor};font-family:${tc.fontFamily};padding:8px;text-align:center;line-height:1.4;">${side.customText || tc.schoolName}</div>
        `}
      </div>`
    }

    if (tc.style === 'lanyard') {
      return `<div style="width:${tagW}px;height:${tagH}px;background:${side.bgColor};${patternStyle}border-radius:${tc.cornerRadius}px;border:1.5px solid #ddd;display:flex;flex-direction:column;align-items:center;overflow:hidden;flex-shrink:0;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
        <div style="width:20px;height:8px;background:#aaa;border-radius:0 0 4px 4px;"></div>
        ${isFront ? `
          <div style="width:100%;background:${side.primaryColor};padding:8px 0;display:flex;align-items:center;justify-content:center;gap:6px;">
            ${side.showLogo && tc.logoUrl ? `<img src="${tc.logoUrl}" style="height:${tagW * 0.18}px;object-fit:contain;" />` : ''}
            <div style="font-size:${Math.max(6, tagW * 0.07)}px;font-weight:700;color:#fff;font-family:${tc.fontFamily};">${tc.schoolName}</div>
          </div>
          ${side.showPhoto && s.photoUrl ? `<img src="${s.photoUrl}" style="width:${tagW * 0.5}px;height:${tagW * 0.5}px;object-fit:cover;border-radius:50%;margin:8px 0;border:2px solid ${side.primaryColor};" />` : `<div style="width:${tagW * 0.5}px;height:${tagW * 0.5}px;border-radius:50%;background:${side.accentColor}20;border:2px solid ${side.primaryColor};margin:8px 0;display:flex;align-items:center;justify-content:center;font-size:${tagW * 0.15}px;font-weight:700;color:${side.primaryColor};">${s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>`}
          ${side.showName ? `<div style="font-size:${Math.max(8, tagW * 0.09)}px;font-weight:700;color:${side.primaryColor};font-family:${tc.fontFamily};text-align:center;padding:0 6px;line-height:1.2;">${s.name}</div>` : ''}
          ${side.showRole ? `<div style="font-size:${Math.max(6, tagW * 0.065)}px;color:#666;font-family:${tc.fontFamily};margin-top:2px;">${s.role}</div>` : ''}
          ${side.showClass ? `<div style="font-size:${Math.max(6, tagW * 0.06)}px;color:#888;font-family:${tc.fontFamily};margin-top:1px;">${s.className}</div>` : ''}
          ${side.showStudentId && s.studentId ? `<div style="font-size:${Math.max(6, tagW * 0.06)}px;color:${side.primaryColor};font-family:${tc.fontFamily};margin-top:2px;font-weight:600;">${s.studentId}</div>` : ''}
          ${side.showBarcode && s.studentId ? `<div style="margin-top:auto;margin-bottom:6px;text-align:center;"><img src="${generateBarcodeSVG(s.studentId, 24, 1)}" style="max-width:${tagW * 0.8}px;height:24px;" /><div style="font-size:${Math.max(5, tagW * 0.04)}px;color:#333;font-family:monospace;margin-top:1px;">${s.studentId}</div></div>` : ''}
        ` : `
          <div style="width:100%;background:${side.primaryColor};padding:8px 0;display:flex;align-items:center;justify-content:center;">
            ${side.showLogo && tc.logoUrl ? `<img src="${tc.logoUrl}" style="height:${tagW * 0.15}px;object-fit:contain;opacity:0.9;" />` : `<div style="font-size:${Math.max(6, tagW * 0.08)}px;font-weight:700;color:#fff;font-family:${tc.fontFamily};">${tc.schoolName}</div>`}
          </div>
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px;text-align:center;">
            <div style="font-size:${Math.max(6, tagW * 0.06)}px;color:${side.primaryColor};font-family:${tc.fontFamily};line-height:1.5;">${side.customText || 'This ID card must be worn at all times while on school premises.'}</div>
          </div>
          <div style="width:100%;height:4px;background:${side.accentColor};"></div>
        `}
      </div>`
    }

    if (tc.style === 'badge') {
      return `<div style="width:${tagW}px;height:${tagH}px;background:${side.bgColor};${patternStyle}border-radius:${tc.cornerRadius}px;border:1.5px solid #ddd;overflow:hidden;display:flex;flex-direction:column;flex-shrink:0;">
        ${isFront ? `
          <div style="background:${side.primaryColor};padding:6px 10px;display:flex;align-items:center;gap:6px;">
            ${side.showLogo && tc.logoUrl ? `<img src="${tc.logoUrl}" style="height:${tagH * 0.2}px;object-fit:contain;" />` : ''}
            <div style="font-size:${Math.max(6, tagH * 0.07)}px;font-weight:700;color:#fff;font-family:${tc.fontFamily};">${tc.schoolName}</div>
          </div>
          <div style="flex:1;display:flex;align-items:center;padding:6px 10px;gap:8px;">
            <div style="width:${tagH * 0.35}px;height:${tagH * 0.35}px;border-radius:50%;background:${side.primaryColor}20;border:2px solid ${side.primaryColor};display:flex;align-items:center;justify-content:center;font-size:${tagH * 0.12}px;font-weight:700;color:${side.primaryColor};flex-shrink:0;overflow:hidden;">
              ${side.showPhoto && s.photoUrl ? `<img src="${s.photoUrl}" style="width:100%;height:100%;object-fit:cover;" />` : s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              ${side.showName ? `<div style="font-size:${Math.max(8, tagH * 0.1)}px;font-weight:700;color:${side.primaryColor};font-family:${tc.fontFamily};line-height:1.1;">${s.name}</div>` : ''}
              ${side.showRole ? `<div style="font-size:${Math.max(6, tagH * 0.075)}px;color:#555;font-family:${tc.fontFamily};margin-top:2px;">${s.role}</div>` : ''}
              ${side.showClass ? `<div style="font-size:${Math.max(6, tagH * 0.065)}px;color:#888;font-family:${tc.fontFamily};">${s.className}</div>` : ''}
              ${side.showStudentId && s.studentId ? `<div style="font-size:${Math.max(6, tagH * 0.065)}px;color:${side.primaryColor};font-family:${tc.fontFamily};font-weight:600;margin-top:1px;">${s.studentId}</div>` : ''}
            </div>
          </div>
          <div style="height:4px;background:${side.accentColor};"></div>
        ` : `
          <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px;text-align:center;box-sizing:border-box;">
            ${side.showLogo && tc.logoUrl ? `<img src="${tc.logoUrl}" style="height:${tagH * 0.2}px;object-fit:contain;margin-bottom:8px;opacity:0.7;" />` : ''}
            <div style="font-size:${Math.max(6, tagH * 0.065)}px;color:${side.primaryColor};font-family:${tc.fontFamily};line-height:1.5;">${side.customText || 'Return to school office if found.'}</div>
            <div style="width:60%;height:3px;background:${side.accentColor};border-radius:2px;margin-top:8px;"></div>
          </div>
        `}
      </div>`
    }

    // tent
    return `<div style="width:${tagW}px;height:${tagH}px;background:${side.bgColor};${patternStyle}border-radius:${tc.cornerRadius}px;border:1.5px solid #ddd;display:flex;flex-direction:column;flex-shrink:0;overflow:hidden;">
      ${isFront ? `
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;border-bottom:1.5px dashed #ccc;">
          ${side.showName ? `<div style="font-size:${Math.max(7, tagW * 0.09)}px;font-weight:700;color:${side.primaryColor};font-family:${tc.fontFamily};text-align:center;padding:0 8px;line-height:1.2;">${s.name}</div>` : ''}
          ${side.showRole ? `<div style="font-size:${Math.max(6, tagW * 0.065)}px;color:#666;font-family:${tc.fontFamily};">${s.role}</div>` : ''}
          ${side.showStudentId && s.studentId ? `<div style="font-size:${Math.max(6, tagW * 0.06)}px;color:#888;font-family:${tc.fontFamily};margin-top:2px;">${s.studentId}</div>` : ''}
        </div>
        <div style="flex:1;display:flex;align-items:center;justify-content:center;background:${side.primaryColor}08;">
          ${side.showLogo && tc.logoUrl ? `<img src="${tc.logoUrl}" style="max-height:${tagH * 0.2}px;object-fit:contain;opacity:0.4;" />` : `<div style="font-size:${Math.max(6, tagW * 0.06)}px;color:#aaa;font-family:${tc.fontFamily};">${tc.schoolName}</div>`}
        </div>
      ` : `
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px;">
          <div style="font-size:${Math.max(6, tagW * 0.065)}px;color:${side.primaryColor};font-family:${tc.fontFamily};text-align:center;line-height:1.5;">${side.customText || tc.schoolName}</div>
        </div>
      `}
    </div>`
  }

  // ─────────────────────────────────────────────
  // Print tags (front + back on separate sheets or interleaved)
  // ─────────────────────────────────────────────
  const printTags = () => {
    const tc = tagConfig
    const tagW = mmToPx(tc.width)
    const tagH = mmToPx(tc.height)
    const pageW = mmToPx(210)
    const pageH = mmToPx(297)
    const margin = mmToPx(8)
    const gap = mmToPx(4)
    const cols = Math.floor((pageW - margin * 2 + gap) / (tagW + gap))
    const rows = Math.floor((pageH - margin * 2 + gap) / (tagH + gap))
    const perPage = cols * rows

    const makeGrid = (studs: Student[], isFront: boolean, side: TagSide) => {
      const pages = []
      for (let i = 0; i < studs.length; i += perPage) {
        pages.push(studs.slice(i, i + perPage))
      }
      return pages.map(group => `
        <div style="width:${pageW}px;height:${pageH}px;padding:${margin}px;display:flex;flex-wrap:wrap;gap:${gap}px;align-content:flex-start;page-break-after:always;box-sizing:border-box;">
          <div style="width:100%;font-size:9pt;color:#aaa;margin-bottom:4px;font-family:sans-serif;">${isFront ? '▶ FRONT SIDE' : '◀ BACK SIDE (flip sheet over)'}</div>
          ${group.map(s => buildTagHTML(s, side, isFront)).join('')}
        </div>`).join('')
    }

    const displayStudents = students.length > 0 ? students : [{ id: uid(), name: 'Sample Student', role: 'Student', className: 'Class 1A', studentId: 'STU-001' }]

    const html = `<html><head><title>Print Tags</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
      <style>body{margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}@page{size:A4 portrait;margin:0;}</style>
    </head><body>
      ${makeGrid(displayStudents, true, tc.front)}
      ${makeGrid(displayStudents, false, tc.back)}
    </body></html>`

    const win = window.open('', '_blank')
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 900) }
  }

  // ─────────────────────────────────────────────
  // Bulk import
  // ─────────────────────────────────────────────
  const importBulk = () => {
    const lines = bulkText.trim().split('\n').filter(Boolean)
    const parsed: Student[] = lines.map(l => {
      const [name = '', role = 'Student', className = ''] = l.split(',').map(s => s.trim())
      return { id: uid(), name, role, className }
    })
    setStudents(s => [...s, ...parsed])
    setBulkText('')
    setShowBulk(false)
  }

  // ─────────────────────────────────────────────
  // Styles
  // ─────────────────────────────────────────────
  const isLand = orientation === 'landscape'
  const canvasAspect = isLand ? '1.414 / 1' : '1 / 1.414'
  const inp = (extra?: React.CSSProperties): React.CSSProperties => ({ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: 12.5, boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff', ...extra })
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11.5, fontWeight: 600, color: '#6b7280', marginBottom: 4 }
  const secH: React.CSSProperties = { fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#9ca3af', marginTop: 16, marginBottom: 6 }
  const row: React.CSSProperties = { display: 'flex', gap: 8 }
  const field = (extra?: React.CSSProperties): React.CSSProperties => ({ marginBottom: 10, ...extra })

  const activeSide = tagViewSide === 'front' ? tagConfig.front : tagConfig.back
  const setFront = (patch: Partial<TagSide>) => setTagConfig(t => ({ ...t, front: { ...t.front, ...patch } }))
  const setBack = (patch: Partial<TagSide>) => setTagConfig(t => ({ ...t, back: { ...t.back, ...patch } }))
  const setActiveSide = tagViewSide === 'front' ? setFront : setBack

  // ─────────────────────────────────────────────
  // TAG PREVIEW COMPONENT
  // ─────────────────────────────────────────────
  const TagPreview = ({ s, showBothSides }: { s: Student; showBothSides?: boolean }) => {
    const [flip, setFlip] = useState(false)
    const tc = tagConfig
    const scale = Math.min(140 / mmToPx(tc.width), 160 / mmToPx(tc.height))
    const pw = mmToPx(tc.width) * scale
    const ph = mmToPx(tc.height) * scale
    const fs = (base: number) => Math.max(6, base * scale)
    const side = flip ? tc.back : tc.front
    const isFront = !flip

    const patternBg = side.pattern === 'dots'
      ? { backgroundImage: `radial-gradient(circle,${side.primaryColor}25 1px,transparent 1px)`, backgroundSize: '8px 8px' }
      : side.pattern === 'lines'
        ? { backgroundImage: `repeating-linear-gradient(0deg,${side.primaryColor}20 0,${side.primaryColor}20 1px,transparent 1px,transparent 8px)` }
        : side.pattern === 'diagonal'
          ? { backgroundImage: `repeating-linear-gradient(45deg,${side.primaryColor}20 0,${side.primaryColor}20 1px,transparent 1px,transparent 8px)` }
          : {}

    const cardContent = () => {
      if (tc.style === 'sticker') return (
        <div style={{ width: pw, height: ph, borderRadius: '50%', background: side.bgColor, ...patternBg, border: `2px solid ${side.primaryColor}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', overflow: 'hidden', cursor: showBothSides ? 'pointer' : 'default' }} onClick={() => showBothSides && setFlip(f => !f)}>
          {isFront ? <>
            {side.showLogo && tc.logoUrl && <img src={tc.logoUrl} style={{ height: ph * 0.2, objectFit: 'contain', marginBottom: 2 }} />}
            {side.showName && <div style={{ fontSize: fs(11), fontWeight: 700, color: side.primaryColor, fontFamily: tc.fontFamily, lineHeight: 1.1, padding: '0 4px' }}>{s.name}</div>}
            {side.showRole && <div style={{ fontSize: fs(8), color: '#666', fontFamily: tc.fontFamily }}>{s.role}</div>}
            {side.showStudentId && s.studentId && <div style={{ fontSize: fs(7), color: '#888', fontFamily: tc.fontFamily, marginTop: 2 }}>{s.studentId}</div>}
          </> : <div style={{ fontSize: fs(7), color: side.primaryColor, fontFamily: tc.fontFamily, padding: 8, textAlign: 'center', lineHeight: 1.4 }}>{side.customText || tc.schoolName}</div>}
        </div>
      )

      if (tc.style === 'lanyard') return (
        <div style={{ width: pw, height: ph, background: side.bgColor, ...patternBg, borderRadius: tc.cornerRadius * scale, border: '1px solid #ddd', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: showBothSides ? 'pointer' : 'default' }} onClick={() => showBothSides && setFlip(f => !f)}>
          <div style={{ width: pw * 0.25, height: 6 * scale, background: '#aaa', borderRadius: '0 0 3px 3px' }} />
          {isFront ? <>
            <div style={{ width: '100%', background: side.primaryColor, padding: '5px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              {side.showLogo && tc.logoUrl && <img src={tc.logoUrl} style={{ height: pw * 0.18, objectFit: 'contain' }} />}
              <div style={{ fontSize: fs(7), fontWeight: 700, color: '#fff', fontFamily: tc.fontFamily }}>{tc.schoolName}</div>
            </div>
            <div style={{ width: pw * 0.5, height: pw * 0.5, borderRadius: '50%', background: `${side.primaryColor}20`, border: `2px solid ${side.primaryColor}`, margin: '6px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: pw * 0.14, fontWeight: 700, color: side.primaryColor, overflow: 'hidden' }}>
              {side.showPhoto && s.photoUrl ? <img src={s.photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            {side.showName && <div style={{ fontSize: fs(9), fontWeight: 700, color: side.primaryColor, fontFamily: tc.fontFamily, textAlign: 'center', padding: '0 4px', lineHeight: 1.1 }}>{s.name}</div>}
            {side.showRole && <div style={{ fontSize: fs(7), color: '#666', fontFamily: tc.fontFamily }}>{s.role}</div>}
            {side.showClass && <div style={{ fontSize: fs(6.5), color: '#888', fontFamily: tc.fontFamily }}>{s.className}</div>}
            {side.showStudentId && s.studentId && <div style={{ fontSize: fs(6.5), color: side.primaryColor, fontFamily: tc.fontFamily, marginTop: 2, fontWeight: 600 }}>{s.studentId}</div>}
          </> : <>
            <div style={{ width: '100%', background: side.primaryColor, padding: '5px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {side.showLogo && tc.logoUrl ? <img src={tc.logoUrl} style={{ height: pw * 0.15, objectFit: 'contain', opacity: 0.9 }} /> : <div style={{ fontSize: fs(7), fontWeight: 700, color: '#fff', fontFamily: tc.fontFamily }}>{tc.schoolName}</div>}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 8, textAlign: 'center' }}>
              <div style={{ fontSize: fs(6.5), color: side.primaryColor, fontFamily: tc.fontFamily, lineHeight: 1.5 }}>{side.customText || 'This ID card must be worn at all times while on school premises.'}</div>
            </div>
            <div style={{ width: '100%', height: 3 * scale, background: side.accentColor }} />
          </>}
        </div>
      )

      if (tc.style === 'badge') return (
        <div style={{ width: pw, height: ph, background: side.bgColor, ...patternBg, borderRadius: tc.cornerRadius * scale, border: '1px solid #ddd', overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: showBothSides ? 'pointer' : 'default' }} onClick={() => showBothSides && setFlip(f => !f)}>
          {isFront ? <>
            <div style={{ background: side.primaryColor, padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
              {side.showLogo && tc.logoUrl && <img src={tc.logoUrl} style={{ height: ph * 0.2, objectFit: 'contain' }} />}
              <div style={{ fontSize: fs(7), fontWeight: 700, color: '#fff', fontFamily: tc.fontFamily }}>{tc.schoolName}</div>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '4px 8px', gap: 6 }}>
              <div style={{ width: ph * 0.32, height: ph * 0.32, borderRadius: '50%', background: `${side.primaryColor}20`, border: `1.5px solid ${side.primaryColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: ph * 0.1, fontWeight: 700, color: side.primaryColor, flexShrink: 0, overflow: 'hidden' }}>
                {side.showPhoto && s.photoUrl ? <img src={s.photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                {side.showName && <div style={{ fontSize: fs(9), fontWeight: 700, color: side.primaryColor, fontFamily: tc.fontFamily, lineHeight: 1.1 }}>{s.name}</div>}
                {side.showRole && <div style={{ fontSize: fs(7), color: '#555', fontFamily: tc.fontFamily }}>{s.role}</div>}
                {side.showClass && <div style={{ fontSize: fs(6.5), color: '#888', fontFamily: tc.fontFamily }}>{s.className}</div>}
                {side.showStudentId && s.studentId && <div style={{ fontSize: fs(6.5), color: side.primaryColor, fontFamily: tc.fontFamily, fontWeight: 600, marginTop: 1 }}>{s.studentId}</div>}
              </div>
            </div>
            <div style={{ height: 3 * scale, background: side.accentColor }} />
          </> : <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 10, textAlign: 'center' }}>
            {side.showLogo && tc.logoUrl && <img src={tc.logoUrl} style={{ height: ph * 0.2, objectFit: 'contain', marginBottom: 8, opacity: 0.7 }} />}
            <div style={{ fontSize: fs(6.5), color: side.primaryColor, fontFamily: tc.fontFamily, lineHeight: 1.5 }}>{side.customText || 'Return to school office if found.'}</div>
            <div style={{ width: '60%', height: 3 * scale, background: side.accentColor, borderRadius: 2, marginTop: 8 }} />
          </div>}
        </div>
      )

      return (
        <div style={{ width: pw, height: ph, background: side.bgColor, ...patternBg, borderRadius: tc.cornerRadius * scale, border: '1px solid #ddd', display: 'flex', flexDirection: 'column', overflow: 'hidden', cursor: showBothSides ? 'pointer' : 'default' }} onClick={() => showBothSides && setFlip(f => !f)}>
          {isFront ? <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderBottom: '1px dashed #ccc' }}>
              {side.showName && <div style={{ fontSize: fs(9), fontWeight: 700, color: side.primaryColor, fontFamily: tc.fontFamily, textAlign: 'center', padding: '0 6px', lineHeight: 1.2 }}>{s.name}</div>}
              {side.showRole && <div style={{ fontSize: fs(7), color: '#666', fontFamily: tc.fontFamily }}>{s.role}</div>}
              {side.showStudentId && s.studentId && <div style={{ fontSize: fs(6.5), color: '#888', fontFamily: tc.fontFamily, marginTop: 2 }}>{s.studentId}</div>}
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {side.showLogo && tc.logoUrl ? <img src={tc.logoUrl} style={{ maxHeight: ph * 0.2, objectFit: 'contain', opacity: 0.4 }} /> : <div style={{ fontSize: fs(6), color: '#aaa', fontFamily: tc.fontFamily }}>{tc.schoolName}</div>}
            </div>
          </> : <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
            <div style={{ fontSize: fs(6.5), color: side.primaryColor, fontFamily: tc.fontFamily, textAlign: 'center', lineHeight: 1.5 }}>{side.customText || tc.schoolName}</div>
          </div>}
        </div>
      )
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        {cardContent()}
        {showBothSides && (
          <div style={{ fontSize: 10, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 3 }}>
            <RotateCcw size={9} /> Click to flip
          </div>
        )}
      </div>
    )
  }

  const setTC = (patch: Partial<TagConfig>) => setTagConfig(t => ({ ...t, ...patch }))

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div style={{ paddingBottom: 40, animation: '_fadeIn 0.3s ease' }}>
      <style>{`
        @keyframes _fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .el-item{transition:background .12s}
        .el-item:hover{background:#f9fafb!important}
        .el-item.sel{background:#f5f3ff!important;border-color:#c4b5fd!important}
        .tab-btn{padding:8px 18px;border-radius:8px;border:none;cursor:pointer;font-weight:600;font-size:13.5px;transition:all .15s}
        .tab-btn.active{background:#6d28d9;color:#fff}
        .tab-btn:not(.active){background:#f3f4f6;color:#6b7280}
        .tab-btn:not(.active):hover{background:#e9e9f0;color:#374151}
        .ctrl-btn{display:flex;align-items:center;gap:5px;padding:6px 12px;border-radius:7px;border:1px solid #e5e7eb;background:#fff;font-size:12px;cursor:pointer;font-weight:500;color:#374151;transition:all .12s}
        .ctrl-btn:hover{background:#f9fafb;border-color:#d1d5db}
        .ctrl-btn.danger:hover{background:#fef2f2;border-color:#fca5a5;color:#dc2626}
        .ctrl-btn.primary{background:#6d28d9;color:#fff;border-color:#6d28d9}
        .ctrl-btn.primary:hover{background:#5b21b6}
        .tpl-card{border:1.5px solid #f3f4f6;border-radius:10px;padding:10px 12px;cursor:pointer;transition:all .15s;background:#fff;text-align:left;}
        .tpl-card:hover{border-color:#c4b5fd;background:#f5f3ff;transform:translateY(-1px);}
        .side-tab{padding:6px 14px;border-radius:7px;border:none;cursor:pointer;font-size:12px;font-weight:600;transition:all .12s;}
        .side-tab.active{background:#6d28d9;color:#fff;}
        .side-tab:not(.active){background:#f3f4f6;color:#6b7280;}
        .side-tab:not(.active):hover{background:#e9e9f0;}
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Design Studio</h1>
          <p style={{ color: '#9ca3af', marginTop: 3, fontSize: 13 }}>Create posters, ID cards, and student tags for any school event.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6, background: '#f3f4f6', padding: 4, borderRadius: 10 }}>
            <button className={`tab-btn${activeTab === 'poster' ? ' active' : ''}`} onClick={() => setActiveTab('poster')}>
              <Layout size={14} style={{ marginRight: 5, verticalAlign: 'middle' }} />Poster
            </button>
            <button className={`tab-btn${activeTab === 'tags' ? ' active' : ''}`} onClick={() => setActiveTab('tags')}>
              <Tag size={14} style={{ marginRight: 5, verticalAlign: 'middle' }} />Tag Maker
            </button>
            <button className={`tab-btn${activeTab === 'flyer' ? ' active' : ''}`} onClick={() => setActiveTab('flyer')}>
              <Megaphone size={14} style={{ marginRight: 5, verticalAlign: 'middle' }} />Flyer / Share
            </button>
          </div>
          {activeTab === 'poster' && (
            <>
              <button onClick={savePDF}
                style={{ padding: '9px 16px', borderRadius: 10, background: '#fff', color: '#6d28d9', border: '1.5px solid #c4b5fd', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13 }}>
                <Download size={14} /> Save PDF
              </button>
              <button onClick={printPoster}
                style={{ padding: '9px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13.5 }}>
                <Printer size={15} /> Print
              </button>
            </>
          )}
          {activeTab === 'tags' && (
            <button onClick={printTags}
              style={{ padding: '9px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13.5 }}>
              <Printer size={15} /> Print Tags (Front + Back)
            </button>
          )}
          {activeTab === 'flyer' && (
            <>
              <button onClick={downloadFlyer} disabled={flyerExporting}
                style={{ padding: '9px 16px', borderRadius: 10, background: '#fff', color: '#6d28d9', border: '1.5px solid #c4b5fd', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13, opacity: flyerExporting ? 0.5 : 1 }}>
                <Download size={14} /> Download PNG
              </button>
              <button onClick={() => shareFlyer()} disabled={flyerExporting}
                style={{ padding: '9px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13.5, opacity: flyerExporting ? 0.5 : 1 }}>
                <Share2 size={15} /> {flyerExporting ? 'Capturing...' : 'Share'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ═══════════════════════ POSTER TAB ═══════════════════════ */}
      {activeTab === 'poster' && (
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

          {/* ── Left sidebar ── */}
          <div style={{ width: 270, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>

            {/* Elements list */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f3f4f6', padding: '14px 14px 10px', marginBottom: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Elements</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="ctrl-btn" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => addTextElement('title')} title="Add text"><Plus size={12} /> Text</button>
                  <button className="ctrl-btn" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => elemImgInputRef.current?.click()} title="Add image"><ImageIcon size={12} /> Img</button>
                  <button className="ctrl-btn" style={{ padding: '4px 8px', fontSize: 11 }} onClick={addShapeElement} title="Add shape"><Grid size={12} /></button>
                  <input ref={elemImgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => { if (e.target.files?.[0]) { await addImageElement(e.target.files[0]); e.target.value = '' } }} />
                </div>
              </div>

              {[...elements].sort((a, b) => b.zIndex - a.zIndex).map(el => (
                <div key={el.id}
                  className={`el-item${el.id === selectedId ? ' sel' : ''}`}
                  onClick={() => setSelectedId(el.id === selectedId ? null : el.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 7, border: '1px solid transparent', cursor: 'pointer', marginBottom: 3 }}>
                  <Move size={12} style={{ color: '#d1d5db', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {el.type === 'image' ? '🖼 Image' : el.type === 'shape' ? '⬜ Shape' : el.content.slice(0, 22) + (el.content.length > 22 ? '…' : '')}
                  </span>
                  <span style={{ fontSize: 10, color: '#d1d5db' }}>{el.type}</span>
                </div>
              ))}
              {elements.length === 0 && <div style={{ textAlign: 'center', fontSize: 12, color: '#d1d5db', padding: '10px 0' }}>No elements yet</div>}
            </div>

            {/* Element controls */}
            {selected && (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f3f4f6', padding: '14px', marginBottom: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Edit Element</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="ctrl-btn" style={{ padding: '3px 7px' }} onClick={() => moveZ('up')} title="Bring forward"><ChevronUp size={12} /></button>
                    <button className="ctrl-btn" style={{ padding: '3px 7px' }} onClick={() => moveZ('down')} title="Send back"><ChevronDown size={12} /></button>
                    <button className="ctrl-btn" style={{ padding: '3px 7px' }} onClick={duplicateSelected} title="Duplicate"><Copy size={12} /></button>
                    <button className="ctrl-btn danger" style={{ padding: '3px 7px' }} onClick={deleteSelected} title="Delete"><Trash2 size={12} /></button>
                  </div>
                </div>

                {(selected.type !== 'image' && selected.type !== 'shape') && (
                  <div style={field()}>
                    <label style={lbl}>Content</label>
                    <textarea rows={2} value={selected.content} onChange={e => updateEl(selected.id, { content: e.target.value })} style={{ ...inp(), resize: 'vertical' }} />
                  </div>
                )}

                {/* Image swap for image elements */}
                {selected.type === 'image' && (
                  <div style={field()}>
                    <label style={lbl}>Replace Image</label>
                    <input type="file" accept="image/*" onChange={async e => { if (e.target.files?.[0]) { const url = await readFile(e.target.files[0]); updateEl(selected.id, { imageUrl: url }); e.target.value = '' } }} style={{ ...inp(), padding: '4px 6px', fontSize: 11 }} />
                  </div>
                )}

                {selected.type !== 'image' && selected.type !== 'shape' && (
                  <>
                    <div style={field()}>
                      <label style={lbl}>Font</label>
                      <select value={selected.fontFamily} onChange={e => updateEl(selected.id, { fontFamily: e.target.value })} style={inp()}>
                        {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    </div>
                    <div style={{ ...field(), ...row }}>
                      <div style={{ flex: 1 }}>
                        <label style={lbl}>Size (pt)</label>
                        <input type="number" min={6} max={120} value={selected.fontSize} onChange={e => updateEl(selected.id, { fontSize: +e.target.value })} style={inp()} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={lbl}>Colour</label>
                        <input type="color" value={selected.color} onChange={e => updateEl(selected.id, { color: e.target.value })} style={{ ...inp(), height: 35, padding: 2, cursor: 'pointer' }} />
                      </div>
                    </div>
                    <div style={{ ...field(), display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button className="ctrl-btn" style={{ fontWeight: selected.bold ? 700 : 400, background: selected.bold ? '#ede9fe' : undefined }} onClick={() => updateEl(selected.id, { bold: !selected.bold })}>B</button>
                      <button className="ctrl-btn" style={{ fontStyle: 'italic', background: selected.italic ? '#ede9fe' : undefined }} onClick={() => updateEl(selected.id, { italic: !selected.italic })}>I</button>
                      {(['left', 'center', 'right'] as const).map(a => (
                        <button key={a} className="ctrl-btn" style={{ background: selected.align === a ? '#ede9fe' : undefined }} onClick={() => updateEl(selected.id, { align: a })}>
                          {a === 'left' ? <AlignLeft size={12} /> : a === 'center' ? <AlignCenter size={12} /> : <AlignRight size={12} />}
                        </button>
                      ))}
                    </div>
                    <div style={field()}>
                      <label style={lbl}>Background</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input type="color" value={selected.bgColor === 'transparent' ? '#ffffff' : selected.bgColor} onChange={e => updateEl(selected.id, { bgColor: e.target.value })} style={{ ...inp(), height: 32, padding: 2, flex: 1 }} />
                        <button className="ctrl-btn" style={{ fontSize: 11, padding: '3px 8px', color: '#9ca3af' }} onClick={() => updateEl(selected.id, { bgColor: 'transparent' })}>None</button>
                      </div>
                    </div>
                  </>
                )}

                {selected.type === 'shape' && (
                  <div style={{ ...field(), ...row }}>
                    <div style={{ flex: 1 }}>
                      <label style={lbl}>Fill</label>
                      <input type="color" value={selected.bgColor} onChange={e => updateEl(selected.id, { bgColor: e.target.value })} style={{ ...inp(), height: 32, padding: 2 }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={lbl}>Border</label>
                      <input type="color" value={selected.borderColor} onChange={e => updateEl(selected.id, { borderColor: e.target.value })} style={{ ...inp(), height: 32, padding: 2 }} />
                    </div>
                  </div>
                )}

                <div style={field()}>
                  <label style={lbl}>Width %</label>
                  <input type="range" min={5} max={100} value={selected.width} onChange={e => updateEl(selected.id, { width: +e.target.value })} style={{ width: '100%', accentColor: '#6d28d9' }} />
                </div>
                <div style={field()}>
                  <label style={lbl}>Opacity</label>
                  <input type="range" min={0.1} max={1} step={0.05} value={selected.opacity} onChange={e => updateEl(selected.id, { opacity: +e.target.value })} style={{ width: '100%', accentColor: '#6d28d9' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="lock-el" checked={selected.locked} onChange={e => updateEl(selected.id, { locked: e.target.checked })} />
                  <label htmlFor="lock-el" style={{ fontSize: 12, color: '#6b7280' }}>Lock position</label>
                </div>
              </div>
            )}
          </div>

          {/* ── Canvas ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
              {/* Template button */}
              <button className="ctrl-btn primary" style={{ fontSize: 12 }} onClick={() => setShowTemplates(t => !t)}>
                <Layers size={12} /> Templates
              </button>
              <div style={{ width: 1, height: 20, background: '#e5e7eb' }} />
              {(['landscape', 'portrait'] as const).map(o => (
                <button key={o} className="ctrl-btn" style={{ background: orientation === o ? '#ede9fe' : undefined, color: orientation === o ? '#6d28d9' : undefined, borderColor: orientation === o ? '#c4b5fd' : undefined, textTransform: 'capitalize', fontSize: 12 }} onClick={() => setOrientation(o)}>{o}</button>
              ))}
              <div style={{ width: 1, height: 20, background: '#e5e7eb' }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6b7280', cursor: 'pointer' }}>
                <input type="checkbox" checked={snapToGrid} onChange={e => setSnapToGrid(e.target.checked)} /> Snap to grid
              </label>
              <div style={{ width: 1, height: 20, background: '#e5e7eb' }} />
              <span style={{ fontSize: 11.5, color: '#9ca3af' }}>Drag elements to reposition • Click to select</span>
            </div>

            {/* Templates panel */}
            {showTemplates && (
              <div style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: 12, padding: 16, marginBottom: 14, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Choose a Template</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="ctrl-btn" style={{ fontSize: 11 }} onClick={() => setShowSaveDialog(true)}><Save size={11} /> Save Current</button>
                    <button className="ctrl-btn" style={{ fontSize: 11 }} onClick={() => setShowTemplates(false)}>✕ Close</button>
                  </div>
                </div>

                {/* Save dialog */}
                {showSaveDialog && (
                  <div style={{ background: '#f5f3ff', border: '1px solid #e0d9fa', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#6d28d9', marginBottom: 6, marginTop: 0 }}>Save Current Design as Template</p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input value={saveTemplateName} onChange={e => setSaveTemplateName(e.target.value)} placeholder="Template name..." style={inp({ flex: 1 })} />
                      <button className="ctrl-btn primary" style={{ fontSize: 12 }} onClick={saveCurrentAsTemplate} disabled={!saveTemplateName.trim()}>
                        <Save size={12} /> Save
                      </button>
                      <button className="ctrl-btn" style={{ fontSize: 12 }} onClick={() => setShowSaveDialog(false)}>Cancel</button>
                    </div>
                  </div>
                )}

                {/* Built-in templates */}
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 6, marginTop: 0 }}>Built-in Templates</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginBottom: customTemplates.length > 0 ? 14 : 0 }}>
                  {POSTER_TEMPLATES.map(tpl => {
                    const Icon = tpl.icon
                    return (
                      <button key={tpl.id} className="tpl-card" onClick={() => applyTemplate(tpl)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <div style={{ width: 26, height: 26, borderRadius: 6, background: tpl.primaryColor + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon size={13} style={{ color: tpl.primaryColor }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{tpl.name}</span>
                        </div>
                        <div style={{ fontSize: 10, color: '#9ca3af' }}>{tpl.category}</div>
                        <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
                          <div style={{ width: 12, height: 12, borderRadius: 3, background: tpl.bgColor, border: '1px solid #e5e7eb' }} />
                          <div style={{ width: 12, height: 12, borderRadius: 3, background: tpl.primaryColor }} />
                          <div style={{ width: 12, height: 12, borderRadius: 3, background: tpl.accentColor }} />
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Custom templates from Supabase */}
                {(customTemplates.length > 0 || loadingCustom) && (
                  <>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 6, marginTop: 0 }}>My Custom Templates</p>
                    {loadingCustom ? (
                      <div style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', padding: '12px 0' }}>Loading saved templates...</div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                        {customTemplates.map(ct => (
                          <div key={ct.id} className="tpl-card" style={{ position: 'relative' }}>
                            <div style={{ cursor: 'pointer' }} onClick={() => applyCustomTemplate(ct)}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <div style={{ width: 26, height: 26, borderRadius: 6, background: (ct.primary_color || '#6d28d9') + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <FolderOpen size={13} style={{ color: ct.primary_color || '#6d28d9' }} />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{ct.name}</span>
                              </div>
                              <div style={{ fontSize: 10, color: '#9ca3af' }}>{ct.category} · {ct.orientation}</div>
                              <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
                                <div style={{ width: 12, height: 12, borderRadius: 3, background: ct.bg_color || '#fff', border: '1px solid #e5e7eb' }} />
                                <div style={{ width: 12, height: 12, borderRadius: 3, background: ct.primary_color || '#6d28d9' }} />
                                <div style={{ width: 12, height: 12, borderRadius: 3, background: ct.accent_color || '#f59e0b' }} />
                              </div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); deleteCustomTemplate(ct.id) }}
                              style={{ position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: 5, border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, transition: 'all .12s' }}>
                              <Trash2 size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div
              ref={canvasRef}
              onClick={() => setSelectedId(null)}
              style={{ width: '100%', aspectRatio: canvasAspect, position: 'relative', background: bgColor, borderRadius: 10, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.13)', border: borderStyle === 'none' ? 'none' : `${Math.max(4, borderWidth * 0.7)}px ${borderStyle} ${primaryColor}`, cursor: 'default' }}>

              {bgImageUrl && <div style={{ position: 'absolute', inset: 0, backgroundImage: `url('${bgImageUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: bgImageOpacity, pointerEvents: 'none' }} />}

              {showDecorations && <>
                <div style={{ position: 'absolute', width: '45%', paddingTop: '45%', background: accentColor, borderRadius: '50%', opacity: 0.08, top: '-12%', right: '-12%', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', width: '55%', paddingTop: '55%', background: primaryColor, borderRadius: '50%', opacity: 0.05, bottom: '-18%', left: '-18%', pointerEvents: 'none' }} />
              </>}

              {showSchoolName && <div style={{ position: 'absolute', top: '5%', left: '50%', transform: 'translateX(-50%)', fontSize: '1.1vw', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: 2, whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 1 }}>{schoolName}</div>}

              {logoUrl && (
                <img src={logoUrl} onMouseDown={onLogoDragStart}
                  style={{ position: 'absolute', left: `${logoX}%`, top: `${logoY}%`, transform: 'translate(-50%,-50%)', maxHeight: `${logoSize}%`, maxWidth: '25%', objectFit: 'contain', cursor: 'move', zIndex: 5, userSelect: 'none' }}
                  draggable={false} alt="Logo" />
              )}

              {snapToGrid && <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(100,100,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(100,100,255,0.05) 1px,transparent 1px)', backgroundSize: `${gridSize}% ${gridSize}%`, zIndex: 1 }} />}

              {[...elements].sort((a, b) => a.zIndex - b.zIndex).map(el => (
                <div key={el.id}
                  onMouseDown={e => onMouseDown(e, el.id)}
                  onClick={e => { e.stopPropagation(); setSelectedId(el.id) }}
                  style={{ position: 'absolute', left: `${el.x}%`, top: `${el.y}%`, transform: 'translate(-50%,-50%)', width: `${el.width}%`, zIndex: el.zIndex, opacity: el.opacity, cursor: el.locked ? 'not-allowed' : 'move', outline: el.id === selectedId ? '2px solid #7c3aed' : '2px solid transparent', outlineOffset: 3, borderRadius: 4, userSelect: 'none' }}>
                  {el.type === 'image'
                    ? <img src={el.imageUrl} style={{ width: '100%', display: 'block', objectFit: 'contain', pointerEvents: 'none' }} draggable={false} />
                    : el.type === 'shape'
                      ? <div style={{ width: '100%', paddingTop: '60%', background: el.bgColor, border: `${el.borderWidth}px solid ${el.borderColor}`, borderRadius: 8 }} />
                      : <div style={{ fontFamily: el.fontFamily, fontSize: `${el.fontSize * 0.045}vw`, fontWeight: el.bold ? 700 : 400, fontStyle: el.italic ? 'italic' : 'normal', color: el.color, textAlign: el.align, background: el.bgColor, padding: el.bgColor !== 'transparent' ? '0.3em 0.8em' : 0, borderRadius: el.bgColor !== 'transparent' ? '40px' : 0, lineHeight: 1.2, pointerEvents: 'none', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{el.content}</div>
                  }
                </div>
              ))}
            </div>
          </div>

          {/* ── Right sidebar ── */}
          <div style={{ width: 230, flexShrink: 0, background: '#fff', borderRadius: 12, border: '1px solid #f3f4f6', padding: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' }}>
            <p style={{ ...secH, marginTop: 0 }}>Canvas</p>
            <div style={field()}>
              <label style={lbl}>Background Color</label>
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ ...inp(), height: 34, padding: 2 }} />
            </div>
            <div style={field()}>
              <label style={lbl}>Primary Color</label>
              <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={{ ...inp(), height: 34, padding: 2 }} />
            </div>
            <div style={field()}>
              <label style={lbl}>Accent Color</label>
              <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ ...inp(), height: 34, padding: 2 }} />
            </div>

            <p style={secH}>Background Image</p>
            <input ref={bgImgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => { if (e.target.files?.[0]) setBgImageUrl(await readFile(e.target.files[0])) }} />
            <button className="ctrl-btn" style={{ width: '100%', justifyContent: 'center', marginBottom: 6 }} onClick={() => bgImgInputRef.current?.click()}><ImageIcon size={12} /> {bgImageUrl ? 'Change BG Image' : 'Add BG Image'}</button>
            {bgImageUrl && (
              <>
                <label style={lbl}>Image Opacity</label>
                <input type="range" min={0.03} max={1} step={0.03} value={bgImageOpacity} onChange={e => setBgImageOpacity(+e.target.value)} style={{ width: '100%', accentColor: '#6d28d9', marginBottom: 6 }} />
                <button className="ctrl-btn danger" style={{ width: '100%', justifyContent: 'center', fontSize: 11 }} onClick={() => setBgImageUrl('')}><Trash2 size={11} /> Remove BG</button>
              </>
            )}

            <p style={secH}>Border</p>
            <div style={field()}>
              <label style={lbl}>Style</label>
              <select value={borderStyle} onChange={e => setBorderStyle(e.target.value)} style={inp()}>
                {BORDER_STYLES.map(b => <option key={b} value={b} style={{ textTransform: 'capitalize' }}>{b}</option>)}
              </select>
            </div>
            {borderStyle !== 'none' && (
              <div style={field()}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><label style={lbl}>Width</label><span style={{ fontSize: 11, color: '#9ca3af' }}>{borderWidth}mm</span></div>
                <input type="range" min={2} max={30} value={borderWidth} onChange={e => setBorderWidth(+e.target.value)} style={{ width: '100%', accentColor: '#6d28d9' }} />
              </div>
            )}

            <p style={secH}>Logo</p>
            <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => { if (e.target.files?.[0]) setLogoUrl(await readFile(e.target.files[0])) }} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              <button className="ctrl-btn" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }} onClick={() => logoInputRef.current?.click()}>{logoUrl ? 'Change' : 'Upload'} Logo</button>
              {logoUrl && <button className="ctrl-btn danger" style={{ fontSize: 11 }} onClick={() => setLogoUrl('')}><Trash2 size={11} /></button>}
            </div>
            {logoUrl && (
              <div style={field()}>
                <label style={lbl}>Logo Size %</label>
                <input type="range" min={4} max={30} value={logoSize} onChange={e => setLogoSize(+e.target.value)} style={{ width: '100%', accentColor: '#6d28d9' }} />
                <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>Drag the logo on the canvas to reposition</p>
              </div>
            )}

            <p style={secH}>School Label</p>
            <div style={field()}>
              <input type="text" value={schoolName} onChange={e => setSchoolName(e.target.value)} style={inp()} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <input type="checkbox" id="showSch" checked={showSchoolName} onChange={e => setShowSchoolName(e.target.checked)} />
              <label htmlFor="showSch" style={{ fontSize: 12, color: '#6b7280' }}>Show school name</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="showDeco" checked={showDecorations} onChange={e => setShowDecorations(e.target.checked)} />
              <label htmlFor="showDeco" style={{ fontSize: 12, color: '#6b7280' }}>Show decorations</label>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════ TAGS TAB ═══════════════════════ */}
      {activeTab === 'tags' && (
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

          {/* Tag settings */}
          <div style={{ width: 300, flexShrink: 0, background: '#fff', borderRadius: 12, border: '1px solid #f3f4f6', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' }}>

            <p style={{ ...secH, marginTop: 0 }}>Tag Style</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              {TAG_STYLES.map(ts => (
                <button key={ts.value} onClick={() => setTC({ style: ts.value })}
                  style={{ padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${tagConfig.style === ts.value ? '#7c3aed' : '#e5e7eb'}`, background: tagConfig.style === ts.value ? '#f5f3ff' : '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all .12s' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: tagConfig.style === ts.value ? '#6d28d9' : '#374151' }}>{ts.label}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{ts.desc}</div>
                </button>
              ))}
            </div>

            <p style={secH}>Dimensions</p>
            <div style={{ ...field(), ...row }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Width (mm)</label>
                <input type="number" min={30} max={120} value={tagConfig.width} onChange={e => setTC({ width: +e.target.value })} style={inp()} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Height (mm)</label>
                <input type="number" min={30} max={160} value={tagConfig.height} onChange={e => setTC({ height: +e.target.value })} style={inp()} />
              </div>
            </div>
            <div style={field()}>
              <label style={lbl}>Corner Radius (px)</label>
              <input type="range" min={0} max={20} value={tagConfig.cornerRadius} onChange={e => setTC({ cornerRadius: +e.target.value })} style={{ width: '100%', accentColor: '#6d28d9' }} />
            </div>

            <p style={secH}>Font</p>
            <div style={field()}>
              <select value={tagConfig.fontFamily} onChange={e => setTC({ fontFamily: e.target.value })} style={inp()}>
                {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>

            <p style={secH}>School Branding</p>
            <div style={field()}><input type="text" value={tagConfig.schoolName} onChange={e => setTC({ schoolName: e.target.value })} placeholder="School name" style={inp()} /></div>
            <input ref={tagLogoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => { if (e.target.files?.[0]) setTC({ logoUrl: await readFile(e.target.files[0]) }) }} />
            <button className="ctrl-btn" style={{ width: '100%', justifyContent: 'center', fontSize: 11, marginBottom: 10 }} onClick={() => tagLogoInputRef.current?.click()}><ImageIcon size={11} /> Upload School Logo</button>

            {/* ── FRONT / BACK side tabs ── */}
            <div style={{ display: 'flex', gap: 0, background: '#f3f4f6', borderRadius: 9, padding: 3, marginBottom: 12 }}>
              <button className={`side-tab${tagViewSide === 'front' ? ' active' : ''}`} style={{ flex: 1 }} onClick={() => setTagViewSide('front')}>
                ▶ Front Side
              </button>
              <button className={`side-tab${tagViewSide === 'back' ? ' active' : ''}`} style={{ flex: 1 }} onClick={() => setTagViewSide('back')}>
                ◀ Back Side
              </button>
            </div>

            <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 12px', border: '1px solid #f3f4f6' }}>
              <p style={{ ...secH, marginTop: 0 }}>Colors — {tagViewSide}</p>
              <div style={{ ...field(), ...row }}>
                <div style={{ flex: 1 }}><label style={lbl}>Background</label><input type="color" value={activeSide.bgColor} onChange={e => setActiveSide({ bgColor: e.target.value })} style={{ ...inp(), height: 32, padding: 2 }} /></div>
                <div style={{ flex: 1 }}><label style={lbl}>Primary</label><input type="color" value={activeSide.primaryColor} onChange={e => setActiveSide({ primaryColor: e.target.value })} style={{ ...inp(), height: 32, padding: 2 }} /></div>
                <div style={{ flex: 1 }}><label style={lbl}>Accent</label><input type="color" value={activeSide.accentColor} onChange={e => setActiveSide({ accentColor: e.target.value })} style={{ ...inp(), height: 32, padding: 2 }} /></div>
              </div>

              <p style={{ ...secH }}>Background Pattern</p>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                {(['none', 'dots', 'lines', 'diagonal'] as const).map(p => (
                  <button key={p} className="ctrl-btn" style={{ fontSize: 11, padding: '4px 9px', background: activeSide.pattern === p ? '#ede9fe' : undefined, color: activeSide.pattern === p ? '#6d28d9' : undefined, borderColor: activeSide.pattern === p ? '#c4b5fd' : undefined, textTransform: 'capitalize' }} onClick={() => setActiveSide({ pattern: p })}>{p}</button>
                ))}
              </div>

              {tagViewSide === 'front' && (
                <>
                  <p style={secH}>Show Fields</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 6 }}>
                    {([
                      ['showLogo', 'Logo'],
                      ['showPhoto', 'Student photo'],
                      ['showName', 'Name'],
                      ['showRole', 'Role/Position'],
                      ['showClass', 'Class'],
                      ['showStudentId', 'Student ID'],
                      ['showBarcode', 'Barcode'],
                    ] as const).map(([key, label]) => (
                      <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#6b7280', cursor: 'pointer' }}>
                        <input type="checkbox" checked={activeSide[key as keyof TagSide] as boolean} onChange={e => setActiveSide({ [key]: e.target.checked })} /> {label}
                      </label>
                    ))}
                  </div>
                </>
              )}

              {tagViewSide === 'back' && (
                <>
                  <p style={secH}>Show on Back</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                    {([['showLogo', 'Logo']] as const).map(([key, label]) => (
                      <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#6b7280', cursor: 'pointer' }}>
                        <input type="checkbox" checked={activeSide[key as keyof TagSide] as boolean} onChange={e => setActiveSide({ [key]: e.target.checked })} /> {label}
                      </label>
                    ))}
                  </div>
                  <p style={secH}>Back Text</p>
                  <textarea rows={3} value={activeSide.customText} onChange={e => setActiveSide({ customText: e.target.value })} placeholder="e.g. This card is property of the school. If found, please return to the school office." style={{ ...inp(), resize: 'vertical', fontSize: 11.5 }} />
                </>
              )}
            </div>
          </div>

          {/* Students + Preview */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Students list */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f3f4f6', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}><Users size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />Students / People</span>
                  <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 8 }}>{students.length} total</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="ctrl-btn" style={{ fontSize: 11 }} onClick={() => setShowBulk(b => !b)}>Bulk Import</button>
                </div>
              </div>

              {showBulk && (
                <div style={{ background: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 12, border: '1px solid #f3f4f6' }}>
                  <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>One per line: <code>Name, Role, Class</code></p>
                  <textarea rows={4} value={bulkText} onChange={e => setBulkText(e.target.value)} placeholder={"Ama Owusu, Head Prefect, Class 3A\nKofi Mensah, Student, Class 2B"} style={{ ...inp(), resize: 'vertical', marginBottom: 8, fontFamily: 'monospace', fontSize: 12 }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="ctrl-btn primary" style={{ flex: 1, justifyContent: 'center' }} onClick={importBulk}>Import</button>
                    <button className="ctrl-btn" onClick={() => setShowBulk(false)}>Cancel</button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <input placeholder="Full name" value={newStudent.name} onChange={e => setNewStudent(s => ({ ...s, name: e.target.value }))} style={{ ...inp(), flex: 2, minWidth: 100 }} />
                <input placeholder="Role" value={newStudent.role} onChange={e => setNewStudent(s => ({ ...s, role: e.target.value }))} style={{ ...inp(), flex: 1, minWidth: 70 }} />
                <input placeholder="Class" value={newStudent.className} onChange={e => setNewStudent(s => ({ ...s, className: e.target.value }))} style={{ ...inp(), flex: 1, minWidth: 70 }} />
                <button className="ctrl-btn primary" onClick={() => {
                  if (!newStudent.name.trim()) return
                  setStudents(s => [...s, { id: uid(), ...newStudent }])
                  setNewStudent({ name: '', role: 'Student', className: '' })
                }}><Plus size={13} /> Add</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
                {loadingStudents ? (
                  <div style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af', padding: '20px 0' }}>Loading students...</div>
                ) : (
                  <>
                    {students.map(s => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: '#f9fafb', border: '1px solid #f3f4f6' }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: tagConfig.front.primaryColor + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: tagConfig.front.primaryColor, flexShrink: 0 }}>{s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.role}{s.className ? ` · ${s.className}` : ''}</div>
                        </div>
                        <button className="ctrl-btn danger" style={{ padding: '3px 7px', flexShrink: 0 }} onClick={() => setStudents(st => st.filter(x => x.id !== s.id))}><Trash2 size={11} /></button>
                      </div>
                    ))}
                    {students.length === 0 && <div style={{ textAlign: 'center', fontSize: 13, color: '#d1d5db', padding: '16px 0' }}>No students added yet</div>}
                  </>
                )}
              </div>
            </div>

            {/* A4 pack info */}
            {students.length > 0 && (() => {
              const tagW = mmToPx(tagConfig.width), tagH = mmToPx(tagConfig.height)
              const pageW = mmToPx(210), pageH = mmToPx(297)
              const margin = mmToPx(8), gap = mmToPx(4)
              const cols = Math.floor((pageW - margin * 2 + gap) / (tagW + gap))
              const rows = Math.floor((pageH - margin * 2 + gap) / (tagH + gap))
              const perPage = cols * rows
              const pages = Math.ceil(students.length / perPage)
              return (
                <div style={{ background: '#f5f3ff', border: '1px solid #e0d9fa', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>
                  <strong style={{ color: '#6d28d9' }}>{cols} × {rows}</strong> <span style={{ color: '#7c3aed' }}>= {perPage} tags per A4 page</span>
                  {' · '}
                  <span style={{ color: '#6b7280' }}>{students.length} people → <strong>{pages} page{pages !== 1 ? 's' : ''} front</strong> + <strong>{pages} page{pages !== 1 ? 's' : ''} back</strong> = <strong>{pages * 2} total pages</strong></span>
                </div>
              )
            })()}

            {/* Tag preview grid */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f3f4f6', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: 0 }}>Tag Preview</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#9ca3af' }}>
                  <RotateCcw size={11} /> Click any tag to flip front/back
                </div>
              </div>
              {students.length === 0
                ? <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                  <TagPreview showBothSides s={{ id: 'demo', name: 'Sample Student', role: 'Head Prefect', className: 'Class 3A', studentId: 'STU-001' }} />
                </div>
                : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                  {students.slice(0, 6).map(s => <TagPreview key={s.id} s={s} showBothSides />)}
                  {students.length > 6 && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#9ca3af', width: 80 }}>+{students.length - 6} more</div>}
                </div>
              }
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════ FLYER / SHARE TAB ═══════════════════════ */}
      {activeTab === 'flyer' && (
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

          {/* Left: Format & Share options */}
          <div style={{ width: 280, flexShrink: 0, background: '#fff', borderRadius: 12, border: '1px solid #f3f4f6', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' }}>

            <p style={{ ...secH, marginTop: 0 }}>Social Format</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              {SOCIAL_FORMATS.map(fmt => (
                <button key={fmt.id} onClick={() => setFlyerFormat(fmt)}
                  style={{ padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${flyerFormat.id === fmt.id ? '#7c3aed' : '#e5e7eb'}`, background: flyerFormat.id === fmt.id ? '#f5f3ff' : '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all .12s' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: flyerFormat.id === fmt.id ? '#6d28d9' : '#374151' }}>{fmt.label}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{fmt.w} × {fmt.h}px</div>
                </button>
              ))}
            </div>

            <p style={secH}>Share To</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              <button className="ctrl-btn" style={{ width: '100%', justifyContent: 'center', background: '#25d366', color: '#fff', borderColor: '#25d366' }} onClick={() => shareFlyer('whatsapp')} disabled={flyerExporting}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </button>
              <button className="ctrl-btn" style={{ width: '100%', justifyContent: 'center', background: '#1877f2', color: '#fff', borderColor: '#1877f2' }} onClick={() => shareFlyer('facebook')} disabled={flyerExporting}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
              </button>
              <button className="ctrl-btn" style={{ width: '100%', justifyContent: 'center', background: '#000000', color: '#fff', borderColor: '#000000' }} onClick={() => shareFlyer('twitter')} disabled={flyerExporting}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                X (Twitter)
              </button>
              <button className="ctrl-btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => shareFlyer('copy')} disabled={flyerExporting}>
                <Copy size={13} /> Copy to Clipboard
              </button>
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#166534', lineHeight: 1.5, marginBottom: 10 }}>
              <strong>💡 Tip:</strong> On mobile, the <strong>Share</strong> button opens your device's native share sheet— supporting WhatsApp, Telegram, Instagram, and any installed app.
            </div>

            <p style={secH}>How it works</p>
            <ol style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6, paddingLeft: 18, margin: 0 }}>
              <li>Design your poster in the <strong>Poster</strong> tab</li>
              <li>Switch to <strong>Flyer / Share</strong></li>
              <li>Pick a social format (Instagram, WhatsApp, etc.)</li>
              <li>Click <strong>Share</strong> or download as PNG</li>
            </ol>
          </div>

          {/* Right: Flyer preview canvas */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ background: '#f9fafb', borderRadius: 12, border: '1px solid #f3f4f6', padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12, alignSelf: 'flex-start' }}>Flyer Preview — {flyerFormat.label}</p>

              {/* Scaled preview wrapper */}
              <div style={{ width: '100%', maxWidth: 600, position: 'relative' }}>
                <div style={{ width: '100%', aspectRatio: `${flyerFormat.w} / ${flyerFormat.h}`, position: 'relative', overflow: 'hidden' }}>
                  {/* Actual capture target */}
                  <div
                    ref={flyerCanvasRef}
                    style={{
                      width: flyerFormat.w,
                      height: flyerFormat.h,
                      position: 'relative',
                      overflow: 'hidden',
                      backgroundColor: bgColor,
                      border: borderStyle === 'none' ? 'none' : `${Math.max(4, borderWidth)}px ${borderStyle} ${primaryColor}`,
                      boxSizing: 'border-box',
                      transform: `scale(${Math.min(600 / flyerFormat.w, 500 / flyerFormat.h)})`,
                      transformOrigin: 'top left',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {/* BG image */}
                    {bgImageUrl && <div style={{ position: 'absolute', inset: 0, backgroundImage: `url('${bgImageUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: bgImageOpacity, pointerEvents: 'none' }} />}

                    {/* Decorations */}
                    {showDecorations && <>
                      <div style={{ position: 'absolute', width: '45%', paddingTop: '45%', background: accentColor, borderRadius: '50%', opacity: 0.08, top: '-12%', right: '-12%', pointerEvents: 'none' }} />
                      <div style={{ position: 'absolute', width: '55%', paddingTop: '55%', background: primaryColor, borderRadius: '50%', opacity: 0.05, bottom: '-18%', left: '-18%', pointerEvents: 'none' }} />
                    </>}

                    {/* School name */}
                    {showSchoolName && <div style={{ position: 'absolute', top: '5%', left: '50%', transform: 'translateX(-50%)', fontSize: `${flyerFormat.w * 0.018}px`, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: 2, whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 1 }}>{schoolName}</div>}

                    {/* Logo */}
                    {logoUrl && <img src={logoUrl} style={{ position: 'absolute', left: `${logoX}%`, top: `${logoY}%`, transform: 'translate(-50%,-50%)', maxHeight: `${logoSize}%`, maxWidth: '20%', objectFit: 'contain', zIndex: 5, userSelect: 'none', pointerEvents: 'none' }} draggable={false} alt="" />}

                    {/* Elements */}
                    {[...elements].sort((a, b) => a.zIndex - b.zIndex).map(el => (
                      <div key={el.id} style={{ position: 'absolute', left: `${el.x}%`, top: `${el.y}%`, transform: 'translate(-50%,-50%)', width: `${el.width}%`, zIndex: el.zIndex, opacity: el.opacity, userSelect: 'none' }}>
                        {el.type === 'image'
                          ? <img src={el.imageUrl} style={{ width: '100%', display: 'block', objectFit: 'contain' }} draggable={false} />
                          : el.type === 'shape'
                            ? <div style={{ width: '100%', paddingTop: '60%', background: el.bgColor, border: `${el.borderWidth}px solid ${el.borderColor}`, borderRadius: 8 }} />
                            : <div style={{ fontSize: `${el.fontSize * (flyerFormat.w / 800)}pt`, fontFamily: el.fontFamily, color: el.color, fontWeight: el.bold ? 900 : 400, fontStyle: el.italic ? 'italic' : 'normal', textAlign: el.align, background: el.bgColor, border: `${el.borderWidth}px solid ${el.borderColor}`, padding: el.bgColor !== 'transparent' ? '6px 16px' : 0, borderRadius: el.bgColor !== 'transparent' ? 40 : 0, lineHeight: 1.2, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{el.content}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {flyerExporting && (
                <div style={{ marginTop: 12, padding: '8px 16px', background: '#f5f3ff', borderRadius: 8, fontSize: 13, color: '#6d28d9', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={14} /> Generating image...
                </div>
              )}

              <div style={{ marginTop: 16, padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, fontSize: 12.5, color: '#92400e', lineHeight: 1.5, width: '100%', boxSizing: 'border-box' }}>
                ⚠️ This flyer uses your current <strong>Poster</strong> tab design. Edit the poster first, then come here to export and share it in social media-friendly formats.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}