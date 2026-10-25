'use client'

import {
  Add,
  ArrowDown2,
  ArrowLeft,
  ArrowRight2,
  Award,
  Book1,
  Calendar,
  Clock,
  CloseCircle,
  DocumentDownload,
  Eye,
  Heart,
  Home2,
  InfoCircle,
  Like1,
  Lock1,
  Logout,
  Menu,
  Copy,
  Gift,
  MessageQuestion,
  Messages1,
  Microphone2,
  Monitor,
  Next,
  Note1,
  Notification,
  Pause,
  People,
  Play,
  PlayCircle,
  Previous,
  ProfileCircle,
  RecordCircle,
  SearchNormal1,
  Send2,
  Share,
  ShoppingBag,
  Star1,
  Teacher,
  TickCircle,
  Ticket,
  Video,
  VideoPlay,
  Warning2,
} from 'iconsax-react'

/**
 * Kijitech style: ONE semantic icon wrapper for the whole app.
 * Every surface asks for an icon by meaning, never by glyph name,
 * so the icon language stays consistent and swappable in one place.
 * Source set: IconSax. No emoji icons anywhere in the app.
 */
const MAP = {
  home: Home2,
  book: Book1,
  live: VideoPlay,
  bag: ShoppingBag,
  learn: Teacher,
  teacher: Teacher,
  search: SearchNormal1,
  play: Play,
  playCircle: PlayCircle,
  pause: Pause,
  next: Next,
  prev: Previous,
  star: Star1,
  clock: Clock,
  calendar: Calendar,
  eye: Eye,
  chat: Messages1,
  send: Send2,
  mic: Microphone2,
  video: Video,
  hand: Like1,
  close: CloseCircle,
  check: TickCircle,
  checkPlain: TickCircle,
  lock: Lock1,
  back: ArrowLeft,
  forward: ArrowRight2,
  chevron: ArrowDown2,
  download: DocumentDownload,
  share: Share,
  heart: Heart,
  people: People,
  menu: Menu,
  logout: Logout,
  plus: Add,
  note: Note1,
  award: Award,
  profile: ProfileCircle,
  info: InfoCircle,
  warning: Warning2,
  record: RecordCircle,
  screen: Monitor,
  bell: Notification,
  copy: Copy,
  ticket: Ticket,
  support: MessageQuestion,
  gift: Gift,
} as const

export type IconName = keyof typeof MAP

export function Icon({
  name,
  size = 20,
  variant = 'Linear',
  color = 'currentColor',
  className = '',
}: {
  name: IconName
  size?: number
  variant?: 'Linear' | 'Bold' | 'Outline' | 'Broken' | 'Bulk' | 'TwoTone'
  color?: string
  className?: string
}) {
  const Glyph = MAP[name]
  return (
    <Glyph
      size={size}
      variant={variant}
      color={color}
      className={className}
      aria-hidden="true"
    />
  )
}
