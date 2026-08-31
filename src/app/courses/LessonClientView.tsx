'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

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

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col selection:bg-brand-primary selection:text-white">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-white/10 bg-black/40 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm font-medium transition flex items-center space-x-2">
            <span>←</span>
            <span>Dashboard</span>
          </Link>
          <div className="h-4 w-[1px] bg-white/10" />
          <h1 className="text-sm font-semibold text-slate-200 truncate max-w-md">{course.title}</h1>
        </div>

        {/* Progress Bar & Profile Quick Status */}
        <div className="flex items-center space-x-6">
          <div className="hidden md:flex items-center space-x-3">
            <div className="text-xs text-slate-400 font-medium">Course Progress</div>
            <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-primary transition-all duration-500 rounded-full" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-200">{Math.round(progress)}%</span>
          </div>
        </div>
      </header>

      {/* Main Learning Grid Container */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-4rem)]">
        {/* Left/Center Main Content (Video & Lesson Details) */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col border-r border-white/10 bg-[#07090e]">
          {/* Video Player Box */}
          <div className="relative w-full aspect-video bg-black flex items-center justify-center border-b border-white/10 overflow-hidden shadow-2xl">
            {activeLesson.video_url ? (
              <iframe
                src={activeLesson.video_url}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-white/[0.02] to-transparent w-full h-full">
                <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary text-2xl font-bold mb-3 shadow-lg shadow-brand-primary/10">
                  ▶
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Interactive Module Ready</h3>
                <p className="text-slate-400 text-sm max-w-sm">Follow along with the learning materials and video commentary below.</p>
              </div>
            )}
          </div>

          {/* Lesson Header & Controls */}
          <div className="p-6 md:p-8 border-b border-white/10 bg-white/[0.01]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full border border-brand-primary/20">
                  Lesson {currentLessonIndex + 1} of {lessons.length}
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-white mt-3 tracking-tight">{activeLesson.title}</h2>
              </div>

              {/* Prev / Next Lesson Navigation */}
              <div className="flex items-center space-x-3">
                <button
                  disabled={!prevLesson}
                  onClick={() => prevLesson && handleSelectLesson(prevLesson)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-sm border transition flex items-center space-x-2 ${
                    prevLesson 
                      ? 'border-white/10 bg-white/[0.03] hover:bg-white/10 text-white' 
                      : 'border-white/5 bg-transparent text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <span>← Previous</span>
                </button>
                <button
                  disabled={!nextLesson}
                  onClick={() => nextLesson && handleSelectLesson(nextLesson)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-lg flex items-center space-x-2 ${
                    nextLesson 
                      ? 'bg-brand-primary hover:opacity-90 text-white shadow-brand-primary/20' 
                      : 'bg-white/10 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span>Next Lesson →</span>
                </button>
              </div>
            </div>

            {/* Lesson Description / Content */}
            <div className="prose prose-invert max-w-none text-slate-300 text-sm md:text-base leading-relaxed bg-black/30 p-6 rounded-2xl border border-white/10">
              {activeLesson.content || activeLesson.description || "No written notes or transcript provided for this lesson module yet."}
            </div>
          </div>
        </div>

        {/* Right Sidebar (Curriculum & Interactive Tools) */}
        <div className="lg:col-span-4 xl:col-span-3 bg-black/40 flex flex-col border-t lg:border-t-0 border-white/10">
          {/* Tab Navigation */}
          <div className="grid grid-cols-3 border-b border-white/10 bg-white/[0.02]">
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`py-3.5 text-xs font-bold transition text-center border-b-2 ${
                activeTab === 'curriculum'
                  ? 'border-brand-primary text-white bg-white/[0.04]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Curriculum
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`py-3.5 text-xs font-bold transition text-center border-b-2 ${
                activeTab === 'notes'
                  ? 'border-brand-primary text-white bg-white/[0.04]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Notes ({notes.length})
            </button>
            <button
              onClick={() => setActiveTab('qa')}
              className={`py-3.5 text-xs font-bold transition text-center border-b-2 ${
                activeTab === 'qa'
                  ? 'border-brand-primary text-white bg-white/[0.04]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Q&A ({qaList.length})
            </button>
          </div>

          {/* Tab Content Panels */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* 1. CURRICULUM TAB (Grouped by Modules) */}
            {activeTab === 'curriculum' && (
              <div className="space-y-4">
                {modules && modules.length > 0 ? (
                  modules.map((module, mIdx) => {
                    const moduleLessons = lessons.filter((l: any) => l.module_id === module.id)

                    return (
                      <div key={module.id} className="space-y-2">
                        {/* Module Header */}
                        <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                          <span>Module {mIdx + 1}: {module.title}</span>
                        </div>

                        {/* Lessons inside this module */}
                        <div className="space-y-1.5 pl-1">
                          {moduleLessons.map((lesson: any, lIdx: number) => {
                            const isActive = lesson.id === activeLesson.id
                            return (
                              <button
                                key={lesson.id}
                                onClick={() => handleSelectLesson(lesson)}
                                className={`w-full text-left p-3 rounded-xl border transition flex items-start space-x-3 group ${
                                  isActive
                                    ? 'bg-brand-primary/10 border-brand-primary/40 text-white shadow-lg shadow-brand-primary/5'
                                    : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04] text-slate-300'
                                }`}
                              >
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                                  isActive ? 'bg-brand-primary text-white' : 'bg-white/10 text-slate-400 group-hover:text-white'
                                }`}>
                                  {lIdx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                                    {lesson.title}
                                  </p>
                                  <span className="text-[11px] text-slate-500">Video Lesson</span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  // Fallback flat list if modules aren't populated yet
                  lessons.map((lesson, idx) => {
                    const isActive = lesson.id === activeLesson.id
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => handleSelectLesson(lesson)}
                        className={`w-full text-left p-3.5 rounded-xl border transition flex items-start space-x-3 group ${
                          isActive
                            ? 'bg-brand-primary/10 border-brand-primary/40 text-white shadow-lg shadow-brand-primary/5'
                            : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04] text-slate-300'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          isActive ? 'bg-brand-primary text-white' : 'bg-white/10 text-slate-400 group-hover:text-white'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                            {lesson.title}
                          </p>
                          <span className="text-[11px] text-slate-500">Module Video</span>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            )}

            {/* 2. NOTES TAB */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                <form onSubmit={handleAddNote} className="space-y-3">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Take timestamped notes for this lesson..."
                    rows={3}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary transition resize-none"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !newNote.trim()}
                    className="w-full py-2.5 bg-brand-primary hover:opacity-90 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md transition"
                  >
                    Save Note
                  </button>
                </form>

                <div className="space-y-3 pt-2">
                  {notes.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">No notes saved for this lesson yet.</p>
                  ) : (
                    notes.map((note) => (
                      <div key={note.id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-sm space-y-1">
                        <p className="text-slate-200 text-xs leading-relaxed">{note.note}</p>
                        <span className="text-[10px] text-slate-500 block">
                          {new Date(note.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 3. Q&A TAB */}
            {activeTab === 'qa' && (
              <div className="space-y-4">
                <form onSubmit={handleAddQuestion} className="space-y-3">
                  <textarea
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Ask a question about this lesson..."
                    rows={3}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary transition resize-none"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !newQuestion.trim()}
                    className="w-full py-2.5 bg-brand-primary hover:opacity-90 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md transition"
                  >
                    Post Question
                  </button>
                </form>

                <div className="space-y-3 pt-2">
                  {qaList.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">No questions asked yet. Be the first!</p>
                  ) : (
                    qaList.map((qa) => (
                      <div key={qa.id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-sm space-y-2">
                        <p className="text-slate-200 text-xs leading-relaxed font-medium">{qa.question}</p>
                        <span className="text-[10px] text-slate-500 block">
                          {new Date(qa.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
