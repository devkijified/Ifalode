import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function CourseDetailPage({
  params
}: {
  params: { slug: string }
}) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {}
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {}
        },
      },
    }
  )

  // 1. Fetch the course details by slug safely
  // NOTE: requires the `slug` column added to public.courses (see migration).
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', params.slug)
    .maybeSingle()

  if (courseError || !course) {
    notFound()
  }

  // 2. Fetch modules ordered by order_number
  // (public.modules uses `order_number`, not `module_order`)
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('*')
    .eq('course_id', course.id)
    .order('order_number', { ascending: true })

  if (modulesError) {
    console.error('[course-detail] modules fetch error:', modulesError)
  }

  // 3. Fetch lessons ordered by order_number
  // (public.lessons uses `order_number`, not `lesson_order`)
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', course.id)
    .order('order_number', { ascending: true })

  if (lessonsError) {
    console.error('[course-detail] lessons fetch error:', lessonsError)
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-white selection:bg-brand-primary selection:text-white pb-20">
      {/* Navigation Bar */}
      <header className="h-16 border-b border-white/10 bg-black/40 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-40">
        <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm font-medium transition flex items-center space-x-2">
          <span>←</span>
          <span>Dashboard</span>
        </Link>
        <Link
          href={`/courses/${course.slug}/learn`}
          className="px-5 py-2 bg-brand-primary hover:opacity-90 text-white rounded-xl font-bold text-xs shadow-lg transition"
        >
          Start Learning →
        </Link>
      </header>

      {/* Course Hero Section */}
      <div className="max-w-5xl mx-auto px-6 pt-12 pb-8 border-b border-white/10">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full border border-brand-primary/20">
          Course Overview
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mt-4 tracking-tight">{course.title}</h1>
        <p className="text-slate-400 text-base mt-3 max-w-2xl leading-relaxed">
          {course.description || "Master the foundations and practical applications with our comprehensive course curriculum."}
        </p>

        <div className="mt-6 flex items-center space-x-6 text-sm text-slate-400">
          <div><strong className="text-white">{modules?.length || 0}</strong> Modules</div>
          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
          <div><strong className="text-white">{lessons?.length || 0}</strong> Lessons</div>
        </div>
      </div>

      {/* Curriculum Section */}
      <div className="max-w-5xl mx-auto px-6 pt-12">
        <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Course Curriculum</h2>

        <div className="space-y-4">
          {modules && modules.length > 0 ? (
            modules.map((module, index) => {
              // Filter lessons that belong to this module
              const moduleLessons = lessons?.filter((l: any) => l.module_id === module.id) || []

              return (
                <div
                  key={module.id}
                  className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 transition hover:border-white/20"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Module {index + 1}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-0.5">{module.title}</h3>
                    </div>
                    <span className="text-xs font-medium text-slate-400 bg-white/5 px-3 py-1 rounded-full w-fit">
                      {moduleLessons.length} Lessons
                    </span>
                  </div>

                  {module.description && (
                    <p className="text-sm text-slate-400 mb-4">{module.description}</p>
                  )}

                  {/* Lessons List */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    {moduleLessons.length > 0 ? (
                      moduleLessons.map((lesson: any, lIdx: number) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-black/30 border border-white/5 text-sm text-slate-300"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-xs font-bold text-slate-500 w-5">{lIdx + 1}.</span>
                            <span className="font-medium">{lesson.title}</span>
                          </div>
                          <span className="text-[11px] text-slate-500">Video Lesson</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic py-2">No lessons added to this module yet.</p>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-16 bg-white/[0.02] border border-white/10 rounded-2xl">
              <p className="text-slate-400 text-sm">No curriculum modules have been published for this course yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
