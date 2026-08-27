'use client'

import { Course } from '@/types'
import Link from 'next/link'

interface CourseCardProps {
  course: Course
}

export const CourseCard = ({ course }: CourseCardProps) => {
  return (
    <Link href={`/courses/${course.id}`}>
      <div className="bg-slate-900 rounded-2xl border border-slate-800 hover:border-brand-primary/40 transition-all hover:translate-y-[-4px] hover:shadow-xl hover:shadow-brand-primary/5 overflow-hidden">
        {/* ... rest of component */}
        <div className="p-4">
          <h3 className="font-semibold text-white text-lg mb-1 line-clamp-1">{course.title}</h3>
          <p className="text-slate-400 text-sm line-clamp-2 mb-3">{course.description}</p>
          <div className="flex justify-between items-center">
            {/* ✅ Uses brand-primary for price */}
            <span className="text-xl font-bold text-brand-primary">
              {course.price ? `$${course.price}` : 'Free'}
            </span>
            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full capitalize">
              {course.level}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
