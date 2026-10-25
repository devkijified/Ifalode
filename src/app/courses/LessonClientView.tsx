'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Icon } from '@/components/ui/Icon'
import { ProgressBar } from '@/components/ui/primitives'
import { formatDuration } from '@/lib/format'

interface LessonClientViewProps {
  course: any
  modules?: any[]
  lessons: any[]
  initialLesson: any
  initialNotes?: any[]
  initialQa?: any[]
  initialReviews?: any[]
  initialQuizzes?: any[]
  initialProgress: number
  userId: string
}

export default function LessonClientView({
  course,
  modules = [],
  lessons,
  initialLesson,
  initialNotes = [],
  initialQa = [],
  initialReviews = [],
  initialQuizzes = [],
  initialProgress,
  userId
}: LessonClientViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activeLesson, setActiveLesson] = useState(initialLesson)
  const [activeTab, setActiveTab] = useState<'curriculum' | 'notes' | 'qa' | 'reviews'>('curriculum')
  const [notes, setNotes] = useState(initialNotes)
  const [newNote, setNewNote] = useState('')
  const [qaList, setQaList] = useState(initialQa)
  const [newQuestion, setNewQuestion] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [progress, setProgress] = useState(initialProgress)
  const reviews = initialReviews

  // Handle lesson switching via URL state
  const handleSelectLesson = (lesson: any) => {
    setActiveLesson(lesson)
    const params = new URLSearchParams(searchParams.toString())
    params.set('lesson', lesson.id)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return
    setIsSubmitting(true)
    const mockNote = { id: Date.now(), note: newNote, created_at: new Date().toISOString() }
    setNotes([mockNote, ...notes])
    setNewNote('')
    setIsSubmitting(false)
  }

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuestion.trim()) return
    setIsSubmitting(true)
    const mockQa = { id: Date.now(), question: newQuestion, created_at: new Date().toISOString(), user_id: userId }
    setQaList([mockQa, ...qaList])
    setNewQuestion('')
    setIsSubmitting(false)
  }

  const currentLessonIndex = lessons.findIndex(l => l.id === activeLesson.id)
  const prevLesson = currentLessonIndex > 0 ? lessons[currentLessonIndex - 1] : null
  const nextLesson = currentLessonIndex < lessons.length - 1 ? lessons[currentLessonIndex + 1] : null
  const progressPct = Math.max(0, Math.min(100, Math.round(progress || 0)))

  const tabs: { key: 'curriculum' | 'notes' | 'qa' | 'reviews'; label: string }[] = [
    { key: 'curriculum', label: 'Curriculum' },
    { key: 'notes', label: `Notes (${notes.length})` },
    { key: 'qa', label: `Q and A (${qaList.length})` },
    { key: 'reviews', label: `Reviews (${reviews.length})` },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-ink-950 text-cream selection:bg-gold selection:text-ink-950">
      {/* Top bar */}
      <header className="pt-safe sticky top-0 z-40 border-b border-cream/10 bg-ink-950/95 backdrop-blur-xl">
        <div className="flex min-h-[56px] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border border-cream/15 px-3 text-body font-semibold text-cream-dim transition hover:border-cream/30 hover:text-cream"
            >
              <Icon name="back" size={18} />
              <span className="hidden sm:inline">My learning</span>
            </Link>
            <span className="hidden h-5 w-px bg-cream/10 sm:block" aria-hidden="true" />
            <h1 className="truncate font-display text-body tracking-tight text-cream sm:text-lead">{course.title}</h1>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-caption font-medium text-cream-dim md:inline">Course progress</span>
            <ProgressBar value={progressPct} className="hidden w-28 sm:block" />
            <span className="text-caption font-bold text-gold">{progressPct}%</span>
          </div>
        </div>
      </header>

      {/* Main learning grid */}
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-12">
        {/* Main column: theatre, lesson header, content */}
        <div className="flex flex-col border-cream/10 bg-ink-950 lg:col-span-8 lg:border-r xl:col-span-9">
          {/* Video theatre */}
          <div className="relative aspect-video w-full overflow-hidden bg-black">
            {activeLesson.video_url ? (
              <iframe
                src={activeLesson.video_url}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={activeLesson.title}
              />
            ) : (
              <div className="absolute inset-0">
                {course.cover_image ? (
                  <img src={course.cover_image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(150deg, hsl(28 42% 24%) 0%, hsl(24 48% 13%) 62%, #14100d 100%)',
                    }}
                    aria-hidden="true"
                  />
                )}
                <div className="absolute inset-0 bg-ink-950/55" aria-hidden="true" />
                <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
                  <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold bg-ink-950/60 text-gold shadow-glow">
                    <Icon name="play" size={30} variant="Bold" />
                  </span>
                  <p className="mt-5 text-meta font-bold uppercase tracking-wider text-gold">
                    Lesson {currentLessonIndex + 1} of {lessons.length}
                  </p>
                  <h3 className="mt-2 max-w-md font-display text-title leading-snug text-cream">
                    {activeLesson.title}
                  </h3>
                  <p className="mt-2 max-w-sm text-body text-cream-dim">
                    This lesson is taught with the materials below. Read through, take notes, and ask a question any time.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Lesson header and controls */}
          <div className="border-b border-cream/10 px-4 py-5 sm:px-6 md:p-8">
            <span className="inline-flex rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-meta font-bold uppercase tracking-wider text-gold">
              Lesson {currentLessonIndex + 1} of {lessons.length}
            </span>
            <h2 className="mt-3 font-display text-headline tracking-tight text-cream">{activeLesson.title}</h2>
            {activeLesson.duration ? (
              <p className="mt-2 flex items-center gap-1.5 text-caption text-cream-dim">
                <Icon name="clock" size={14} />
                {formatDuration(activeLesson.duration)}
              </p>
            ) : null}

            {/* Prev and next: large touch targets, always visible */}
            <div className="mt-6 flex items-center gap-3">
              <button
                disabled={!prevLesson}
                onClick={() => prevLesson && handleSelectLesson(prevLesson)}
                className={`inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-full border px-4 font-display text-body transition sm:flex-none sm:px-6 ${
                  prevLesson
                    ? 'border-cream/15 text-cream hover:border-cream/30 hover:bg-cream/5'
                    : 'cursor-not-allowed border-cream/5 text-cream-faint'
                }`}
              >
                <Icon name="back" size={18} />
                Previous
              </button>
              <button
                disabled={!nextLesson}
                onClick={() => nextLesson && handleSelectLesson(nextLesson)}
                className={`inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-full px-4 font-display text-body transition sm:flex-none sm:px-6 ${
                  nextLesson
                    ? 'bg-gold text-ink-950 shadow-glow hover:bg-gold-light'
                    : 'cursor-not-allowed bg-cream/10 text-cream-faint'
                }`}
              >
                Next lesson
                <Icon name="next" size={18} />
              </button>
            </div>

            {/* Lesson content */}
            <div className="mt-6 whitespace-pre-line rounded-2xl border border-cream/10 bg-ink-850 p-5 text-body leading-relaxed text-cream/90 sm:p-6">
              {activeLesson.content || activeLesson.description || 'No written notes or transcript provided for this lesson yet.'}
            </div>
          </div>
        </div>

        {/* Sidebar: curriculum and tools. On mobile it stacks below the lesson. */}
        <aside className="flex flex-col bg-ink-850 lg:col-span-4 xl:col-span-3">
          {/* Tabs */}
          <div className="grid grid-cols-4 border-b border-cream/10 bg-ink-900" role="tablist" aria-label="Lesson tools">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`min-h-[52px] border-b-2 px-1 text-center text-caption font-bold transition ${
                  activeTab === tab.key
                    ? 'border-gold bg-cream/5 text-cream'
                    : 'border-transparent text-cream-dim hover:text-cream'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab panels */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {/* Curriculum */}
            {activeTab === 'curriculum' && (
              <div className="space-y-5">
                {modules && modules.length > 0 ? (
                  modules.map((module, mIdx) => {
                    const moduleLessons = lessons.filter((l: any) => l.module_id === module.id)

                    return (
                      <div key={module.id} className="space-y-2">
                        <div className="flex items-center justify-between px-2 py-1">
                          <span className="text-meta font-bold uppercase tracking-wider text-cream-faint">
                            Module {mIdx + 1}: {module.title}
                          </span>
                          <span className="text-meta text-cream-faint">
                            {moduleLessons.length} {moduleLessons.length === 1 ? 'lesson' : 'lessons'}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {moduleLessons.map((lesson: any, lIdx: number) => (
                            <EpisodeRow
                              key={lesson.id}
                              lesson={lesson}
                              index={lIdx}
                              isActive={lesson.id === activeLesson.id}
                              onSelect={handleSelectLesson}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  lessons.map((lesson, idx) => (
                    <EpisodeRow
                      key={lesson.id}
                      lesson={lesson}
                      index={idx}
                      isActive={lesson.id === activeLesson.id}
                      onSelect={handleSelectLesson}
                    />
                  ))
                )}
              </div>
            )}

            {/* Notes */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                <form onSubmit={handleAddNote} className="space-y-3">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Take notes for this lesson..."
                    rows={3}
                    className="w-full resize-none rounded-xl border border-cream/10 bg-ink-800 p-3 text-body text-cream placeholder:text-cream-faint focus:border-gold focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !newNote.trim()}
                    className="min-h-[48px] w-full rounded-full bg-gold font-display text-body text-ink-950 transition hover:bg-gold-light disabled:opacity-50"
                  >
                    Save note
                  </button>
                </form>

                <div className="space-y-3 pt-2">
                  {notes.length === 0 ? (
                    <p className="py-6 text-center text-body text-cream-faint">No notes saved for this lesson yet.</p>
                  ) : (
                    notes.map((note) => (
                      <div key={note.id} className="space-y-1 rounded-xl border border-cream/5 bg-ink-800 p-3.5">
                        <p className="text-body leading-relaxed text-cream">{note.note}</p>
                        <span className="block text-meta text-cream-faint">
                          {new Date(note.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Q and A */}
            {activeTab === 'qa' && (
              <div className="space-y-4">
                <form onSubmit={handleAddQuestion} className="space-y-3">
                  <textarea
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Ask a question about this lesson..."
                    rows={3}
                    className="w-full resize-none rounded-xl border border-cream/10 bg-ink-800 p-3 text-body text-cream placeholder:text-cream-faint focus:border-gold focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !newQuestion.trim()}
                    className="min-h-[48px] w-full rounded-full bg-gold font-display text-body text-ink-950 transition hover:bg-gold-light disabled:opacity-50"
                  >
                    Post question
                  </button>
                </form>

                <div className="space-y-3 pt-2">
                  {qaList.length === 0 ? (
                    <p className="py-6 text-center text-body text-cream-faint">No questions asked yet. Be the first to ask one.</p>
                  ) : (
                    qaList.map((qa) => (
                      <div key={qa.id} className="space-y-2 rounded-xl border border-cream/5 bg-ink-800 p-3.5">
                        <p className="text-body font-medium leading-relaxed text-cream">{qa.question}</p>
                        <span className="block text-meta text-cream-faint">
                          {new Date(qa.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Reviews */}
            {activeTab === 'reviews' && (
              <div className="space-y-3">
                {reviews.length === 0 ? (
                  <div className="rounded-xl border border-cream/5 bg-ink-800 px-4 py-8 text-center">
                    <p className="font-display text-lead text-cream">No reviews yet</p>
                    <p className="mx-auto mt-2 max-w-xs text-body text-cream-dim">
                      Learners have not reviewed this course yet. Reviews appear here once they are shared.
                    </p>
                  </div>
                ) : (
                  reviews.map((review: any, idx: number) => (
                    <div key={review.id ?? idx} className="space-y-2 rounded-xl border border-cream/5 bg-ink-800 p-3.5">
                      {typeof review.rating === 'number' && (
                        <span className="flex items-center gap-0.5" aria-label={`Rated ${review.rating} out of 5`}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className={star <= review.rating ? 'text-gold' : 'text-cream-faint'}>
                              <Icon name="star" size={14} variant={star <= review.rating ? 'Bold' : 'Linear'} />
                            </span>
                          ))}
                        </span>
                      )}
                      <p className="text-body leading-relaxed text-cream">
                        {review.review || review.comment || review.content || 'Review'}
                      </p>
                      <span className="block text-meta text-cream-faint">
                        {[review.user_name || review.author, review.created_at ? new Date(review.created_at).toLocaleDateString() : null]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

function EpisodeRow({
  lesson,
  index,
  isActive,
  onSelect,
}: {
  lesson: any
  index: number
  isActive: boolean
  onSelect: (lesson: any) => void
}) {
  return (
    <button
      onClick={() => onSelect(lesson)}
      aria-current={isActive ? 'true' : undefined}
      className={`group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
        isActive
          ? 'border-gold/40 bg-gold/10 text-cream'
          : 'border-cream/5 bg-cream/[0.02] text-cream-dim hover:border-cream/10 hover:bg-cream/[0.04]'
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-display text-caption ${
          isActive ? 'bg-gold text-ink-950' : 'bg-cream/10 text-cream-dim group-hover:text-cream'
        }`}
      >
        {isActive ? <Icon name="play" size={14} variant="Bold" /> : index + 1}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-body font-semibold line-clamp-1 ${isActive ? 'text-cream' : 'text-cream'}`}>
          {lesson.title}
        </span>
        <span className="mt-0.5 block text-meta text-cream-faint">
          {isActive ? 'Now playing' : 'Video lesson'}
        </span>
      </span>
      {lesson.duration ? (
        <span className="flex shrink-0 items-center gap-1 text-meta text-cream-faint">
          <Icon name="clock" size={12} />
          {formatDuration(lesson.duration)}
        </span>
      ) : null}
    </button>
  )
}
