'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useBrand } from '@/hooks/useBrand'

interface Module {
  id: string
  course_id: string
  title: string
  description: string
  order_number: number
  created_at: string
}

interface Lesson {
  id: string
  module_id: string
  course_id: string
  title: string
  content: string | null
  video_url: string | null
  order_number: number | null
  duration: number | null
  created_at: string
}

interface Course {
  id: string
  title: string
  description: string | null
  instructor: string | null
  price: number | null
  level: string | null
}

interface LessonClientViewProps {
  course: Course
  modules: Module[]
  lessons: Lesson[]
  initialLesson: Lesson
  initialProgress: number
  userId: string
}

export default function LessonClientView({
  course,
  modules,
  lessons,
  initialLesson,
  initialProgress,
  userId,
}: LessonClientViewProps) {
  const { brand } = useBrand()
  const router = useRouter()
  const supabase = createClient()
  
  const [currentLesson, setCurrentLesson] = useState<Lesson>(initialLesson)
  const [progress, setProgress] = useState(initialProgress)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(modules.map(m => m.id))
  )

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)
    }
    setExpandedModules(newExpanded)
  }

  const getLessonsForModule = (moduleId: string) => {
    return lessons.filter(l => l.module_id === moduleId)
  }

  const handleLessonSelect = (lesson: Lesson) => {
    setCurrentLesson(lesson)
    router.push(`/courses/${course.id}/learn?lesson=${lesson.id}`)
  }

  // Update progress when lesson changes
  useEffect(() => {
    const updateProgress = async () => {
      const completedLessons = lessons.filter(l => {
        // In a real app, track which lessons are completed
        return false
      }).length
      const newProgress = Math.round((completedLessons / lessons.length) * 100)
      
      if (newProgress !== progress) {
        await supabase
          .from('enrollments')
          .update({ progress: newProgress })
          .eq('user_id', userId)
          .eq('course_id', course.id)
        setProgress(newProgress)
      }
    }
    updateProgress()
  }, [currentLesson])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-black tracking-wider bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
              {brand?.display_name || 'IFALODE'}
            </Link>
            <span className="text-slate-600">/</span>
            <Link href={`/courses/${course.id}`} className="text-sm text-slate-400 hover:text-white transition">
              {course.title}
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-sm text-brand-primary">Learn</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">Progress: {progress}%</span>
            <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition">Dashboard</Link>
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/login')
              }}
              className="text-sm text-red-400 hover:text-red-300 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar - Modules and Lessons */}
        <div className="w-80 bg-slate-900 border-r border-slate-800 overflow-y-auto flex-shrink-0">
          <div className="p-4 border-b border-slate-800">
            <h2 className="font-bold text-white">Course Content</h2>
            <p className="text-xs text-slate-500">{modules.length} modules • {lessons.length} lessons</p>
          </div>
          <div className="p-2 space-y-2">
            {modules.map((module) => {
              const moduleLessons = getLessonsForModule(module.id)
              const isExpanded = expandedModules.has(module.id)
              return (
                <div key={module.id} className="border border-slate-800 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-800 transition"
                  >
                    <div>
                      <span className="text-xs font-bold text-brand-primary">Module {module.order_number}</span>
                      <h4 className="text-sm font-semibold text-white truncate">{module.title}</h4>
                    </div>
                    <span className="text-slate-500">{isExpanded ? '▾' : '▸'}</span>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-slate-800">
                      {moduleLessons.map((lesson, index) => (
                        <button
                          key={lesson.id}
                          onClick={() => handleLessonSelect(lesson)}
                          className={`w-full text-left px-3 py-2 transition ${
                            currentLesson?.id === lesson.id
                              ? 'bg-brand-primary/20 text-brand-primary'
                              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs w-5">{index + 1}</span>
                            <span className="text-sm flex-1 truncate">{lesson.title}</span>
                            {lesson.duration && (
                              <span className="text-xs text-slate-500">{lesson.duration}min</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Main Content - Lesson Player */}
        <div className="flex-1 overflow-y-auto p-8">
          {currentLesson ? (
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold text-white mb-2">{currentLesson.title}</h1>
              {currentLesson.duration && (
                <p className="text-sm text-slate-500 mb-6">⏱️ {currentLesson.duration} minutes</p>
              )}

              {/* Video Player */}
              {currentLesson.video_url ? (
                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden mb-6">
                  <video
                    src={currentLesson.video_url}
                    controls
                    className="w-full aspect-video bg-black"
                  />
                </div>
              ) : (
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center">
                  <div className="text-6xl mb-4">🎬</div>
                  <p className="text-slate-400">No video available for this lesson yet.</p>
                </div>
              )}

              {/* Lesson Content */}
              {currentLesson.content && (
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Lesson Notes</h3>
                  <div className="prose prose-invert max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-slate-400">Select a lesson from the sidebar to begin learning.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
