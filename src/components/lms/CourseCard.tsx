'use client'

import { Course } from '@/types'
import Link from 'next/link'

interface CourseCardProps {
  course: Course
}

export const CourseCard = ({ course }: CourseCardProps) => {
  return (
    <Link href={`/courses/${course.id}`}>
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden">
        <div className="aspect-video bg-gray-100 flex items-center justify-center">
          {course.cover_image ? (
            <img src={course.cover_image} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl text-gray-400">🎓</span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-1">{course.title}</h3>
          <p className="text-gray-600 text-sm line-clamp-2 mb-2">{course.description}</p>
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold text-brand-primary">
              {course.price ? `$${course.price}` : 'Free'}
            </span>
            <span className="text-sm text-gray-500 capitalize">{course.level}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
