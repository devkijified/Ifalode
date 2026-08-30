'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useBrand } from '@/hooks/useBrand'
import { User as SupabaseUser } from '@supabase/supabase-js'

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
  file_url: string | null
  category: string | null
  is_ebook: boolean
  stock: number
  created_at: string
  updated_at: string
}

interface Order {
  id: string
  user_id: string
  product_id: string | null
  course_id: string | null
  amount: number
  status: 'pending' | 'completed' | 'failed'
  payment_method: string | null
  created_at: string
  product?: Product
  course?: Course
}

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

export default function DashboardPage() {
  const { brand } = useBrand()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)
      setLoading(false)
    }

    getUser()
  }, [])

  useEffect(() => {
    if (!user) return

    const fetchDashboardData = async () => {
      try {
        // Fetch enrollments with course details
        const { data: enrollmentsData, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select(`
            *,
            course:courses (
              id,
              title,
              description,
              instructor,
              price,
              cover_image,
              category,
              level,
              is_published,
              created_at,
              updated_at
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (enrollmentsError) {
          console.error('Enrollments error:', enrollmentsError)
          throw enrollmentsError
        }
        
        console.log('✅ Enrollments found:', enrollmentsData?.length || 0)
        console.log('📚 Enrollments:', enrollmentsData)
        setEnrollments(enrollmentsData || [])

        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`
            *,
            product:products (
              id,
              title,
              description,
              price,
              cover_image,
              file_url,
              category,
              is_ebook,
              stock,
              created_at,
              updated_at
            ),
            course:courses (
              id,
              title,
              description,
              instructor,
              price,
              cover_image,
              category,
              level,
              is_published,
              created_at,
              updated_at
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })

        if (ordersError) throw ordersError
        setOrders(ordersData || [])

        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)

        if (productsError) throw productsError
        setProducts(productsData || [])

        if (enrollmentsData && enrollmentsData.length > 0) {
          const typedEnrollments = enrollmentsData as any[]
          const courseIds = typedEnrollments.map(e => e.course_id)
          const { data: lessonsData, error: lessonsError } = await supabase
            .from('lessons')
            .select('*')
            .in('course_id', courseIds)
            .order('order_number', { ascending: true })
            .limit(10)

          if (lessonsError) throw lessonsError
          setLessons(lessonsData || [])
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setDataLoading(false)
      }
    }

    fetchDashboardData()
  }, [user])

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

  const fullName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    'User'

  const firstName = fullName.split(' ')[0]

  const totalEbooks = orders.filter(o => o.product).length
  const coursesEnrolled = enrollments.length
  const totalProgress = enrollments.reduce((acc, curr) => acc + curr.progress, 0)
  const averageProgress = coursesEnrolled > 0 ? Math.round(totalProgress / coursesEnrolled) : 0

  const inProgressCourses = enrollments.filter(e => !e.completed && e.progress > 0)
  const completedCourses = enrollments.filter(e => e.completed)
  const notStartedCourses = enrollments.filter(e => e.progress === 0)

  // Course icons based on title
  const getCourseIcon = (title: string) => {
    if (title.includes('Divination')) return '🔮'
    if (title.includes('Practices')) return '📿'
    return '📘'
  }

  // Course color based on level
  const getCourseColor = (level: string | null): 'primary' | 'purple' | 'green' | 'orange' => {
    switch (level) {
      case 'beginner': return 'green'
      case 'intermediate': return 'orange'
      case 'advanced': return 'red'
      default: return 'primary'
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* Header */}
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
              <div className="hidden lg:flex items-center w-64 h-10 bg-slate-950 border border-slate-800 rounded-lg px-3">
                <span className="text-slate-500 mr-2">⌕</span>
                <input type="text" placeholder="Search..." className="bg-transparent outline-none text-sm w-full text-slate-200 placeholder:text-slate-600" />
              </div>
              <button className="relative w-10 h-10 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition">
                🔔
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-primary" />
              </button>
              <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-white">{fullName}</p>
                  <p className="text-xs text-slate-500">
                    {coursesEnrolled} {coursesEnrolled === 1 ? 'Course' : 'Courses'}
                  </p>
                </div>
                <button className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center font-bold text-white">
                  {firstName.charAt(0).toUpperCase()}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-[72px] bottom-0 z-40 bg-slate-900 border-r border-slate-800 transition-all duration-300 ${sidebarOpen ? 'w-[250px]' : 'w-[80px]'}`}>
        <div className="h-full flex flex-col">
          <nav className="flex-1 px-3 py-6 overflow-y-auto">
            {sidebarOpen && <p className="px-3 mb-3 text-[10px] uppercase tracking-widest font-bold text-slate-600">Dashboard & Apps</p>}
            <SidebarLink href="/dashboard" icon="▦" label="Dashboard" active collapsed={!sidebarOpen} />
            <SidebarLink href="/store" icon="🛒" label="Store" collapsed={!sidebarOpen} />
            <SidebarLink href="/courses" icon="🎓" label="Courses" collapsed={!sidebarOpen} />
            <SidebarLink href="/dashboard" icon="📚" label="My Learning" collapsed={!sidebarOpen} />
            <SidebarLink href="/dashboard" icon="📊" label="Progress" collapsed={!sidebarOpen} />
            {sidebarOpen && <p className="px-3 mt-8 mb-3 text-[10px] uppercase tracking-widest font-bold text-slate-600">Account</p>}
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

      {/* Main Content */}
      <main className={`pt-[72px] min-h-screen transition-all duration-300 ${sidebarOpen ? 'ml-[250px]' : 'ml-[80px]'}`}>
        <div className="p-5 md:p-7 lg:p-8 max-w-[1600px] mx-auto">

          {/* Hero Section */}
          <div className="grid xl:grid-cols-[1fr_280px] gap-5 mb-7">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-primary to-brand-secondary p-7 md:p-8">
              <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-white/10" />
              <div className="absolute right-20 -bottom-28 w-48 h-48 rounded-full bg-white/5" />
              <div className="relative z-10 max-w-3xl">
                <span className="inline-flex px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold mb-4">Your Learning Dashboard</span>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">Hello {firstName}, Welcome Back!</h1>
                <p className="text-white/70 text-sm md:text-base max-w-2xl">
                  You are enrolled in <strong>{coursesEnrolled}</strong> {coursesEnrolled === 1 ? 'course' : 'courses'}. 
                  {averageProgress > 0 ? ` Average progress: ${averageProgress}%` : ' Start learning today!'}
                </p>
                <div className="flex flex-wrap gap-3 mt-6">
                  <Link href="/courses" className="px-5 py-2.5 bg-white text-slate-900 rounded-lg text-sm font-semibold hover:bg-slate-100 transition">Continue Learning</Link>
                  <Link href="/store" className="px-5 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm font-semibold hover:bg-white/20 transition">Browse Store</Link>
                </div>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-center text-center">
              <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto mb-4 text-xl">✦</div>
              <h3 className="font-bold text-lg mb-2">Have more to learn?</h3>
              <p className="text-sm text-slate-500 mb-5">Explore our latest courses and ebooks.</p>
              <Link href="/courses" className="w-full py-2.5 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:opacity-90 transition">Explore Courses</Link>
            </div>
          </div>

          {/* Your Courses Section */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Your Courses</h2>
            <Link href="/courses" className="text-xs font-semibold text-brand-primary hover:underline">View All</Link>
          </div>

          {dataLoading ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 animate-pulse">
                  <div className="h-4 bg-slate-800 rounded w-20 mb-4" />
                  <div className="h-8 bg-slate-800 rounded w-12 mb-4" />
                  <div className="h-4 bg-slate-800 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-slate-800 rounded w-1/2 mb-4" />
                  <div className="h-2 bg-slate-800 rounded w-full" />
                </div>
              ))}
            </div>
          ) : enrollments.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8 text-center">
              <div className="text-4xl mb-4">🎓</div>
              <h3 className="font-bold text-lg mb-2">No courses yet</h3>
              <p className="text-sm text-slate-500 mb-4">Explore our courses and start your learning journey</p>
              <Link href="/courses" className="inline-block px-5 py-2.5 bg-brand-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition">Browse Courses</Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
              {enrollments.map((enrollment) => {
                const course = enrollment.course
                if (!course) {
                  console.warn('Course not found for enrollment:', enrollment.id)
                  return null
                }
                const status = enrollment.completed ? 'Finished' : enrollment.progress > 0 ? 'Active' : 'Not Started'
                const color = getCourseColor(course.level)
                const icon = getCourseIcon(course.title)
                
                return (
                  <CourseCard
                    key={enrollment.id}
                    courseId={enrollment.course_id}
                    title={course.title || 'Untitled Course'}
                    status={status}
                    progress={`${enrollment.progress}%`}
                    remaining={enrollment.completed ? 'Completed' : `${course.level || 'All'} Level`}
                    icon={icon}
                    color={color}
                    price={course.price}
                  />
                )
              })}
            </div>
          )}

          {/* Stats */}
          <div className="grid lg:grid-cols-3 gap-5 mb-8">
            <StatCard 
              label="Total Ebooks" 
              value={totalEbooks.toString()} 
              change={totalEbooks === 0 ? "Start building your library" : `${totalEbooks} ebook${totalEbooks > 1 ? 's' : ''} purchased`} 
              icon="📚" 
              positive 
            />
            <StatCard 
              label="Courses Enrolled" 
              value={coursesEnrolled.toString()} 
              change={coursesEnrolled === 0 ? "Explore courses to begin" : `${coursesEnrolled} course${coursesEnrolled > 1 ? 's' : ''} enrolled`} 
              icon="🎓" 
              positive 
            />
            <StatCard 
              label="Learning Progress" 
              value={`${averageProgress}%`} 
              change={averageProgress === 0 ? "Start your first lesson!" : "Keep up the great work!"} 
              icon="📈" 
              positive 
            />
          </div>

          {/* Performance */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Performance & Statistics</h2>
            <button className="text-xs px-3 py-1.5 rounded-lg bg-brand-primary/10 text-brand-primary">This Month</button>
          </div>

          <div className="grid xl:grid-cols-[1.2fr_1fr] gap-5 mb-8">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="flex items-center justify-between p-5 border-b border-slate-800">
                <h3 className="font-bold">Course Completion</h3>
                <button className="text-xs px-3 py-1.5 rounded-lg bg-brand-primary/10 text-brand-primary">View All</button>
              </div>
              <div className="p-5 space-y-6">
                <ProgressItem 
                  label="In Progress" 
                  users={`${inProgressCourses.length} Course${inProgressCourses.length !== 1 ? 's' : ''}`} 
                  percentage={coursesEnrolled > 0 ? Math.round((inProgressCourses.length / coursesEnrolled) * 100) : 0} 
                />
                <ProgressItem 
                  label="Completed" 
                  users={`${completedCourses.length} Course${completedCourses.length !== 1 ? 's' : ''}`} 
                  percentage={coursesEnrolled > 0 ? Math.round((completedCourses.length / coursesEnrolled) * 100) : 0} 
                />
                <ProgressItem 
                  label="Not Started" 
                  users={`${notStartedCourses.length} Course${notStartedCourses.length !== 1 ? 's' : ''}`} 
                  percentage={coursesEnrolled > 0 ? Math.round((notStartedCourses.length / coursesEnrolled) * 100) : 0} 
                />
                <ProgressItem label="Expired" users="0 Courses" percentage={0} />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="p-5 border-b border-slate-800"><h3 className="font-bold">Learning Overview</h3></div>
              <div className="p-5">
                <div className="h-56 flex items-center justify-center">
                  <div className="relative w-40 h-40">
                    <div className="absolute inset-0 rounded-full border-[14px] border-slate-800" />
                    <div className="absolute inset-0 rounded-full border-[14px] border-brand-primary" style={{ clipPath: averageProgress >= 50 ? 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)' : `polygon(50% 0, ${averageProgress}% 0, ${averageProgress}% 100%, 50% 100%)` }} />
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

          {/* Lessons & Activity */}
          <div className="grid xl:grid-cols-[1.2fr_1fr] gap-5 mb-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Lessons</h2>
                <Link href="/courses" className="text-xs font-semibold text-brand-primary hover:underline">View All</Link>
              </div>
              {dataLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 animate-pulse">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-800" />
                        <div className="flex-1">
                          <div className="h-4 bg-slate-800 rounded w-3/4 mb-2" />
                          <div className="h-3 bg-slate-800 rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : lessons.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                  <p className="text-sm text-slate-500">No lessons available. Enroll in a course to start learning.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lessons.slice(0, 3).map((lesson, index) => {
                    const icons = ['📖', '✦', '🎯', '📝', '🔬', '💡']
                    const colors = ['orange', 'primary', 'red', 'purple', 'green', 'blue']
                    return (
                      <LessonCard 
                        key={lesson.id} 
                        title={lesson.title} 
                        subtitle={lesson.content ? lesson.content.substring(0, 50) + '...' : 'Course lesson'} 
                        icon={icons[index % icons.length]} 
                        color={colors[index % colors.length] as any} 
                      />
                    )
                  })}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Recent Activity</h2>
                <button className="text-xs px-3 py-1.5 rounded-lg bg-brand-primary/10 text-brand-primary">View All</button>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800">
                {orders.length > 0 ? (
                  <>
                    <ActivityItem icon="📚" title="New purchase" description={`You purchased ${orders[0].product?.title || 'a product'}`} time="Today" />
                    {enrollments.length > 0 && <ActivityItem icon="🎓" title="Course enrollment" description={`You enrolled in ${enrollments[0].course?.title || 'a course'}`} time={enrollments[0].enrolled_at ? new Date(enrollments[0].enrolled_at).toLocaleDateString() : 'Recently'} />}
                  </>
                ) : enrollments.length > 0 ? (
                  <ActivityItem icon="🎓" title="Course enrollment" description={`You enrolled in ${enrollments[0].course?.title || 'a course'}`} time={enrollments[0].enrolled_at ? new Date(enrollments[0].enrolled_at).toLocaleDateString() : 'Recently'} />
                ) : (
                  <>
                    <ActivityItem icon="📚" title="New ebook available" description="Check out the latest addition to the store." time="Today" />
                    <ActivityItem icon="🎓" title="Course enrollment" description="Your learning journey is ready to continue." time="Yesterday" />
                  </>
                )}
                <ActivityItem icon="✓" title="Profile updated" description="Your account information was updated." time="3 days ago" />
                <ActivityItem icon="⭐" title="Welcome to Ifalode" description="Explore everything available to you." time="1 week ago" />
              </div>
            </div>
          </div>

          {/* Library */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Your Library</h2>
            <Link href="/store" className="text-xs font-semibold text-brand-primary hover:underline">View All</Link>
          </div>

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
                  {orders.filter(o => o.product).length === 0 && orders.filter(o => o.course).length === 0 ? (
                    <>
                      <LibraryRow title="No ebooks purchased yet" subtitle="Visit the store to build your library" icon="A1" type="Ebook" status="Available" />
                      <LibraryRow title="No courses enrolled yet" subtitle="Explore courses to get started" icon="B1" type="Course" status="Available" />
                    </>
                  ) : (
                    <>
                      {orders.filter(o => o.product).map(order => (
                        <LibraryRow key={order.id} title={order.product?.title || 'Purchased Product'} subtitle={order.product?.description || 'Digital product'} icon="📚" type="Ebook" status="Purchased" />
                      ))}
                      {orders.filter(o => o.course).map(order => (
                        <LibraryRow key={order.id} title={order.course?.title || 'Enrolled Course'} subtitle={order.course?.description || 'Online course'} icon="🎓" type="Course" status="Enrolled" />
                      ))}
                      {enrollments.filter(e => !orders.some(o => o.course_id === e.course_id)).map(enrollment => (
                        <LibraryRow key={enrollment.id} title={enrollment.course?.title || 'Enrolled Course'} subtitle={enrollment.course?.description || 'Online course'} icon="🎓" type="Course" status="Enrolled" />
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Actions */}
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

// ============================================================
// COMPONENTS
// ============================================================

function SidebarLink({ href, icon, label, active = false, collapsed = false }: { href: string; icon: string; label: string; active?: boolean; collapsed?: boolean }) {
  return (
    <Link href={href} title={collapsed ? label : undefined} className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-3'} py-3 rounded-lg mb-1 transition ${active ? 'bg-brand-primary/10 text-brand-primary' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
      <span className="text-lg w-6 text-center">{icon}</span>
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
      {!collapsed && active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-primary" />}
    </Link>
  )
}

function CourseCard({ title, status, progress, remaining, icon, color, courseId, price }: { title: string; status: string; progress: string; remaining: string; icon: string; color: 'primary' | 'purple' | 'green' | 'orange'; courseId: string; price?: number | null }) {
  const colors = { primary: 'from-brand-primary/20', purple: 'from-purple-500/20', green: 'from-green-500/20', orange: 'from-orange-500/20' }
  const textColors = { primary: 'text-brand-primary', purple: 'text-purple-400', green: 'text-green-400', orange: 'text-orange-400' }
  const borderColors = { primary: 'border-brand-primary/30', purple: 'border-purple-500/30', green: 'border-green-500/30', orange: 'border-orange-500/30' }

  return (
    <Link href={`/courses/${courseId}/learn`} className="block group">
      <div className={`relative overflow-hidden bg-slate-900 border ${borderColors[color]} rounded-2xl p-5 hover:border-slate-700 transition`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${colors[color]} to-transparent opacity-50`} />
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${status === 'Finished' ? 'bg-green-500/10 text-green-400' : status === 'Active' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-slate-800 text-slate-400'}`}>
                {status}
              </span>
              {price === 0 && (
                <span className="px-2 py-1 rounded-md bg-green-500/10 text-green-400 text-[10px] font-bold uppercase">Free</span>
              )}
            </div>
            <button className="text-slate-600 hover:text-white">•••</button>
          </div>
          <div className="text-3xl mb-4">{icon}</div>
          <h3 className="font-bold text-white mb-1 group-hover:text-brand-primary transition line-clamp-1">{title}</h3>
          <p className="text-xs text-slate-500 mb-4">{remaining}</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-brand-primary rounded-full transition-all duration-500" style={{ width: progress }} />
            </div>
            <span className={`text-xs font-bold ${textColors[color]}`}>{progress}</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            {price !== undefined && price > 0 && (
              <span className="text-xs text-slate-500">${price}</span>
            )}
            <span className="text-xs font-medium text-brand-primary group-hover:text-brand-secondary transition ml-auto">
              {status === 'Finished' ? 'Review →' : status === 'Active' ? 'Continue →' : 'Start →'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function StatCard({ label, value, change, icon, positive }: { label: string; value: string; change: string; icon: string; positive?: boolean }) {
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

function ProgressItem({ label, users, percentage }: { label: string; users: string; percentage: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-brand-primary">{label}</span>
        <span className="text-xs text-slate-500">{users}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-brand-primary rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
        </div>
        <span className="text-xs text-slate-400 w-8 text-right">{percentage}%</span>
      </div>
    </div>
  )
}

function LessonCard({ title, subtitle, icon, color }: { title: string; subtitle: string; icon: string; color: 'primary' | 'orange' | 'red' | 'purple' | 'green' | 'blue' }) {
  const bg = { primary: 'bg-brand-primary/10 text-brand-primary', orange: 'bg-orange-500/10 text-orange-400', red: 'bg-red-500/10 text-red-400', purple: 'bg-purple-500/10 text-purple-400', green: 'bg-green-500/10 text-green-400', blue: 'bg-blue-500/10 text-blue-400' }

  return (
    <Link href="/courses" className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition group">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${bg[color]}`}>{icon}</div>
        <div>
          <h3 className="text-sm font-semibold text-white group-hover:text-brand-primary transition line-clamp-1">{title}</h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{subtitle}</p>
        </div>
      </div>
      <span className="text-xl text-slate-600 group-hover:text-brand-primary transition">→</span>
    </Link>
  )
}

function ActivityItem({ icon, title, description, time }: { icon: string; title: string; description: string; time: string }) {
  return (
    <div className="p-4 flex gap-4">
      <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">{icon}</div>
      <div className="min-w-0">
        <h4 className="text-sm font-semibold text-white line-clamp-1">{title}</h4>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{description}</p>
        <p className="text-[10px] text-slate-600 mt-2">{time}</p>
      </div>
    </div>
  )
}

function LibraryRow({ title, subtitle, icon, type, status }: { title: string; subtitle: string; icon: string; type: string; status: string }) {
  return (
    <tr className="border-b border-slate-800 last:border-0">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold">{icon}</div>
          <div>
            <p className="text-sm font-semibold text-white line-clamp-1">{title}</p>
            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{subtitle}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4 text-sm text-slate-400">{type}</td>
      <td className="px-5 py-4">
        <span className="inline-flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-brand-primary" />
          {status}
        </span>
      </td>
      <td className="px-5 py-4">
        <Link href="/store" className="text-xs font-semibold text-brand-primary hover:underline">Explore →</Link>
      </td>
    </tr>
  )
}
