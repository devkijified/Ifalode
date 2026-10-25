'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useBrand } from '@/hooks/useBrand'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { LiveClassesWidget } from '@/components/live-class/LiveClassesWidget'
import { Icon, type IconName } from '@/components/ui/Icon'
import {
  EmptyState,
  HelpTip,
  LevelBadge,
  PosterFallback,
  Price,
  ProgressBar,
  SectionHeader,
  Skeleton,
} from '@/components/ui/primitives'
import { formatCompactCount } from '@/lib/format'

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
        // ------------------------------------------------------------------
        // ENROLLMENTS
        // Fetched WITHOUT an embedded `course:courses(...)` join.
        // Reason: an embedded join is subject to RLS on the `courses` table.
        // If courses has a policy like `is_published = true`, any enrollment
        // pointing at an unpublished/draft course silently comes back with
        // course: null, which made the card disappear even though the
        // enrollment row (and the "Courses Enrolled" count) was correct.
        // Fetching courses separately and merging client-side sidesteps that,
        // and lets us log a warning instead of silently hiding the row.
        // ------------------------------------------------------------------
        const { data: enrollmentsRaw, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', user.id)
          .order('enrolled_at', { ascending: false })

        if (enrollmentsError) {
          console.error('Enrollments error:', enrollmentsError)
          throw enrollmentsError
        }

        const enrollmentsRawTyped = (enrollmentsRaw || []) as Enrollment[]

        const enrollmentCourseIds = Array.from(
          new Set(enrollmentsRawTyped.map((e) => e.course_id).filter(Boolean))
        )

        let coursesForEnrollments: Course[] = []
        if (enrollmentCourseIds.length > 0) {
          const { data: coursesData, error: coursesError } = await supabase
            .from('courses')
            .select('*')
            .in('id', enrollmentCourseIds)

          if (coursesError) {
            console.error('Courses (for enrollments) error:', coursesError)
            throw coursesError
          }
          coursesForEnrollments = coursesData || []
        }

        const enrollmentsData: Enrollment[] = enrollmentsRawTyped.map((e) => {
          const course = coursesForEnrollments.find((c) => c.id === e.course_id)
          if (!course) {
            // Most likely cause: RLS on `courses` is hiding this course from
            // the current user (e.g. is_published = false and no policy
            // grants enrolled users access to their own unpublished course).
            console.warn(
              '[dashboard] Enrollment has no matching course (likely RLS or deleted course):',
              { enrollmentId: e.id, courseId: e.course_id }
            )
          }
          return { ...e, course }
        })

        console.log('Enrollments found:', enrollmentsData.length)
        console.log(
          'Enrollments with resolved course data:',
          enrollmentsData.filter((e) => e.course).length
        )
        setEnrollments(enrollmentsData)

        // ------------------------------------------------------------------
        // ORDERS
        // Same fix applied: fetch orders, then fetch products/courses for
        // the referenced ids separately, then merge. Avoids the same RLS
        // blind spot on embedded `product:products(...)` / `course:courses(...)`.
        // ------------------------------------------------------------------
        const { data: ordersRaw, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })

        if (ordersError) throw ordersError

        const ordersRawTyped = (ordersRaw || []) as Order[]

        const orderProductIds = Array.from(
          new Set(ordersRawTyped.map((o) => o.product_id).filter(Boolean))
        ) as string[]
        const orderCourseIds = Array.from(
          new Set(ordersRawTyped.map((o) => o.course_id).filter(Boolean))
        ) as string[]

        let productsForOrders: Product[] = []
        if (orderProductIds.length > 0) {
          const { data: productsData, error: productsForOrdersError } = await supabase
            .from('products')
            .select('*')
            .in('id', orderProductIds)

          if (productsForOrdersError) throw productsForOrdersError
          productsForOrders = productsData || []
        }

        let coursesForOrders: Course[] = []
        if (orderCourseIds.length > 0) {
          const { data: coursesData, error: coursesForOrdersError } = await supabase
            .from('courses')
            .select('*')
            .in('id', orderCourseIds)

          if (coursesForOrdersError) throw coursesForOrdersError
          coursesForOrders = coursesData || []
        }

        const ordersData: Order[] = ordersRawTyped.map((o) => {
          const product = o.product_id
            ? productsForOrders.find((p) => p.id === o.product_id)
            : undefined
          const course = o.course_id
            ? coursesForOrders.find((c) => c.id === o.course_id)
            : undefined

          if (o.product_id && !product) {
            console.warn('[dashboard] Order has no matching product (likely RLS or deleted product):', {
              orderId: o.id,
              productId: o.product_id,
            })
          }
          if (o.course_id && !course) {
            console.warn('[dashboard] Order has no matching course (likely RLS or deleted course):', {
              orderId: o.id,
              courseId: o.course_id,
            })
          }

          return { ...o, product, course }
        })

        setOrders(ordersData)

        // ------------------------------------------------------------------
        // STORE PRODUCTS (unrelated to the enrollment bug, unchanged)
        // ------------------------------------------------------------------
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)

        if (productsError) throw productsError
        setProducts(productsData || [])

        // ------------------------------------------------------------------
        // LESSONS
        // ------------------------------------------------------------------
        if (enrollmentsData.length > 0) {
          const courseIds = enrollmentsData.map((e) => e.course_id)
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

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-10 w-72 max-w-full" />
        <Skeleton className="mt-3 h-5 w-96 max-w-full" />
        <div className="mt-8 space-y-4">
          <Skeleton className="aspect-[16/8] w-full sm:aspect-[16/5]" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
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

  const continueList =
    inProgressCourses.length > 0
      ? inProgressCourses.slice(0, 3)
      : enrollments.filter(e => !e.completed).slice(0, 1)

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-10">

      {/* Greeting */}
      <header className="mb-8">
        <p className="text-caption font-bold uppercase tracking-wider text-gold">My learning</p>
        <h1 className="mt-2 font-display text-display tracking-tight text-cream">
          Welcome back, {firstName}
        </h1>
        <p className="mt-2 max-w-2xl text-body text-cream-dim">
          You are enrolled in {formatCompactCount(coursesEnrolled)}{' '}
          {coursesEnrolled === 1 ? 'course' : 'courses'}.{' '}
          {averageProgress > 0
            ? `Your average progress is ${averageProgress}%. Pick up right where you left off.`
            : 'Start your first lesson and your progress will show here.'}
          <HelpTip text="Your progress updates as you work through lessons in each course. Finished courses stay in your library, so you can review them any time." />
        </p>
      </header>

      {/* Continue learning */}
      {!dataLoading && continueList.length > 0 && (
        <section aria-label="Continue learning" className="mb-10">
          <SectionHeader title="Continue learning" />
          <div className="space-y-4">
            {continueList.map((enrollment) => (
              <ContinueCard key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>
        </section>
      )}
      {dataLoading && (
        <section aria-label="Continue learning" className="mb-10">
          <SectionHeader title="Continue learning" />
          <Skeleton className="aspect-[16/8] w-full sm:aspect-[16/5]" />
        </section>
      )}

      {/* Stats */}
      <section aria-label="Your stats" className="mb-10">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard
            label="Courses enrolled"
            value={formatCompactCount(coursesEnrolled)}
            note={coursesEnrolled === 0 ? 'Explore courses to begin' : 'In your library'}
            icon="book"
          />
          <StatCard
            label="In progress"
            value={formatCompactCount(inProgressCourses.length)}
            note={inProgressCourses.length === 0 ? 'Nothing started yet' : 'Started, not finished yet'}
            icon="play"
          />
          <StatCard
            label="Completed"
            value={formatCompactCount(completedCourses.length)}
            note={completedCourses.length === 0 ? 'Finish a course to see it here' : 'Well done, keep going'}
            icon="award"
          />
          <StatCard
            label="Ebooks owned"
            value={formatCompactCount(totalEbooks)}
            note={totalEbooks === 0 ? 'Start building your library' : `${formatCompactCount(totalEbooks)} ebook${totalEbooks > 1 ? 's' : ''} purchased`}
            icon="note"
          />
        </div>
      </section>

      {/* Upcoming Live Classes */}
      <section aria-label="Upcoming live classes" className="mb-10">
        <SectionHeader title="Upcoming live classes" href="/live-classes" actionLabel="View all" />
        <LiveClassesWidget />
      </section>

      {/* All courses */}
      <section aria-label="All courses" className="mb-10">
        <SectionHeader title="All courses" href="/courses" actionLabel="Browse courses" />

        {dataLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : enrollments.length === 0 ? (
          <EmptyState
            title="No courses yet"
            body="Explore the course catalogue and start your learning journey today."
            action={
              <Link
                href="/courses"
                className="inline-flex min-h-[48px] items-center rounded-full bg-gold px-6 font-display text-body text-ink-950 transition hover:bg-gold-light"
              >
                Browse courses
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {enrollments.map((enrollment) => (
              <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>
        )}
      </section>

      {/* Course completion and overview */}
      <section aria-label="Course completion" className="mb-10 grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-cream/10 bg-ink-850 p-5 sm:p-6">
          <h3 className="font-display text-title text-cream">Course completion</h3>
          <div className="mt-6 space-y-6">
            <ProgressItem
              label="In progress"
              count={`${formatCompactCount(inProgressCourses.length)} course${inProgressCourses.length !== 1 ? 's' : ''}`}
              percentage={coursesEnrolled > 0 ? Math.round((inProgressCourses.length / coursesEnrolled) * 100) : 0}
            />
            <ProgressItem
              label="Completed"
              count={`${formatCompactCount(completedCourses.length)} course${completedCourses.length !== 1 ? 's' : ''}`}
              percentage={coursesEnrolled > 0 ? Math.round((completedCourses.length / coursesEnrolled) * 100) : 0}
            />
            <ProgressItem
              label="Not started"
              count={`${formatCompactCount(notStartedCourses.length)} course${notStartedCourses.length !== 1 ? 's' : ''}`}
              percentage={coursesEnrolled > 0 ? Math.round((notStartedCourses.length / coursesEnrolled) * 100) : 0}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-cream/10 bg-ink-850 p-5 sm:p-6">
          <h3 className="font-display text-title text-cream">Learning overview</h3>
          <div className="mt-6 text-center">
            <p className="font-display text-display text-cream">{averageProgress}%</p>
            <p className="mt-1 text-caption text-cream-dim">Average completion across your courses</p>
          </div>
          <ProgressBar value={averageProgress} className="mt-6" />
          <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-caption text-cream-dim">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-gold" />
              Completed {formatCompactCount(completedCourses.length)}
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-cream/20" />
              Still to finish {formatCompactCount(coursesEnrolled - completedCourses.length)}
            </span>
          </div>
        </div>
      </section>

      {/* Lessons and Recent Activity */}
      <div className="mb-10 grid gap-8 xl:grid-cols-[1.2fr_1fr]">
        <section aria-label="Recent lessons">
          <SectionHeader title="Recent lessons" href="/courses" actionLabel="View all" />
          {dataLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : lessons.length === 0 ? (
            <div className="rounded-2xl border border-cream/10 bg-ink-850 p-8 text-center">
              <p className="text-body text-cream-dim">No lessons available yet. Enroll in a course to start learning.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lessons.slice(0, 3).map((lesson) => (
                <LessonRow key={lesson.id} lesson={lesson} />
              ))}
            </div>
          )}
        </section>

        <section aria-label="Recent activity">
          <SectionHeader title="Recent activity" />
          <div className="divide-y divide-cream/10 rounded-2xl border border-cream/10 bg-ink-850">
            {orders.length > 0 ? (
              <>
                <ActivityItem icon="bag" title="New purchase" description={`You purchased ${orders[0].product?.title || 'a product'}`} time="Today" />
                {enrollments.length > 0 && (
                  <ActivityItem
                    icon="learn"
                    title="Course enrollment"
                    description={`You enrolled in ${enrollments[0].course?.title || 'a course'}`}
                    time={enrollments[0].enrolled_at ? new Date(enrollments[0].enrolled_at).toLocaleDateString() : 'Recently'}
                  />
                )}
              </>
            ) : enrollments.length > 0 ? (
              <ActivityItem
                icon="learn"
                title="Course enrollment"
                description={`You enrolled in ${enrollments[0].course?.title || 'a course'}`}
                time={enrollments[0].enrolled_at ? new Date(enrollments[0].enrolled_at).toLocaleDateString() : 'Recently'}
              />
            ) : (
              <>
                <ActivityItem icon="bag" title="New ebook available" description="Check out the latest addition to the store." time="Today" />
                <ActivityItem icon="learn" title="Course enrollment" description="Your learning journey is ready to continue." time="Yesterday" />
              </>
            )}
            <ActivityItem icon="check" title="Profile updated" description="Your account information was updated." time="3 days ago" />
            <ActivityItem icon="star" title={`Welcome to ${brand?.display_name || 'IfaLode'}`} description="Explore everything available to you." time="1 week ago" />
          </div>
        </section>
      </div>

      {/* Library */}
      <section aria-label="Your library" className="mb-10">
        <SectionHeader title="Your library" href="/store" actionLabel="View all" />
        <div className="overflow-hidden rounded-2xl border border-cream/10 bg-ink-850">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-cream/10 text-left">
                  <th className="px-5 py-4 text-meta font-bold uppercase tracking-wide text-cream-faint">Content</th>
                  <th className="px-5 py-4 text-meta font-bold uppercase tracking-wide text-cream-faint">Type</th>
                  <th className="px-5 py-4 text-meta font-bold uppercase tracking-wide text-cream-faint">Status</th>
                  <th className="px-5 py-4 text-meta font-bold uppercase tracking-wide text-cream-faint">Access</th>
                </tr>
              </thead>
              <tbody>
                {orders.filter(o => o.product).length === 0 && orders.filter(o => o.course).length === 0 && enrollments.length === 0 ? (
                  <>
                    <LibraryRow title="No ebooks purchased yet" subtitle="Visit the store to build your library" icon="bag" type="Ebook" status="Available" />
                    <LibraryRow title="No courses enrolled yet" subtitle="Explore courses to get started" icon="book" type="Course" status="Available" />
                  </>
                ) : (
                  <>
                    {orders.filter(o => o.product).map(order => (
                      <LibraryRow key={order.id} title={order.product?.title || 'Purchased Product'} subtitle={order.product?.description || 'Digital product'} icon="bag" type="Ebook" status="Purchased" />
                    ))}
                    {orders.filter(o => o.course).map(order => (
                      <LibraryRow key={order.id} title={order.course?.title || 'Enrolled Course'} subtitle={order.course?.description || 'Online course'} icon="book" type="Course" status="Enrolled" />
                    ))}
                    {enrollments.filter(e => !orders.some(o => o.course_id === e.course_id)).map(enrollment => (
                      <LibraryRow key={enrollment.id} title={enrollment.course?.title || 'Enrolled Course'} subtitle={enrollment.course?.description || 'Online course'} icon="book" type="Course" status="Enrolled" />
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* New in the store */}
      {!dataLoading && products.length > 0 && (
        <section aria-label="New in the store" className="mb-10">
          <SectionHeader title="New in the store" href="/store" actionLabel="Visit store" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.slice(0, 3).map((product) => (
              <Link
                key={product.id}
                href="/store"
                className="group block overflow-hidden rounded-2xl border border-cream/10 bg-ink-850 shadow-card transition hover:border-gold/40"
              >
                <div className="relative aspect-video w-full overflow-hidden">
                  {product.cover_image ? (
                    <img src={product.cover_image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <PosterFallback title={product.title} className="absolute inset-0 h-full w-full" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-display text-lead text-cream line-clamp-1 transition group-hover:text-gold-light">{product.title}</h3>
                  <p className="mt-1 text-caption text-cream-dim line-clamp-1">{product.description || 'Digital product'}</p>
                  <Price amount={product.price} className="mt-3 block text-lead text-gold" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Bottom actions */}
      <div className="mb-10 grid gap-5 md:grid-cols-2">
        <Link
          href="/store"
          className="group flex items-center gap-5 rounded-2xl border border-cream/10 bg-ink-850 p-6 transition hover:border-gold/40"
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
            <Icon name="bag" size={24} />
          </span>
          <span>
            <span className="block font-display text-title text-cream">Browse the store</span>
            <span className="mt-1 block text-body text-cream-dim">Discover ebooks and learning resources.</span>
          </span>
        </Link>
        <Link
          href="/courses"
          className="group flex items-center gap-5 rounded-2xl border border-cream/10 bg-ink-850 p-6 transition hover:border-gold/40"
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
            <Icon name="book" size={24} />
          </span>
          <span>
            <span className="block font-display text-title text-cream">Explore courses</span>
            <span className="mt-1 block text-body text-cream-dim">Find your next course and keep growing.</span>
          </span>
        </Link>
      </div>

      {/* Footer */}
      <footer className="flex flex-col justify-between gap-3 border-t border-cream/10 pb-4 pt-6 text-caption text-cream-faint md:flex-row">
        <p>Copyright {new Date().getFullYear()} {brand?.display_name || 'IfaLode'}. All rights reserved.</p>
        <div className="flex gap-5">
          <Link href="/store" className="transition hover:text-cream-dim">Store</Link>
          <Link href="/courses" className="transition hover:text-cream-dim">Courses</Link>
          <Link href="/profile" className="transition hover:text-cream-dim">Profile</Link>
        </div>
      </footer>

    </div>
  )
}

// ============================================================
// COMPONENTS
// ============================================================

function ContinueCard({ enrollment }: { enrollment: Enrollment }) {
  const course = enrollment.course
  if (!course) return null
  const progress = Math.max(0, Math.min(100, Math.round(enrollment.progress || 0)))
  const status = enrollment.completed ? 'Finished' : enrollment.progress > 0 ? 'In progress' : 'Not started'

  return (
    <article className="grid overflow-hidden rounded-2xl border border-cream/10 bg-ink-850 shadow-card lg:grid-cols-[minmax(0,400px)_1fr]">
      <div className="relative aspect-video w-full overflow-hidden lg:aspect-auto lg:h-full lg:min-h-[230px]">
        {course.cover_image ? (
          <img src={course.cover_image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <PosterFallback title={course.title} className="absolute inset-0 h-full w-full" />
        )}
        <span
          className={`absolute left-3 top-3 rounded-md px-2 py-1 text-meta font-bold uppercase tracking-wider backdrop-blur ${
            enrollment.completed ? 'bg-ink-950/85 text-success' : 'bg-ink-950/85 text-gold'
          }`}
        >
          {status}
        </span>
      </div>

      <div className="flex flex-col gap-3 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <LevelBadge level={course.level} />
          {course.category && (
            <span className="text-caption font-medium text-cream-dim">{course.category}</span>
          )}
        </div>
        <h3 className="font-display text-title leading-snug text-cream line-clamp-2">{course.title}</h3>
        {course.instructor && (
          <p className="flex items-center gap-1.5 text-caption text-cream-dim">
            <Icon name="teacher" size={14} />
            {course.instructor}
          </p>
        )}
        {course.description && (
          <p className="text-body text-cream-dim line-clamp-2">{course.description}</p>
        )}

        <div className="mt-auto pt-2">
          <div className="mb-2 flex items-center justify-between text-caption">
            <span className="font-bold text-cream">{progress}% complete</span>
            <span className="text-cream-dim">{100 - progress}% to go</span>
          </div>
          <ProgressBar value={progress} />
          <Link
            href={`/courses/${enrollment.course_id}/learn`}
            className="mt-4 inline-flex min-h-[48px] items-center gap-2 self-start rounded-full bg-gold px-6 font-display text-body text-ink-950 shadow-glow transition hover:bg-gold-light"
          >
            <Icon name="play" size={18} variant="Bold" />
            {enrollment.progress > 0 ? 'Resume lesson' : 'Start course'}
          </Link>
        </div>
      </div>
    </article>
  )
}

function EnrollmentCard({ enrollment }: { enrollment: Enrollment }) {
  const course = enrollment.course

  if (!course) {
    // Enrollment exists but course data could not be resolved (see the
    // warning logged during fetch). Show a fallback card instead of
    // silently hiding the enrollment.
    return (
      <div className="flex flex-col rounded-2xl border border-live/30 bg-ink-850 p-5">
        <span className="self-start rounded-md bg-live/10 px-2 py-1 text-meta font-bold uppercase tracking-wider text-live">
          Unavailable
        </span>
        <h3 className="mt-4 font-display text-lead text-cream">Course data unavailable</h3>
        <p className="mt-1 text-body text-cream-dim">
          This course could not be loaded. It may be unpublished or removed.
        </p>
      </div>
    )
  }

  const progress = Math.max(0, Math.min(100, Math.round(enrollment.progress || 0)))
  const status = enrollment.completed ? 'Finished' : enrollment.progress > 0 ? 'In progress' : 'Not started'
  const cta = enrollment.completed ? 'Review course' : enrollment.progress > 0 ? 'Continue' : 'Start course'

  return (
    <Link
      href={`/courses/${enrollment.course_id}/learn`}
      className="group block overflow-hidden rounded-2xl border border-cream/10 bg-ink-850 shadow-card transition hover:border-gold/40"
    >
      <div className="relative aspect-video w-full overflow-hidden">
        {course.cover_image ? (
          <img src={course.cover_image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <PosterFallback title={course.title} className="absolute inset-0 h-full w-full" />
        )}
        <span
          className={`absolute left-3 top-3 rounded-md px-2 py-1 text-meta font-bold uppercase tracking-wider backdrop-blur ${
            enrollment.completed ? 'bg-ink-950/85 text-success' : enrollment.progress > 0 ? 'bg-ink-950/85 text-gold' : 'bg-ink-950/85 text-cream-dim'
          }`}
        >
          {status}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <LevelBadge level={course.level} />
          <Price amount={course.price} className="text-lead text-gold" />
        </div>
        <h3 className="mt-3 font-display text-lead leading-snug text-cream line-clamp-2 transition group-hover:text-gold-light">
          {course.title || 'Untitled Course'}
        </h3>
        {course.instructor && (
          <p className="mt-1 flex items-center gap-1.5 text-caption text-cream-dim">
            <Icon name="teacher" size={14} />
            {course.instructor}
          </p>
        )}
        <div className="mt-4">
          <ProgressBar value={progress} />
          <div className="mt-2 flex items-center justify-between text-caption text-cream-dim">
            <span>{progress}% complete</span>
            {course.category && <span className="line-clamp-1">{course.category}</span>}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-cream/10 pt-3">
          <span className="text-caption text-cream-faint">
            {enrollment.completed ? 'Completed' : enrollment.progress > 0 ? 'Keep going' : 'Not started'}
          </span>
          <span className="inline-flex items-center gap-1 text-body font-bold text-gold">
            {cta}
            <Icon name="next" size={16} />
          </span>
        </div>
      </div>
    </Link>
  )
}

function StatCard({ label, value, note, icon }: { label: string; value: string; note: string; icon: IconName }) {
  return (
    <div className="rounded-2xl border border-cream/10 bg-ink-850 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-caption font-medium text-cream-dim">{label}</p>
          <p className="mt-2 font-display text-headline text-cream">{value}</p>
          <p className="mt-2 text-caption text-cream-faint">{note}</p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
          <Icon name={icon} size={20} />
        </span>
      </div>
    </div>
  )
}

function ProgressItem({ label, count, percentage }: { label: string; count: string; percentage: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-body font-medium text-cream">{label}</span>
        <span className="text-caption text-cream-dim">{count}</span>
      </div>
      <div className="flex items-center gap-3">
        <ProgressBar value={percentage} className="flex-1" />
        <span className="w-10 text-right text-caption font-bold text-gold">{percentage}%</span>
      </div>
    </div>
  )
}

function LessonRow({ lesson }: { lesson: Lesson }) {
  return (
    <Link
      href="/courses"
      className="group flex items-center gap-4 rounded-xl border border-cream/10 bg-ink-850 p-4 transition hover:border-gold/40"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
        <Icon name="book" size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-body font-semibold text-cream line-clamp-1 transition group-hover:text-gold-light">{lesson.title}</span>
        <span className="mt-0.5 block text-caption text-cream-dim line-clamp-1">
          {lesson.content ? lesson.content.substring(0, 50) + '...' : 'Course lesson'}
        </span>
      </span>
      <span className="shrink-0 text-cream-faint transition group-hover:text-gold">
        <Icon name="next" size={18} />
      </span>
    </Link>
  )
}

function ActivityItem({ icon, title, description, time }: { icon: IconName; title: string; description: string; time: string }) {
  return (
    <div className="flex gap-4 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
        <Icon name={icon} size={18} />
      </span>
      <div className="min-w-0">
        <h4 className="text-body font-semibold text-cream line-clamp-1">{title}</h4>
        <p className="mt-0.5 text-caption text-cream-dim line-clamp-2">{description}</p>
        <p className="mt-1.5 text-meta text-cream-faint">{time}</p>
      </div>
    </div>
  )
}

function LibraryRow({ title, subtitle, icon, type, status }: { title: string; subtitle: string; icon: IconName; type: string; status: string }) {
  return (
    <tr className="border-b border-cream/5 last:border-0">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
            <Icon name={icon} size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-body font-semibold text-cream line-clamp-1">{title}</p>
            <p className="mt-0.5 text-caption text-cream-dim line-clamp-1">{subtitle}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4 text-body text-cream-dim">{type}</td>
      <td className="px-5 py-4">
        <span className="inline-flex items-center gap-2 text-caption text-cream-dim">
          <span className="h-2 w-2 rounded-full bg-gold" />
          {status}
        </span>
      </td>
      <td className="px-5 py-4">
        <Link href="/store" className="inline-flex items-center gap-1 text-caption font-semibold text-gold transition hover:text-gold-light">
          Explore
          <Icon name="next" size={14} />
        </Link>
      </td>
    </tr>
  )
}
