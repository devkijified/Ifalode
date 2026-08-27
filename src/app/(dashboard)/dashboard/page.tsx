'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useBrand } from '@/hooks/useBrand'

// Types
interface Course {
  id: string
  title: string
  description: string | null
  instructor: string | null
  price: number | null
  cover_image: string | null
  category: string | null
  level: 'beginner' | 'intermediate' | 'advanced' | null
  is_published: boolean
  created_at: string
  updated_at: string
}

interface Enrollment {
  id: string
  user_id: string
  course_id: string
  progress: number
  completed: boolean
  enrolled_at: string
  course?: Course
}

interface Product {
  id: string
  title: string
  description: string | null
  price: number
  cover_image: string | null
  category: string | null
  is_ebook: boolean
  created_at: string
}

export default function DashboardPage() {
  const { brand } = useBrand()
  const [user, setUser] = useState<any>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Fetch user enrollments with course details
      const { data: enrollData } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:courses(*)
        `)
        .eq('user_id', user.id)

      if (enrollData) {
        setEnrollments(enrollData as Enrollment[])
      }

      // Fetch all published courses
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .limit(8)

      if (coursesData) {
        setCourses(coursesData)
      }

      // Fetch user's purchased products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .limit(10)

      if (productsData) {
        setProducts(productsData)
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'User'
  const firstName = fullName.split(' ')[0]

  // Calculate statistics
  const totalEnrollments = enrollments.length
  const completedEnrollments = enrollments.filter(e => e.completed).length
  const averageProgress = totalEnrollments > 0 
    ? Math.round(enrollments.reduce((acc, e) => acc + e.progress, 0) / totalEnrollments) 
    : 0

  // Get status for course card
  const getCourseStatus = (enrollment: Enrollment) => {
    if (enrollment.completed) return 'Finished'
    if (enrollment.progress > 0) return 'Active'
    return 'Not Started'
  }

  // Get lesson count (mock for now)
  const getLessonCount = (course: Course) => {
    // In a real app, you'd fetch this from a lessons table
    return Math.floor(Math.random() * 20) + 5
  }

  // Get icon based on course title
  const getCourseIcon = (title: string) => {
    const icons = ['📘', '🧠', '💼', '💻', '🎯', '📚', '✨', '🌟']
    const index = title.length % icons.length
    return icons[index]
  }

  // Get color based on status
  const getColor = (status: string) => {
    switch (status) {
      case 'Finished': return 'green'
      case 'Active': return 'primary'
      case 'Paused': return 'orange'
      default: return 'slate'
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ================= TOP HEADER ================= */}
      <header className="fixed top-0 left-0 right-0 z-50 h-[72px] bg-slate-900/95 backdrop-blur-xl border-b border-slate-800">
        <div className="h-full flex items-center">
          <div className={`h-full flex items-center border-r border-slate-800 transition-all duration-300 ${sidebarOpen ? 'w-[250px]' : 'w-[80px]'}`}>
            <div className="w-full px-5 flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-9 h-9 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition">
                ☰
              </button>
              {sidebarOpen && (
                <Link href="/" className="text-xl font-black tracking-wide bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent truncate">
                  {brand?.display_name || 'Ifalode'}
                </Link>
              )}
            </div>
          </div>

          <div className="flex-1 h-full flex items-center justify-between px-6">
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-400">
              <Link href="/dashboard" className="text-brand-primary">Dashboard</Link>
              <span>/</span>
              <span>Overview</span>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-white">{fullName}</p>
                  <p className="text-xs text-slate-500">{totalEnrollments} {totalEnrollments === 1 ? 'Course' : 'Courses'}</p>
                </div>
                <button className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center font-bold text-white">
                  {firstName.charAt(0).toUpperCase()}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ================= SIDEBAR ================= */}
      <aside className={`fixed left-0 top-[72px] bottom-0 z-40 bg-slate-900 border-r border-slate-800 transition-all duration-300 ${sidebarOpen ? 'w-[250px]' : 'w-[80px]'}`}>
        <div className="h-full flex flex-col">
          <nav className="flex-1 px-3 py-6 overflow-y-auto">
            {sidebarOpen && (
              <p className="px-3 mb-3 text-[10px] uppercase tracking-widest font-bold text-slate-600">Dashboard & Apps</p>
            )}
            <SidebarLink href="/dashboard" icon="▦" label="Dashboard" active collapsed={!sidebarOpen} />
            <SidebarLink href="/store" icon="🛒" label="Store" collapsed={!sidebarOpen} />
            <SidebarLink href="/courses" icon="🎓" label="Courses" collapsed={!sidebarOpen} />
            <SidebarLink href="/dashboard" icon="📚" label="My Learning" collapsed={!sidebarOpen} />
            <SidebarLink href="/dashboard" icon="📊" label="Progress" collapsed={!sidebarOpen} />
            {sidebarOpen && (
              <p className="px-3 mt-8 mb-3 text-[10px] uppercase tracking-widest font-bold text-slate-600">Account</p>
            )}
            <SidebarLink href="/profile" icon="👤" label="Profile" collapsed={!sidebarOpen} />
            <SidebarLink href="/settings" icon="⚙" label="Settings" collapsed={!sidebarOpen} />
          </nav>

          <div className="p-3 border-t border-slate-800">
            <button onClick={signOut} className={`w-full flex items-center ${sidebarOpen ? 'justify-start px-3' : 'justify-center'} gap-3 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition`}>
              <span>↪</span>
              {sidebarOpen && <span className="text-sm font-medium">Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className={`pt-[72px] min-h-screen transition-all duration-300 ${sidebarOpen ? 'ml-[250px]' : 'ml-[80px]'}`}>
        <div className="p-5 md:p-7 lg:p-8 max-w-[1600px] mx-auto">
          {/* ================= WELCOME HERO ================= */}
          <div className="grid xl:grid-cols-[1fr_280px] gap-5 mb-7">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-primary to-brand-secondary p-7 md:p-8">
              <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-white/10" />
              <div className="absolute right-20 -bottom-28 w-48 h-48 rounded-full bg-white/5" />
              <div className="relative z-10 max-w-3xl">
                <span className="inline-flex px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold mb-4">
                  Your Learning Dashboard
                </span>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  Hello {firstName}, Welcome Back!
                </h1>
                <p className="text-white/70 text-sm md:text-base max-w-2xl">
                  Continue your learning journey, explore new courses,
                  and discover more knowledge from your personal dashboard.
                </p>
                <div className="flex flex-wrap gap-3 mt-6">
                  <Link href="/courses" className="px-5 py-2.5 bg-white text-slate-900 rounded-lg text-sm font-semibold hover:bg-slate-100 transition">
                    Continue Learning
                  </Link>
                  <Link href="/store" className="px-5 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm font-semibold hover:bg-white/20 transition">
                    Browse Store
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-center text-center">
              <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto mb-4 text-xl">✦</div>
              <h3 className="font-bold text-lg mb-2">Have more to learn?</h3>
              <p className="text-sm text-slate-500 mb-5">Explore our latest courses and ebooks.</p>
              <Link href="/courses" className="w-full py-2.5 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:opacity-90 transition">
                Explore Courses
              </Link>
            </div>
          </div>

          {/* ================= MY COURSES ================= */}
          <SectionHeader title="Your Courses" action="View All" href="/courses" />
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            {enrollments.length === 0 ? (
              <div className="col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                <p className="text-slate-400">You haven't enrolled in any courses yet.</p>
                <Link href="/courses" className="text-brand-primary hover:underline mt-2 inline-block">Browse Courses →</Link>
              </div>
            ) : (
              enrollments.slice(0, 4).map((enrollment) => {
                const course = enrollment.course as Course
                const status = getCourseStatus(enrollment)
                const color = getColor(status)
                const lessons = course ? getLessonCount(course) : 0
                
                return (
                  <CourseCard
                    key={enrollment.id}
                    title={course?.title || 'Course'}
                    status={status}
                    progress={enrollment.progress}
                    remaining={`${lessons} Lessons`}
                    icon={getCourseIcon(course?.title || '')}
                    color={color as any}
                  />
                )
              })
            )}
          </div>

          {/* ================= STATISTICS ================= */}
          <div className="grid lg:grid-cols-3 gap-5 mb-8">
            <StatCard label="Total Ebooks" value={products.length.toString()} change={`${products.length} available in library`} icon="📚" positive />
            <StatCard label="Courses Enrolled" value={totalEnrollments.toString()} change={totalEnrollments > 0 ? `${totalEnrollments} active courses` : 'No courses yet'} icon="🎓" positive />
            <StatCard label="Learning Progress" value={`${averageProgress}%`} change={`${completedEnrollments} completed`} icon="📈" positive />
          </div>

          {/* ================= PERFORMANCE ================= */}
          <SectionHeader title="Performance & Statistics" action="This Month" />
          <div className="grid xl:grid-cols-[1.2fr_1fr] gap-5 mb-8">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="flex items-center justify-between p-5 border-b border-slate-800">
                <h3 className="font-bold">Course Completion</h3>
                <button className="text-xs px-3 py-1.5 rounded-lg bg-brand-primary/10 text-brand-primary">View All</button>
              </div>
              <div className="p-5 space-y-6">
                <ProgressItem label="Completed" users={`${completedEnrollments} Courses`} percentage={totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0} />
                <ProgressItem label="In Progress" users={`${totalEnrollments - completedEnrollments} Courses`} percentage={totalEnrollments > 0 ? Math.round(((totalEnrollments - completedEnrollments) / totalEnrollments) * 100) : 0} />
                <ProgressItem label="Not Started" users="0 Courses" percentage={0} />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="p-5 border-b border-slate-800"><h3 className="font-bold">Learning Overview</h3></div>
              <div className="p-5">
                <div className="h-56 flex items-center justify-center">
                  <div className="relative w-40 h-40">
                    <div className="absolute inset-0 rounded-full border-[14px] border-slate-800" />
                    <div className="absolute inset-0 rounded-full border-[14px] border-brand-primary" style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)' }} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold">{averageProgress}%</span>
                      <span className="text-xs text-slate-500">Completed</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center gap-6 text-xs text-slate-400">
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-brand-primary" />Completed</span>
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-slate-700" />Remaining</span>
                </div>
              </div>
            </div>
          </div>

          {/* ================= LESSONS ================= */}
          <div className="grid xl:grid-cols-[1.2fr_1fr] gap-5 mb-8">
            <div>
              <SectionHeader title="Available Courses" action="View All" href="/courses" />
              <div className="space-y-3">
                {courses.slice(0, 3).map((course) => (
                  <LessonCard
                    key={course.id}
                    title={course.title}
                    subtitle={course.description || 'Click to learn more'}
                    icon={getCourseIcon(course.title)}
                    color={course.level === 'beginner' ? 'green' : course.level === 'intermediate' ? 'orange' : 'primary'}
                  />
                ))}
              </div>
            </div>

            <div>
              <SectionHeader title="Recent Activity" action="View All" />
              <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800">
                <ActivityItem icon="📚" title="New ebook available" description="Check out the latest addition to the store." time="Today" />
                <ActivityItem icon="🎓" title="Course enrollment" description="Your learning journey is ready to continue." time="Yesterday" />
                <ActivityItem icon="✓" title="Profile updated" description="Your account information was updated." time="3 days ago" />
                <ActivityItem icon="⭐" title="Welcome to Ifalode" description="Explore everything available to you." time="1 week ago" />
              </div>
            </div>
          </div>

          {/* ================= MEDIA / PURCHASED CONTENT ================= */}
          <SectionHeader title="Your Library" action="View All" href="/store" />
          <div className="bg-slate-900 border border-slate-800 rounded-2xl mb-8 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-800 text-left">
                    <th className="px-5 py-4 text-xs uppercase tracking-wide text-slate-500">Content</th>
                    <th className="px-5 py-4 text-xs uppercase tracking-wide text-slate-500">Type</th>
                    <th className="px-5 py-4 text-xs uppercase tracking-wide text-slate-500">Status</th>
                    <th className="px-5 py-4 text-xs uppercase tracking-wide text-slate-500">Access</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">No content in your library yet. <Link href="/store" className="text-brand-primary hover:underline">Browse Store →</Link></td></tr>
                  ) : (
                    products.slice(0, 3).map((product) => (
                      <LibraryRow
                        key={product.id}
                        title={product.title}
                        subtitle={product.description || 'Ebook'}
                        icon={product.title.charAt(0).toUpperCase()}
                        type="Ebook"
                        status="Available"
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ================= BOTTOM ACTIONS ================= */}
          <div className="grid md:grid-cols-2 gap-5 mb-8">
            <Link href="/store" className="group rounded-2xl p-6 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 transition">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-full border border-white/30 flex items-center justify-center text-2xl">🛒</div>
                <div>
                  <h3 className="font-bold text-lg text-white">Browse the Store</h3>
                  <p className="text-sm text-white/70 mt-1">Discover ebooks and learning resources</p>
                </div>
              </div>
            </Link>
            <Link href="/courses" className="group rounded-2xl p-6 bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-95 transition">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-full border border-white/30 flex items-center justify-center text-2xl">🎓</div>
                <div>
                  <h3 className="font-bold text-lg text-white">Explore Courses</h3>
                  <p className="text-sm text-white/70 mt-1">Continue your education and grow your skills</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Footer */}
          <footer className="border-t border-slate-800 pt-6 pb-4 flex flex-col md:flex-row justify-between gap-3 text-xs text-slate-600">
            <p>© {new Date().getFullYear()} {brand?.display_name || 'Ifalode'}. All rights reserved.</p>
            <div className="flex gap-5">
              <Link href="/store" className="hover:text-slate-400">Store</Link>
              <Link href="/courses" className="hover:text-slate-400">Courses</Link>
              <Link href="/profile" className="hover:text-slate-400">Profile</Link>
            </div>
          </footer>
        </div>
      </main>
    </div>
  )
}

// ================= COMPONENTS =================

function SidebarLink({ href, icon, label, active = false, collapsed = false }: any) {
  return (
    <Link href={href} title={collapsed ? label : undefined} className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-3'} py-3 rounded-lg mb-1 transition ${active ? 'bg-brand-primary/10 text-brand-primary' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
      <span className="text-lg w-6 text-center">{icon}</span>
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
      {!collapsed && active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-primary" />}
    </Link>
  )
}

function SectionHeader({ title, action, href }: any) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      {href ? <Link href={href} className="text-xs font-semibold text-brand-primary hover:underline">{action}</Link> : <button className="text-xs px-3 py-1.5 rounded-lg bg-brand-primary/10 text-brand-primary">{action}</button>}
    </div>
  )
}

function CourseCard({ title, status, progress, remaining, icon, color }: any) {
  const colors = { primary: 'from-brand-primary/20', purple: 'from-purple-500/20', green: 'from-green-500/20', orange: 'from-orange-500/20' }
  const textColors = { primary: 'text-brand-primary', purple: 'text-purple-400', green: 'text-green-400', orange: 'text-orange-400' }
  return (
    <div className={`relative overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition group`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${colors[color] || colors.primary} to-transparent opacity-50`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${status === 'Finished' ? 'bg-green-500/10 text-green-400' : status === 'Paused' ? 'bg-orange-500/10 text-orange-400' : status === 'Active' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-slate-800 text-slate-400'}`}>{status}</span>
            <span className="px-2 py-1 rounded-md bg-slate-800 text-slate-500 text-xs">🔒</span>
          </div>
          <button className="text-slate-600 hover:text-white">•••</button>
        </div>
        <div className="text-3xl mb-4">{icon}</div>
        <h3 className="font-bold text-white mb-1">{title}</h3>
        <p className="text-xs text-slate-500 mb-4">{remaining}</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-brand-primary rounded-full" style={{ width: `${progress}%` }} /></div>
          <span className={`text-xs font-bold ${textColors[color] || textColors.primary}`}>{progress}%</span>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, change, icon, positive }: any) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-2">{label}</p>
          <h3 className="text-3xl font-bold text-white">{value}</h3>
          <p className={`text-xs mt-2 ${positive ? 'text-slate-500' : 'text-red-400'}`}>{change}</p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-brand-primary/10 flex items-center justify-center text-lg">{icon}</div>
      </div>
    </div>
  )
}

function ProgressItem({ label, users, percentage }: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-brand-primary">{label}</span>
        <span className="text-xs text-slate-500">{users}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-brand-primary rounded-full transition-all" style={{ width: `${percentage}%` }} /></div>
        <span className="text-xs text-slate-400 w-8 text-right">{percentage}%</span>
      </div>
    </div>
  )
}

function LessonCard({ title, subtitle, icon, color }: any) {
  const bg = { primary: 'bg-brand-primary/10 text-brand-primary', green: 'bg-green-500/10 text-green-400', orange: 'bg-orange-500/10 text-orange-400', red: 'bg-red-500/10 text-red-400' }
  return (
    <Link href="/courses" className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition group">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${bg[color] || bg.primary}`}>{icon}</div>
        <div>
          <h3 className="text-sm font-semibold text-white group-hover:text-brand-primary transition">{title}</h3>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>
      </div>
      <span className="text-xl text-slate-600 group-hover:text-brand-primary transition">→</span>
    </Link>
  )
}

function ActivityItem({ icon, title, description, time }: any) {
  return (
    <div className="p-4 flex gap-4">
      <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">{icon}</div>
      <div className="min-w-0">
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
        <p className="text-[10px] text-slate-600 mt-2">{time}</p>
      </div>
    </div>
  )
}

function LibraryRow({ title, subtitle, icon, type, status }: any) {
  return (
    <tr className="border-b border-slate-800 last:border-0">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold">{icon}</div>
          <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4 text-sm text-slate-400">{type}</td>
      <td className="px-5 py-4"><span className="inline-flex items-center gap-2 text-xs text-slate-400"><span className="w-2 h-2 rounded-full bg-brand-primary" />{status}</span></td>
      <td className="px-5 py-4"><Link href="/store" className="text-xs font-semibold text-brand-primary hover:underline">Explore →</Link></td>
    </tr>
  )
}
