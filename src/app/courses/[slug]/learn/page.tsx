'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useBrand } from '@/hooks/useBrand'

interface Lesson {
  id: string
  course_id: string
  title: string
  content: string | null
  video_url: string | null
  order_number: number | null
  duration: number | null
  created_at: string
}

interface Note {
  id: string
  timestamp: number
  note: string
  created_at: string
}

interface QAItem {
  id: string
  question: string
  answer: string | null
  user_email?: string
  created_at: string
}

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correct_index: number
}

export default function CourseLearnPage() {
  const { brand } = useBrand()
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient() as any
  const slug = params?.slug as string
  const lessonParam = searchParams?.get('lesson')

  const [course, setCourse] = useState<any>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [progress, setProgress] = useState(0)

  // Udemy-grade Feature States
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'qa' | 'announcements' | 'reviews' | 'quiz'>('overview')
  const [notes, setNotes] = useState<Note[]>([])
  const [newNoteText, setNewNoteText] = useState('')
  const [qaList, setQaList] = useState<QAItem[]>([])
  const [newQuestion, setNewQuestion] = useState('')
  const [reviews, setReviews] = useState<any[]>([])
  const [newRating, setNewRating] = useState(5)
  const [newReviewComment, setNewReviewComment] = useState('')
  
  // Quiz states
  const [quizData, setQuizData] = useState<QuizQuestion[]>([
    {
      id: '1',
      question: 'What is the primary principle discussed in this module?',
      options: ['Alignment with destiny', 'Random chance', 'Ignoring ancestral wisdom', 'None of the above'],
      correct_index: 0
    }
  ])
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: number }>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizPassed, setQuizPassed] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        setUser(user)

        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', slug)
          .single()

        if (!enrollment) {
          router.push(`/courses/${slug}`)
          return
        }
        setProgress(enrollment.progress || 0)

        const { data: courseData } = await supabase
          .from('courses')
          .select('*')
          .eq('id', slug)
          .single()

        if (courseData) setCourse(courseData)

        const { data: lessonsData } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', slug)
          .order('order_number', { ascending: true })

        if (lessonsData && lessonsData.length > 0) {
          setLessons(lessonsData)
          let targetLesson = lessonsData[0]
          if (lessonParam) {
            const found = lessonsData.find((l: Lesson) => l.id === lessonParam)
            if (found) targetLesson = found
          }
          setCurrentLesson(targetLesson)
        }

        // Mock Q&A load for initial presentation
        setQaList([
          { id: '1', question: 'How do I apply this concept in modern daily life?', answer: 'Consistency and regular meditation on the verses are key.', created_at: new Date().toISOString() }
        ])
        setReviews([
          { id: '1', rating: 5, comment: 'Incredible depth of wisdom. Truly transformative!', user_email: 'student@example.com' }
        ])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [slug, router, supabase, lessonParam])

  const handleLessonClick = (lesson: Lesson) => {
    setCurrentLesson(lesson)
    setQuizSubmitted(false)
    setQuizPassed(false)
    setSelectedAnswers({})
    router.push(`/courses/${slug}/learn?lesson=${lesson.id}`)
  }

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNoteText.trim()) return
    const currentTime = videoRef.current ? Math.floor(videoRef.current.currentTime) : 0
    const newNote: Note = {
      id: Date.now().toString(),
      timestamp: currentTime,
      note: newNoteText,
      created_at: new Date().toISOString()
    }
    setNotes([newNote, ...notes])
    setNewNoteText('')
  }

  const handleSeekVideo = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp
      videoRef.current.play()
    }
  }

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuestion.trim()) return
    const item: QAItem = {
      id: Date.now().toString(),
      question: newQuestion,
      answer: null,
      user_email: user?.email,
      created_at: new Date().toISOString()
    }
    setQaList([item, ...qaList])
    setNewQuestion('')
  }

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault()
    const rev = { id: Date.now().toString(), rating: newRating, comment: newReviewComment, user_email: user?.email }
    setReviews([rev, ...reviews])
    setNewReviewComment('')
  }

  const handleQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setQuizSubmitted(true)
    const allCorrect = quizData.every(q => selectedAnswers[q.id] === q.correct_index)
    if (allCorrect) {
      setQuizPassed(true)
      handleVideoProgress(true)
    }
  }

  const handleVideoProgress = async (watched: boolean) => {
    if (!user || !currentLesson) return
    const currentIndex = lessons.findIndex(l => l.id === currentLesson.id)
    const newProgress = Math.min(100, Math.round(((currentIndex + 1) / lessons.length) * 100))

    await supabase
      .from('enrollments')
      .update({ progress: newProgress })
      .eq('user_id', user.id)
      .eq('course_id', slug)

    setProgress(newProgress)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading comprehensive learning environment...</p>
        </div>
      </div>
    )
  }

  if (!course || !currentLesson) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-slate-400 mb-6">You need to be enrolled to access this learning dashboard.</p>
          <Link href={`/courses/${slug}`} className="text-brand-primary hover:underline">← Back to Course</Link>
        </div>
      </div>
    )
  }

  const currentIndex = lessons.findIndex(l => l.id === currentLesson.id)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/90 border-b border-slate-800/80 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-black tracking-wider bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
            {brand?.display_name || 'IFALODE'}
          </Link>
          <span className="text-slate-600">/</span>
          <Link href={`/courses/${slug}`} className="text-sm text-slate-400 hover:text-white truncate max-w-xs transition">
            {course.title}
          </Link>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-slate-400">Course Progress:</span>
            <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-brand-primary transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs font-bold text-brand-primary">{progress}%</span>
          </div>
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition">Dashboard</Link>
        </div>
      </nav>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Main Player & Tabbed Content Area */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col overflow-y-auto border-r border-slate-800">
          <div className="p-4 sm:p-6 bg-black">
            {currentLesson.video_url ? (
              <div className="max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl border border-slate-800">
                <video
                  ref={videoRef}
                  src={currentLesson.video_url}
                  controls
                  className="w-full aspect-video bg-black"
                  onEnded={() => handleVideoProgress(true)}
                />
              </div>
            ) : (
              <div className="max-w-4xl mx-auto rounded-xl bg-slate-900 border border-slate-800 p-16 text-center">
                <div className="text-5xl mb-4">🎬</div>
                <h3 className="text-lg font-bold text-white mb-2">No Video Assigned</h3>
                <p className="text-slate-400 text-sm">Read the lesson notes and resources below.</p>
              </div>
            )}
          </div>

          {/* Lesson Title & Quick Info */}
          <div className="p-6 border-b border-slate-800 bg-slate-950">
            <h1 className="text-2xl font-bold text-white mb-1">{currentLesson.title}</h1>
            {currentLesson.duration && <p className="text-xs text-slate-500">⏱️ Est. Duration: {currentLesson.duration} minutes</p>}
          </div>

          {/* Udemy-Style Interactive Navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900 px-6 gap-6 text-sm overflow-x-auto">
            {(['overview', 'notes', 'qa', 'announcements', 'reviews', 'quiz'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 font-semibold capitalize transition border-b-2 whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'qa' ? 'Q&A' : tab}
              </button>
            ))}
          </div>

          {/* Tab Content Panels */}
          <div className="p-6 flex-1 bg-slate-950">
            {activeTab === 'overview' && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">About this lesson</h3>
                  <p className="text-slate-300 leading-relaxed text-sm">
                    {currentLesson.content || 'Detailed notes and breakdown for this lesson section.'}
                  </p>
                </div>
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-white text-sm">Instructor</h4>
                    <p className="text-xs text-slate-400">{course.instructor || 'Ifalode Master'}</p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20">Verified Expert</span>
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="max-w-3xl space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Timestamped Notes</h3>
                  <span className="text-xs text-slate-500">Notes capture current video time automatically</span>
                </div>
                <form onSubmit={handleAddNote} className="space-y-3">
                  <textarea
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Type a note for this specific timestamp..."
                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-primary"
                    rows={3}
                  />
                  <button type="submit" className="px-5 py-2 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 transition">
                    Save Note at {videoRef.current ? Math.floor(videoRef.current.currentTime) : 0}s
                  </button>
                </form>

                <div className="space-y-3 pt-4">
                  {notes.length === 0 ? (
                    <p className="text-slate-500 text-sm">No notes added yet. Take your first note above!</p>
                  ) : (
                    notes.map((n) => (
                      <div key={n.id} className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex items-start justify-between gap-4">
                        <div>
                          <button
                            onClick={() => handleSeekVideo(n.timestamp)}
                            className="inline-block px-2.5 py-1 bg-brand-primary/20 text-brand-primary text-xs font-bold rounded mb-2 hover:bg-brand-primary/30 transition"
                          >
                            ⏱️ {Math.floor(n.timestamp / 60)}:{(n.timestamp % 60).toString().padStart(2, '0')}
                          </button>
                          <p className="text-slate-300 text-sm">{n.note}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'qa' && (
              <div className="max-w-3xl space-y-6">
                <h3 className="text-lg font-semibold text-white">Questions & Answers</h3>
                <form onSubmit={handleAddQuestion} className="space-y-3">
                  <input
                    type="text"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Ask a question about this lesson..."
                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-primary"
                  />
                  <button type="submit" className="px-5 py-2 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 transition">
                    Post Question
                  </button>
                </form>

                <div className="space-y-4 pt-4">
                  {qaList.map((q) => (
                    <div key={q.id} className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                      <p className="text-sm font-semibold text-white">Q: {q.question}</p>
                      {q.answer ? (
                        <p className="text-xs text-brand-primary pl-4 border-l-2 border-brand-primary">A: {q.answer}</p>
                      ) : (
                        <p className="text-xs text-slate-500 italic">Waiting for instructor response...</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'announcements' && (
              <div className="max-w-3xl space-y-4">
                <h3 className="text-lg font-semibold text-white">Instructor Announcements</h3>
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-brand-primary">📣 Welcome & Course Guidelines</span>
                    <span className="text-xs text-slate-500">Posted 2 days ago</span>
                  </div>
                  <p className="text-sm text-slate-300">Make sure to take notes and review each module's core exercises thoroughly before attempting quizzes!</p>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="max-w-3xl space-y-6">
                <h3 className="text-lg font-semibold text-white">Student Reviews & Feedback</h3>
                <form onSubmit={handleAddReview} className="space-y-3 p-4 bg-slate-900 rounded-xl border border-slate-800">
                  <h4 className="text-sm font-semibold text-white">Leave a Review</h4>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400">Rating:</label>
                    <select
                      value={newRating}
                      onChange={(e) => setNewRating(Number(e.target.value))}
                      className="bg-slate-800 text-white p-2 rounded text-xs border border-slate-700"
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
                    placeholder="How was your experience with this course?"
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                    rows={2}
                  />
                  <button type="submit" className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-lg">Submit Review</button>
                </form>

                <div className="space-y-3">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-white">{rev.user_email || 'Student'}</span>
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
                  <h3 className="text-lg font-semibold text-white">Module Knowledge Check</h3>
                  <span className="text-xs px-3 py-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">Required to pass</span>
                </div>
                <form onSubmit={handleQuizSubmit} className="space-y-6">
                  {quizData.map((q, qIndex) => (
                    <div key={q.id} className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
                      <h4 className="text-sm font-semibold text-white">Question {qIndex + 1}: {q.question}</h4>
                      <div className="space-y-2">
                        {q.options.map((opt, optIndex) => (
                          <label key={optIndex} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 cursor-pointer text-sm transition">
                            <input
                              type="radio"
                              name={q.id}
                              checked={selectedAnswers[q.id] === optIndex}
                              onChange={() => setSelectedAnswers({ ...selectedAnswers, [q.id]: optIndex })}
                              className="text-brand-primary"
                            />
                            <span className="text-slate-300">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button type="submit" className="px-6 py-3 bg-brand-primary text-white font-semibold rounded-xl text-sm hover:opacity-90 transition">
                    Submit Quiz Answers
                  </button>
                </form>

                {quizSubmitted && (
                  <div className={`p-4 rounded-xl border text-sm ${quizPassed ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {quizPassed ? '🎉 Excellent! Quiz passed successfully. Progress updated.' : '❌ Some answers were incorrect. Please review and try again.'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Lesson Curriculum Tree */}
        <div className="lg:col-span-4 xl:col-span-3 bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h2 className="font-bold text-white text-sm">Course Curriculum</h2>
            <p className="text-xs text-slate-500">{lessons.length} lessons total</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {lessons.map((lesson, index) => (
              <button
                key={lesson.id}
                onClick={() => handleLessonClick(lesson)}
                className={`w-full text-left px-3 py-3 rounded-xl transition flex items-center gap-3 ${
                  currentLesson?.id === lesson.id
                    ? 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-slate-800 text-xs flex items-center justify-center font-bold">{index + 1}</div>
                <div className="flex-1 truncate text-xs">{lesson.title}</div>
                {lesson.duration && <span className="text-[10px] text-slate-500">{lesson.duration}m</span>}
              </button>
            ))}
          </div>

          {/* Previous / Next Lesson Navigation Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-2">
            <button
              onClick={() => {
                if (currentIndex > 0) handleLessonClick(lessons[currentIndex - 1])
              }}
              disabled={currentIndex === 0}
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 disabled:opacity-40 transition"
            >
              ← Prev
            </button>
            <button
              onClick={() => {
                if (currentIndex < lessons.length - 1) handleLessonClick(lessons[currentIndex + 1])
              }}
              disabled={currentIndex === lessons.length - 1}
              className="px-3 py-2 rounded-lg bg-brand-primary text-xs text-white font-semibold disabled:opacity-40 transition"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
