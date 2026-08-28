'use client'

import { Course } from '@/types'
import Link from 'next/link'

interface CourseCardProps {
  course: Course
}

export const CourseCard = ({ course }: CourseCardProps) => {
  // Get icon based on course title
  const getIcon = (title: string) => {
    const icons = ['📘', '🧠', '💼', '💻', '🎯', '📚', '✨', '🌟', '🪷', '🔮', '📿', '🕯️']
    const index = title.length % icons.length
    return icons[index]
  }

  // Get color based on level
  const getLevelColor = (level: string | null) => {
    switch (level) {
      case 'beginner': return 'from-green-500/20 to-transparent'
      case 'intermediate': return 'from-orange-500/20 to-transparent'
      case 'advanced': return 'from-red-500/20 to-transparent'
      default: return 'from-brand-primary/20 to-transparent'
    }
  }

  const getLevelBadgeColor = (level: string | null) => {
    switch (level) {
      case 'beginner': return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'intermediate': return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
      case 'advanced': return 'bg-red-500/10 text-red-400 border-red-500/20'
      default: return 'bg-brand-primary/10 text-brand-primary border-brand-primary/20'
    }
  }

  return (
    <Link href={`/courses/${course.id}`}>
      <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition-all hover:border-slate-700 hover:translate-y-[-4px] hover:shadow-xl hover:shadow-brand-primary/5">
        
        {/* Gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${getLevelColor(course.level)} opacity-50`} />
        
        <div className="relative p-5">
          {/* Header with icon and level badge */}
          <div className="flex items-start justify-between mb-4">
            <div className="text-3xl">{getIcon(course.title)}</div>
            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${getLevelBadgeColor(course.level)}`}>
              {course.level || 'All Levels'}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-white text-lg mb-1 line-clamp-1 group-hover:text-brand-primary transition">
            {course.title}
          </h3>

          {/* Description */}
          <p className="text-slate-400 text-sm line-clamp-2 mb-4">
            {course.description || 'No description available'}
          </p>

          {/* Instructor */}
          {course.instructor && (
            <p className="text-xs text-slate-500 mb-4">
              👤 {course.instructor}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <span className="text-xl font-bold text-brand-primary">
              {course.price ? `$${course.price}` : 'Free'}
            </span>
            <span className="text-sm text-slate-500 group-hover:text-brand-primary transition">
              Enroll →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
