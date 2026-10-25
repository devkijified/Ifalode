'use client'

import { Course } from '@/types'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'
import {
  LevelBadge,
  PosterFallback,
  Price,
  ProgressBar,
} from '@/components/ui/primitives'

interface CourseCardProps {
  course: Course
  enrolled?: boolean
  progress?: number
}

export const CourseCard = ({ course, enrolled, progress }: CourseCardProps) => {
  const hasProgress = enrolled && typeof progress === 'number'
  const pct = hasProgress ? Math.max(0, Math.min(100, Math.round(progress))) : 0

  return (
    <Link href={`/courses/${course.id}`} className="group block">
      <article className="overflow-hidden rounded-2xl border border-cream/10 bg-ink-850 shadow-card transition duration-300 lg:group-hover:-translate-y-1 lg:group-hover:border-cream/20">
        {/* 16:9 poster */}
        <div className="relative aspect-video overflow-hidden bg-ink-800">
          {course.cover_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.cover_image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition duration-500 lg:group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <PosterFallback title={course.title} className="absolute inset-0" />
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink-950/70 to-transparent" />
          {enrolled && (
            <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-ink-950/85 px-2 py-1 text-meta font-bold uppercase tracking-wider text-gold backdrop-blur-sm">
              <Icon name="check" size={12} variant="Bold" />
              Enrolled
            </span>
          )}
          {hasProgress && pct > 0 && pct < 100 && (
            <span className="absolute bottom-3 left-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-cream text-ink-950 shadow-card transition lg:group-hover:bg-gold-light">
              <Icon name="play" size={16} variant="Bold" />
            </span>
          )}
        </div>

        <div className="p-4">
          {/* Title */}
          <h3 className="line-clamp-2 min-h-[44px] font-sans text-lead font-semibold leading-snug text-cream transition lg:group-hover:text-gold-light">
            {course.title}
          </h3>

          {/* Instructor */}
          {course.instructor && (
            <p className="mt-1.5 flex items-center gap-1.5 text-caption text-cream-dim">
              <span className="shrink-0 text-cream-faint">
                <Icon name="teacher" size={14} />
              </span>
              <span className="line-clamp-1">{course.instructor}</span>
            </p>
          )}

          {/* Meta row */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <LevelBadge level={course.level} />
            {course.category && (
              <span className="text-caption font-medium text-cream-faint">
                {course.category}
              </span>
            )}
          </div>

          {/* Footer: progress for learners, exact price for everyone else */}
          {hasProgress ? (
            <div className="mt-4">
              <ProgressBar value={pct} />
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-caption font-semibold text-cream-dim">
                  {pct}% complete
                </span>
                <span className="inline-flex items-center gap-1 text-caption font-bold text-gold">
                  <Icon name="play" size={13} variant="Bold" />
                  {pct > 0 ? 'Resume' : 'Start'}
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-between border-t border-cream/10 pt-3.5">
              <Price amount={course.price} className="text-lead text-cream" />
              <span className="inline-flex items-center gap-1 text-caption font-bold text-gold transition lg:group-hover:text-gold-light">
                {enrolled ? 'Continue' : 'View course'}
                <Icon name="next" size={14} variant="Bold" />
              </span>
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}
