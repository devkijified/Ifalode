'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useBrand } from '@/hooks/useBrand'

interface LessonInteractiveViewProps {
  course: any
  lessons: any[]
  initialLesson: any
  initialNotes: any[]
  initialQa: any[]
  initialReviews: any[]
  initialQuizzes: any[]
  initialProgress: number
  userId: string
}

export default function LessonInteractiveView({
  course,
  lessons,
  initialLesson,
  initialNotes,
  initialQa,
  initialReviews,
  initialQuizzes,
  initialProgress,
  userId
}: LessonInteractiveViewProps) {
  const { brand } = useBrand()
  const router = useRouter()
  const supabase = createClient()

  const [currentLesson, setCurrentLesson] = useState(initialLesson)
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'qa' | 'announcements' | 'reviews' | 'quiz'>('overview')
  const [progress, setProgress] = useState(initialProgress)

  // Interactive local states synced with server initial props
  const [notes, setNotes] = useState(initialNotes)
  const [newNoteText, setNewNoteText] = useState('')
  const [qaList, setQaList] = useState(initialQa)
  const [newQuestion, setNewQuestion] = useState('')
  const [reviews, setReviews] = useState(initialReviews)
  const [newRating, setNewRating] = useState(5)
  const [newReviewComment, setNewReviewComment] = useState('')
  
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: number }>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizPassed, setQuizPassed] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)

  const currentIndex = lessons.findIndex((l) => l.id === currentLesson.id)

  const handleLessonClick = (lesson: any) => {
    setCurrentLesson(lesson)
    setQuizSubmitted(false)
    setQuizPassed(false)
    setSelectedAnswers({})
    router.push(`/courses/${course.id}/learn?lesson=${lesson.id}`, { scroll: false })
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNoteText.trim()) return

    const { data, error } = await (supabase.from('lesson_notes' as any) as any)
      .insert({
        user_id: userId,
        lesson_id: currentLesson.id,
        content: newNoteText
      })
      .select()
      .single()

    if (!error && data) {
      setNotes([data, ...notes])
      setNewNoteText('')
    }
  }

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuestion.trim()) return

    const { data, error } = await (supabase.from('lesson_qa' as any) as any)
      .insert({
        user_id: userId,
        lesson_id: currentLesson.id,
        question: newQuestion
      })
      .select()
      .single()

    if (!error && data) {
      setQaList([data, ...qaList])
      setNewQuestion('')
    }
  }

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data, error } = await (supabase.from('course_reviews' as any) as any)
      .upsert({
        user_id: userId,
        course_id: course.id,
        rating: newRating,
        comment: newReviewComment
      }, { onConflict: 'user_id,course_id' })
      .select()
      .single()

    if (!error) {
      setReviews([data || { id: Date.now(), rating: newRating, comment: newReviewComment }, ...reviews])
      setNewReviewComment('')
    }
  }

  const handleQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setQuizSubmitted(true)
    if (initialQuizzes.length === 0) {
      setQuizPassed(true)
      return
    }
    const allCorrect = initialQuizzes.every((q: any) => selectedAnswers[q.id] === q.correct_index)
    if (allCorrect) {
      setQuizPassed(true)
      updateProgress()
    }
  }

  const updateProgress = async () => {
    const newProg = Math.min(100, Math.round(((currentIndex + 1) / lessons.length) * 100))
    await (supabase.from('enrollments' as any) as any)
      .update({ progress: newProg })
      .eq('user_id', userId)
      .eq('course_id', course.id)
    setProgress(newProg)
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-brand-primary selection:text-white">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#07090e]/85 border-b border-slate-800/60 px-6 h-18 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-black tracking-wider bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
            {brand?.display_name || 'IFALODE'}
          </Link>
          <span className="text-slate-700">/</span>
          <Link href={`/courses/${course.id}`} className="text-sm font-medium text-slate-400 hover:text-white truncate max-w-xs transition">
            {course.title}
          </Link>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-800/80">
            <span className="text-xs font-semibold text-slate-400">Progress</span>
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary transition-all duration-700 rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs font-bold text-brand-primary">{progress}%</span>
          </div>
          <Link href="/dashboard" className="text-sm font-semibold text-slate-300 hover:text-white transition">Dashboard</Link>
        </div>
      </nav>

      {/* Main Grid View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Main Content & Video Player Area */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col overflow-y-auto border-r border-slate-800/60 bg-[#07090e]">
          <div className="p-4 sm:p-8 bg-black/40 backdrop-blur-md">
            {currentLesson.video_url ? (
              <div className="max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-brand-primary/5 border border-slate-800/80 bg-black">
                <video
                  ref={videoRef}
                  src={currentLesson.video_url}
                  controls
                  className="w-full aspect-video object-cover"
                  onEnded={updateProgress}
                />
              </div>
            ) : (
              <div className="max-w-4xl mx-auto rounded-3xl bg-slate-900/60 border border-slate-800/80 p-16 text-center backdrop-blur-xl">
                <div className="w-16 h-16 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">📂</div>
                <h3 className="text-lg font-bold text-white mb-1">Text-Based Module</h3>
                <p className="text-slate-400 text-sm">Read through the lesson notes and resources below.</p>
              </div>
            )}
          </div>

          <div className="px-8 py-6 border-b border-slate-800/60 bg-slate-900/20">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">{currentLesson.title}</h1>
            {currentLesson.duration && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/80 text-slate-300 border border-slate-700/50">
                ⏱️ Estimated Time: {currentLesson.duration} minutes
              </span>
            )}
          </div>

          {/* Tabs Navigation */}
          <div className="flex border-b border-slate-800/60 bg-slate-900/40 px-8 gap-8 text-sm overflow-x-auto scrollbar-none">
            {(['overview', 'notes', 'qa', 'announcements', 'reviews', 'quiz'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 font-semibold capitalize transition border-b-2 whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab === 'qa' ? 'Q&A' : tab}
              </button>
            ))}
          </div>

          {/* Tab Panels */}
          <div className="p-8 flex-1">
            {activeTab === 'overview' && (
              <div className="space-y-6 max-w-3xl">
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-white">Lesson Overview</h3>
                  <p className="text-slate-300 leading-relaxed text-sm bg-slate-900/40 p-6 rounded-2xl border border-slate-800/60">
                    {currentLesson.content || 'Detailed breakdown and instructions for this module.'}
                  </p>
                </div>
                <div className="p-5 bg-gradient-to-r from-slate-900/80 to-slate-900/40 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-primary/20 text-brand-primary flex items-center justify-center font-bold text-lg">👤</div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{course.instructor || 'Expert Instructor'}</h4>
                      <p className="text-xs text-slate-400">Course Lead & Guide</p>
                    </div>
                  </div>
                  <span className="text-xs px-3.5 py-1.5 rounded-xl bg-brand-primary/10 text-brand-primary font-bold border border-brand-primary/20">Verified</span>
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="max-w-3xl space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Lesson Notes</h3>
                  <span className="text-xs text-slate-500">Record your key learnings</span>
                </div>
                <form onSubmit={handleAddNote} className="space-y-3">
                  <textarea
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Write your study notes for this lesson..."
                    className="w-full p-4 bg-slate-900/80 border border-slate-800 rounded-2xl text-white text-sm focus:outline-none focus:border-brand-primary transition"
                    rows={3}
                  />
                  <button type="submit" className="px-6 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-xl hover:opacity-90 transition shadow-lg shadow-brand-primary/20">
                    Save Note
                  </button>
                </form>

                <div className="space-y-3 pt-4">
                  {notes.length === 0 ? (
                    <p className="text-slate-500 text-sm">No notes recorded yet. Add your first note above!</p>
                  ) : (
                    notes.map((n: any) => (
                      <div key={n.id} className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80 flex items-start justify-between gap-4">
                        <div>
                          <span className="text-xs text-slate-500 block mb-1">
                            {new Date(n.created_at).toLocaleDateString()}
                          </span>
                          <p className="text-slate-300 text-sm">{n.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'qa' && (
              <div className="max-w-3xl space-y-6">
                <h3 className="text-lg font-bold text-white">Course Q&A Discussion</h3>
                <form onSubmit={handleAddQuestion} className="space-y-3">
                  <input
                    type="text"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Ask a question about this specific lesson..."
                    className="w-full p-4 bg-slate-900/80 border border-slate-800 rounded-2xl text-white text-sm focus:outline-none focus:border-brand-primary transition"
                  />
                  <button type="submit" className="px-6 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-xl hover:opacity-90 transition shadow-lg shadow-brand-primary/20">
                    Post Question
                  </button>
                </form>

                <div className="space-y-4 pt-4">
                  {qaList.map((q: any) => (
                    <div key={q.id} className="p-5 bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-3">
                      <p className="text-sm font-semibold text-white">Q: {q.question}</p>
                      {q.answer ? (
                        <p className="text-xs text-brand-primary pl-4 border-l-2 border-brand-primary font-medium">A: {q.answer}</p>
                      ) : (
                        <p className="text-xs text-slate-500 italic">Awaiting instructor reply...</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'announcements' && (
              <div className="max-w-3xl space-y-4">
                <h3 className="text-lg font-bold text-white">Instructor Announcements</h3>
                <div className="p-5 bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-primary">📣 Welcome & Module Guidelines</span>
                    <span className="text-xs text-slate-500">Pinned Post</span>
                  </div>
                  <p className="text-sm text-slate-300">Complete all checkpoint quizzes and maintain notes to maximize your retention of this course material!</p>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="max-w-3xl space-y-6">
                <h3 className="text-lg font-bold text-white">Student Reviews</h3>
                <form onSubmit={handleAddReview} className="space-y-4 p-5 bg-slate-900/60 rounded-2xl border border-slate-800/80">
                  <h4 className="text-sm font-bold text-white">Leave Your Rating</h4>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-slate-400 font-medium">Stars:</label>
                    <select
                      value={newRating}
                      onChange={(e) => setNewRating(Number(e.target.value))}
                      className="bg-slate-800 text-white p-2 rounded-xl text-xs border border-slate-700/80 focus:outline-none"
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                      <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                      <option value={3}>⭐⭐⭐ (3/5)</option>
                      <option value={2}>⭐⭐ (2/5)</option>
                      <option value={1}>⭐ (1/5)</option>
                    </select>
                  </div>
                  <textarea
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    placeholder="Share your feedback about this course..."
                    className="w-full p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl text-white text-sm focus:outline-none"
                    rows={3}
                  />
                  <button type="submit" className="px-5 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-primary/20">Submit Review</button>
                </form>

                <div className="space-y-3">
                  {reviews.map((rev: any) => (
                    <div key={rev.id} className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-300">Student Review</span>
                        <span className="text-xs text-amber-400">{'⭐'.repeat(rev.rating)}</span>
                      </div>
                      <p className="text-sm text-slate-300">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'quiz' && (
              <div className="max-w-3xl space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Knowledge Check Quiz</h3>
                  <span className="text-xs px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold">Mandatory</span>
                </div>

                {initialQuizzes.length === 0 ? (
                  <p className="text-slate-400 text-sm bg-slate-900/40 p-6 rounded-2xl border border-slate-800/60">No quiz assigned for this specific lesson yet.</p>
                ) : (
                  <form onSubmit={handleQuizSubmit} className="space-y-6">
                    {initialQuizzes.map((q: any, qIdx: number) => (
                      <div key={q.id} className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-4">
                        <h4 className="text-sm font-bold text-white">Question {qIdx + 1}: {q.question}</h4>
                        <div className="space-y-2">
                          {q.options.map((opt: string, optIdx: number) => (
                            <label key={optIdx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 cursor-pointer text-sm transition border border-slate-700/40">
                              <input
                                type="radio"
                                name={q.id}
                                checked={selectedAnswers[q.id] === optIdx}
                                onChange={() => setSelectedAnswers({ ...selectedAnswers, [q.id]: optIdx })}
                                className="text-brand-primary"
                              />
                              <span className="text-slate-300">{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button type="submit" className="px-8 py-3 bg-brand-primary text-white font-bold rounded-2xl text-sm shadow-xl shadow-brand-primary/20 hover:opacity-90 transition">
                      Submit Quiz & Verify
                    </button>
                  </form>
                )}

                {quizSubmitted && (
                  <div className={`p-4 rounded-2xl border text-sm font-semibold ${quizPassed ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {quizPassed ? '🎉 Great job! Quiz passed successfully.' : '❌ Incorrect answers detected. Review the material and try again.'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Curriculum Sidebar */}
        <div className="lg:col-span-4 xl:col-span-3 bg-slate-900/30 backdrop-blur-md border-l border-slate-800/60 flex flex-col h-full overflow-hidden">
          <div className="p-5 border-b border-slate-800/60">
            <h2 className="font-bold text-white text-sm">Course Curriculum</h2>
            <p className="text-xs text-slate-500">{lessons.length} lessons total</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {lessons.map((lesson: any, index: number) => (
              <button
                key={lesson.id}
                onClick={() => handleLessonClick(lesson)}
                className={`w-full text-left px-4 py-3 rounded-2xl transition flex items-center gap-3 group ${
                  currentLesson?.id === lesson.id
                    ? 'bg-brand-primary/15 text-brand-primary border border-brand-primary/30 font-bold shadow-lg shadow-brand-primary/5'
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
                }`}
              >
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-extrabold ${currentLesson?.id === lesson.id ? 'bg-brand-primary text-white' : 'bg-slate-800 text-slate-300'}`}>
                  {index + 1}
                </div>
                <div className="flex-1 truncate text-xs font-medium">{lesson.title}</div>
                {lesson.duration && <span className="text-[10px] text-slate-500 font-semibold">{lesson.duration}m</span>}
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-slate-800/60 bg-black/20 flex items-center justify-between gap-3">
            <button
              onClick={() => {
                if (currentIndex > 0) handleLessonClick(lessons[currentIndex - 1])
              }}
              disabled={currentIndex === 0}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-30 transition"
            >
              ← Prev
            </button>
            <button
              onClick={() => {
                if (currentIndex < lessons.length - 1) handleLessonClick(lessons[currentIndex + 1])
              }}
              disabled={currentIndex === lessons.length - 1}
              className="px-4 py-2.5 rounded-xl bg-brand-primary text-xs font-bold text-white disabled:opacity-30 transition shadow-lg shadow-brand-primary/20"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
