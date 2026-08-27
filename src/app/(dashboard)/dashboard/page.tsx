'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useBrand } from '@/hooks/useBrand'

/* =========================================================
   SVG ICONS
========================================================= */

type IconProps = {
  size?: number
  strokeWidth?: number
  className?: string
}

function Icon({
  children,
  size = 20,
  strokeWidth = 1.8,
  className = '',
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

function DashboardIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </Icon>
  )
}

function BookIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
      <path d="M4 5.5V21" />
      <path d="M8 7h8" />
      <path d="M8 11h7" />
    </Icon>
  )
}

function GraduationIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m3 9 9-5 9 5-9 5-9-5Z" />
      <path d="M7 11.2V16c2.7 2.2 7.3 2.2 10 0v-4.8" />
      <path d="M21 9v6" />
    </Icon>
  )
}

function ChartIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 19V5" />
      <path d="M4 19h17" />
      <path d="m7 15 3-4 3 2 5-7" />
      <path d="M15 6h3v3" />
    </Icon>
  )
}

function CartIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 1.9-1.5L20 8H6" />
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </Icon>
  )
}

function UserIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </Icon>
  )
}

function SettingsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.1h-2.6V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H4v-2.6h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.6v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v2.6h-.1a1.7 1.7 0 0 0-1.6 1Z" />
    </Icon>
  )
}

function BellIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
      <path d="M10 21h4" />
    </Icon>
  )
}

function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 5 5" />
    </Icon>
  )
}

function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </Icon>
  )
}

function ArrowRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </Icon>
  )
}

function ArrowUpIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 19V5" />
      <path d="m6 11 6-6 6 6" />
    </Icon>
  )
}

function LogOutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 3v18" />
    </Icon>
  )
}

function TargetIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" />
    </Icon>
  )
}

function PlayIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m9 6 9 6-9 6V6Z" />
    </Icon>
  )
}

function StarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    </Icon>
  )
}

function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5 12 4 4L19 6" />
    </Icon>
  )
}

function MoreIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="5" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="19" cy="12" r="1" fill="currentColor" />
    </Icon>
  )
}

function LockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </Icon>
  )
}

function SparkleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z" />
      <path d="m19 16 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" />
    </Icon>
  )
}


/* =========================================================
   DASHBOARD
========================================================= */

export default function DashboardPage() {
  const { brand } = useBrand()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

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

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-brand-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const fullName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    'User'

  const firstName = fullName.split(' ')[0]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="fixed inset-x-0 top-0 z-50 h-[72px] bg-slate-900/95 backdrop-blur-xl border-b border-slate-800">

        <div className="h-full flex">

          {/* Brand */}
          <div
            className={`h-full border-r border-slate-800 flex items-center transition-all duration-300 ${
              sidebarOpen ? 'w-[250px]' : 'w-[78px]'
            }`}
          >

            <div className="w-full px-5 flex items-center gap-3">

              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <MenuIcon size={19} />
              </button>

              {sidebarOpen && (
                <Link
                  href="/"
                  className="text-xl font-black tracking-wide bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent truncate"
                >
                  {brand?.display_name || 'Ifalode'}
                </Link>
              )}

            </div>

          </div>


          {/* Header right */}
          <div className="flex-1 flex items-center justify-between px-5 md:px-7">

            <div className="hidden md:flex items-center gap-2 text-sm">
              <span className="text-brand-primary font-medium">
                Dashboard
              </span>
              <span className="text-slate-700">/</span>
              <span className="text-slate-500">
                Overview
              </span>
            </div>


            <div className="flex items-center gap-3 ml-auto">

              {/* Search */}
              <div className="hidden lg:flex w-60 xl:w-72 h-10 rounded-lg bg-slate-950 border border-slate-800 items-center px-3">

                <SearchIcon
                  size={17}
                  className="text-slate-600 shrink-0"
                />

                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full bg-transparent outline-none border-none text-sm text-white placeholder:text-slate-600 ml-2"
                />

              </div>


              {/* Notification */}
              <button className="relative w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white transition">

                <BellIcon size={19} />

                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-primary" />

              </button>


              {/* User */}
              <div className="border-l border-slate-800 pl-3 flex items-center gap-3">

                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-white">
                    {fullName}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Student
                  </p>
                </div>

                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white font-bold">
                  {firstName.charAt(0).toUpperCase()}
                </div>

              </div>

            </div>

          </div>

        </div>

      </header>


      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`fixed top-[72px] bottom-0 left-0 z-40 bg-slate-900 border-r border-slate-800 transition-all duration-300 ${
          sidebarOpen ? 'w-[250px]' : 'w-[78px]'
        }`}
      >

        <div className="h-full flex flex-col">

          <nav className="flex-1 overflow-y-auto px-3 py-6">

            {sidebarOpen && (
              <p className="px-3 mb-3 text-[10px] uppercase tracking-[0.15em] font-bold text-slate-600">
                Main Menu
              </p>
            )}

            <SidebarLink
              href="/dashboard"
              label="Dashboard"
              icon={<DashboardIcon size={19} />}
              active
              collapsed={!sidebarOpen}
            />

            <SidebarLink
              href="/store"
              label="Store"
              icon={<CartIcon size={19} />}
              collapsed={!sidebarOpen}
            />

            <SidebarLink
              href="/courses"
              label="Courses"
              icon={<GraduationIcon size={19} />}
              collapsed={!sidebarOpen}
            />

            <SidebarLink
              href="/dashboard"
              label="My Library"
              icon={<BookIcon size={19} />}
              collapsed={!sidebarOpen}
            />

            <SidebarLink
              href="/dashboard"
              label="My Progress"
              icon={<ChartIcon size={19} />}
              collapsed={!sidebarOpen}
            />

            {sidebarOpen && (
              <p className="px-3 mt-8 mb-3 text-[10px] uppercase tracking-[0.15em] font-bold text-slate-600">
                Account
              </p>
            )}

            <SidebarLink
              href="/profile"
              label="Profile"
              icon={<UserIcon size={19} />}
              collapsed={!sidebarOpen}
            />

            <SidebarLink
              href="/settings"
              label="Settings"
              icon={<SettingsIcon size={19} />}
              collapsed={!sidebarOpen}
            />

          </nav>


          <div className="p-3 border-t border-slate-800">

            <button
              onClick={signOut}
              title={!sidebarOpen ? 'Sign Out' : undefined}
              className={`w-full flex items-center ${
                sidebarOpen
                  ? 'justify-start px-3'
                  : 'justify-center'
              } gap-3 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition`}
            >
              <LogOutIcon size={19} />

              {sidebarOpen && (
                <span className="text-sm font-medium">
                  Sign Out
                </span>
              )}

            </button>

          </div>

        </div>

      </aside>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main
        className={`pt-[72px] transition-all duration-300 ${
          sidebarOpen ? 'ml-[250px]' : 'ml-[78px]'
        }`}
      >

        <div className="max-w-[1600px] mx-auto px-5 md:px-7 lg:px-8 py-7">


          {/* =================================================
              WELCOME
          ================================================= */}

          <div className="grid xl:grid-cols-[1fr_290px] gap-5 mb-8">

            <section className="relative min-h-[250px] overflow-hidden rounded-2xl bg-gradient-to-r from-brand-primary to-brand-secondary">

              {/* SVG decorative background */}
              <svg
                className="absolute right-0 top-0 h-full w-[45%] opacity-10"
                viewBox="0 0 500 300"
                preserveAspectRatio="none"
              >
                <circle cx="420" cy="50" r="170" fill="white" />
                <circle cx="330" cy="280" r="120" fill="white" />
              </svg>

              <div className="relative z-10 p-7 md:p-9">

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-white text-[11px] font-semibold mb-5">

                  <SparkleIcon size={13} />

                  Your Learning Dashboard

                </div>

                <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  Hello {firstName}, Welcome Back!
                </h1>

                <p className="max-w-xl text-sm md:text-[15px] leading-6 text-white/70">
                  Continue your learning journey, explore new courses,
                  and discover more knowledge from your personal dashboard.
                </p>

                <div className="flex flex-wrap gap-3 mt-7">

                  <Link
                    href="/courses"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 transition"
                  >
                    Continue Learning
                    <ArrowRightIcon size={15} />
                  </Link>

                  <Link
                    href="/store"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm font-semibold hover:bg-white/20 transition"
                  >
                    Visit Store
                    <CartIcon size={15} />
                  </Link>

                </div>

              </div>

            </section>


            {/* Quick action */}
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-center">

              <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-4">
                <SparkleIcon size={23} />
              </div>

              <h3 className="font-bold text-lg mb-2">
                Discover Something New
              </h3>

              <p className="text-sm leading-5 text-slate-500 mb-5">
                Explore new courses and ebooks designed to expand your knowledge.
              </p>

              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:opacity-90 transition"
              >
                Explore Courses
                <ArrowRightIcon size={15} />
              </Link>

            </section>

          </div>


          {/* =================================================
              COURSES
          ================================================= */}

          <SectionHeader
            title="Your Courses"
            action="View All"
            href="/courses"
          />

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-9">

            <CourseCard
              title="Getting Started"
              category="Learning"
              status="Active"
              progress={65}
              lessons="12 Lessons"
              icon={<BookIcon size={25} />}
            />

            <CourseCard
              title="Personal Development"
              category="Development"
              status="Active"
              progress={42}
              lessons="18 Lessons"
              icon={<TargetIcon size={25} />}
            />

            <CourseCard
              title="Business Masterclass"
              category="Business"
              status="Finished"
              progress={100}
              lessons="Completed"
              icon={<ChartIcon size={25} />}
            />

            <CourseCard
              title="Digital Skills"
              category="Technology"
              status="Paused"
              progress={28}
              lessons="24 Lessons"
              icon={<PlayIcon size={25} />}
            />

          </div>


          {/* =================================================
              STATISTICS
          ================================================= */}

          <div className="grid md:grid-cols-3 gap-5 mb-9">

            <StatCard
              label="My Ebooks"
              value="0"
              description="Ebooks purchased"
              icon={<BookIcon size={21} />}
            />

            <StatCard
              label="My Courses"
              value="0"
              description="Courses enrolled"
              icon={<GraduationIcon size={21} />}
            />

            <StatCard
              label="Learning Progress"
              value="0%"
              description="Average completion"
              icon={<ChartIcon size={21} />}
            />

          </div>


          {/* =================================================
              PERFORMANCE
          ================================================= */}

          <SectionHeader
            title="Performance & Statistics"
            action="This Month"
          />

          <div className="grid xl:grid-cols-[1.15fr_1fr] gap-5 mb-9">


            {/* Completion */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">

              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">

                <h3 className="font-bold text-sm">
                  Course Completion
                </h3>

                <button className="text-xs text-brand-primary font-medium hover:underline">
                  View Details
                </button>

              </div>

              <div className="p-5 space-y-7">

                <ProgressRow
                  label="In Progress"
                  count="0 Courses"
                  percentage={0}
                />

                <ProgressRow
                  label="Completed"
                  count="0 Courses"
                  percentage={0}
                />

                <ProgressRow
                  label="Not Started"
                  count="0 Courses"
                  percentage={0}
                />

                <ProgressRow
                  label="Paused"
                  count="0 Courses"
                  percentage={0}
                />

              </div>

            </div>


            {/* Donut */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">

              <div className="px-5 py-4 border-b border-slate-800">
                <h3 className="font-bold text-sm">
                  Learning Overview
                </h3>
              </div>

              <div className="p-6">

                <div className="h-[210px] flex items-center justify-center">

                  <div className="relative w-40 h-40">

                    <svg
                      className="w-full h-full -rotate-90"
                      viewBox="0 0 120 120"
                    >

                      <circle
                        cx="60"
                        cy="60"
                        r="48"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="13"
                        className="text-slate-800"
                      />

                      <circle
                        cx="60"
                        cy="60"
                        r="48"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="13"
                        strokeDasharray="301.6"
                        strokeDashoffset="301.6"
                        strokeLinecap="round"
                        className="text-brand-primary"
                      />

                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center">

                      <span className="text-3xl font-bold">
                        0%
                      </span>

                      <span className="text-[11px] text-slate-500">
                        Completed
                      </span>

                    </div>

                  </div>

                </div>

                <div className="flex items-center justify-center gap-6">

                  <Legend
                    label="Completed"
                    active
                  />

                  <Legend
                    label="Remaining"
                  />

                </div>

              </div>

            </div>

          </div>


          {/* =================================================
              LESSONS + ACTIVITY
          ================================================= */}

          <div className="grid xl:grid-cols-[1.1fr_1fr] gap-7 mb-9">


            {/* Lessons */}
            <section>

              <SectionHeader
                title="Lessons"
                action="View All"
                href="/courses"
              />

              <div className="space-y-3">

                <LessonCard
                  title="Introduction to Learning"
                  subtitle="Start your learning journey"
                  icon={<BookIcon size={21} />}
                  type="Learning"
                />

                <LessonCard
                  title="Building Better Habits"
                  subtitle="Personal development"
                  icon={<SparkleIcon size={21} />}
                  type="Development"
                />

                <LessonCard
                  title="Understanding Your Goals"
                  subtitle="Personal development"
                  icon={<TargetIcon size={21} />}
                  type="Goals"
                />

              </div>

            </section>


            {/* Activity */}
            <section>

              <SectionHeader
                title="Recent Activity"
                action="View All"
              />

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">

                <ActivityItem
                  icon={<BookIcon size={18} />}
                  title="New ebook available"
                  description="Check out the latest addition to the store."
                  time="Today"
                />

                <ActivityItem
                  icon={<GraduationIcon size={18} />}
                  title="Course enrollment"
                  description="Your learning journey is ready to continue."
                  time="Yesterday"
                />

                <ActivityItem
                  icon={<CheckIcon size={18} />}
                  title="Profile updated"
                  description="Your account information was updated."
                  time="3 days ago"
                />

                <ActivityItem
                  icon={<StarIcon size={18} />}
                  title="Welcome to Ifalode"
                  description="Explore everything available to you."
                  time="1 week ago"
                />

              </div>

            </section>

          </div>


          {/* =================================================
              LIBRARY
          ================================================= */}

          <SectionHeader
            title="Your Library"
            action="Browse Store"
            href="/store"
          />

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-9">

            <div className="overflow-x-auto">

              <table className="w-full min-w-[700px]">

                <thead>

                  <tr className="border-b border-slate-800">

                    <th className="text-left px-5 py-4 text-[10px] uppercase tracking-wider text-slate-600">
                      Content
                    </th>

                    <th className="text-left px-5 py-4 text-[10px] uppercase tracking-wider text-slate-600">
                      Type
                    </th>

                    <th className="text-left px-5 py-4 text-[10px] uppercase tracking-wider text-slate-600">
                      Status
                    </th>

                    <th className="text-right px-5 py-4 text-[10px] uppercase tracking-wider text-slate-600">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  <LibraryRow
                    icon={<BookIcon size={18} />}
                    title="No ebooks purchased yet"
                    subtitle="Visit the store to build your library"
                    type="Ebook"
                  />

                  <LibraryRow
                    icon={<GraduationIcon size={18} />}
                    title="No courses enrolled yet"
                    subtitle="Explore courses to get started"
                    type="Course"
                  />

                </tbody>

              </table>

            </div>

          </div>


          {/* =================================================
              CTA
          ================================================= */}

          <div className="grid md:grid-cols-2 gap-5 mb-9">

            <Link
              href="/store"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 to-red-500 p-6"
            >

              <div className="absolute right-[-30px] top-[-50px] w-44 h-44 rounded-full bg-white/10" />

              <div className="relative flex items-center gap-5">

                <div className="w-14 h-14 shrink-0 rounded-full border border-white/25 flex items-center justify-center text-white">
                  <CartIcon size={24} />
                </div>

                <div className="flex-1">

                  <h3 className="font-bold text-lg text-white">
                    Browse the Store
                  </h3>

                  <p className="text-sm text-white/65 mt-1">
                    Discover ebooks and learning resources.
                  </p>

                </div>

                <ArrowRightIcon
                  size={20}
                  className="text-white/60 group-hover:translate-x-1 transition-transform"
                />

              </div>

            </Link>


            <Link
              href="/courses"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-primary to-brand-secondary p-6"
            >

              <div className="absolute right-[-30px] top-[-50px] w-44 h-44 rounded-full bg-white/10" />

              <div className="relative flex items-center gap-5">

                <div className="w-14 h-14 shrink-0 rounded-full border border-white/25 flex items-center justify-center text-white">
                  <GraduationIcon size={24} />
                </div>

                <div className="flex-1">

                  <h3 className="font-bold text-lg text-white">
                    Explore Courses
                  </h3>

                  <p className="text-sm text-white/65 mt-1">
                    Continue your education and grow your skills.
                  </p>

                </div>

                <ArrowRightIcon
                  size={20}
                  className="text-white/60 group-hover:translate-x-1 transition-transform"
                />

              </div>

            </Link>

          </div>


          {/* =================================================
              FOOTER
          ================================================= */}

          <footer className="border-t border-slate-800 pt-6 pb-3 flex flex-col md:flex-row items-center justify-between gap-4">

            <p className="text-xs text-slate-600">
              © {new Date().getFullYear()} {brand?.display_name || 'Ifalode'}. All rights reserved.
            </p>

            <div className="flex items-center gap-5 text-xs text-slate-600">

              <Link
                href="/store"
                className="hover:text-slate-400 transition"
              >
                Store
              </Link>

              <Link
                href="/courses"
                className="hover:text-slate-400 transition"
              >
                Courses
              </Link>

              <Link
                href="/profile"
                className="hover:text-slate-400 transition"
              >
                Profile
              </Link>

            </div>

          </footer>

        </div>

      </main>

    </div>
  )
}


/* =========================================================
   COMPONENTS
========================================================= */

function SidebarLink({
  href,
  icon,
  label,
  active = false,
  collapsed = false,
}: {
  href: string
  icon: ReactNode
  label: string
  active?: boolean
  collapsed?: boolean
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`group relative flex items-center ${
        collapsed ? 'justify-center' : 'gap-3 px-3'
      } h-11 rounded-lg mb-1 transition ${
        active
          ? 'bg-brand-primary/10 text-brand-primary'
          : 'text-slate-500 hover:bg-slate-800/70 hover:text-white'
      }`}
    >

      {active && (
        <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-brand-primary" />
      )}

      <span className="shrink-0">
        {icon}
      </span>

      {!collapsed && (
        <span className="text-sm font-medium">
          {label}
        </span>
      )}

      {!collapsed && active && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-primary" />
      )}

    </Link>
  )
}


function SectionHeader({
  title,
  action,
  href,
}: {
  title: string
  action: string
  href?: string
}) {
  return (
    <div className="flex items-center justify-between mb-4">

      <h2 className="text-lg font-bold text-white">
        {title}
      </h2>

      {href ? (
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:gap-2 transition-all"
        >
          {action}
          <ArrowRightIcon size={13} />
        </Link>
      ) : (
        <button className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400">
          {action}
        </button>
      )}

    </div>
  )
}


function CourseCard({
  title,
  category,
  status,
  progress,
  lessons,
  icon,
}: {
  title: string
  category: string
  status: string
  progress: number
  lessons: string
  icon: ReactNode
}) {
  return (
    <div className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition">

      {/* Top artwork */}
      <div className="relative h-28 bg-gradient-to-br from-brand-primary/15 via-slate-900 to-slate-950 overflow-hidden">

        <svg
          className="absolute right-0 top-0 w-32 h-32 text-brand-primary/10"
          viewBox="0 0 100 100"
        >
          <circle cx="75" cy="25" r="35" fill="currentColor" />
          <circle cx="100" cy="75" r="28" fill="currentColor" />
        </svg>

        <div className="absolute left-5 bottom-[-20px] w-14 h-14 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-brand-primary shadow-xl">
          {icon}
        </div>

        <div className="absolute top-4 left-4">

          <span
            className={`px-2.5 py-1 rounded-md text-[9px] uppercase tracking-wide font-bold ${
              status === 'Finished'
                ? 'bg-green-500/10 text-green-400'
                : status === 'Paused'
                ? 'bg-orange-500/10 text-orange-400'
                : 'bg-brand-primary/10 text-brand-primary'
            }`}
          >
            {status}
          </span>

        </div>

        <button className="absolute top-4 right-4 text-slate-600 hover:text-white">
          <MoreIcon size={17} />
        </button>

      </div>


      <div className="p-5 pt-8">

        <p className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold mb-1">
          {category}
        </p>

        <h3 className="font-bold text-white mb-1 group-hover:text-brand-primary transition">
          {title}
        </h3>

        <p className="text-xs text-slate-500 mb-5">
          {lessons}
        </p>


        <div className="flex items-center gap-3">

          <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">

            <div
              className="h-full rounded-full bg-brand-primary transition-all"
              style={{ width: `${progress}%` }}
            />

          </div>

          <span className="text-xs font-bold text-brand-primary">
            {progress}%
          </span>

        </div>

      </div>

    </div>
  )
}


function StatCard({
  label,
  value,
  description,
  icon,
}: {
  label: string
  value: string
  description: string
  icon: ReactNode
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-xs text-slate-500 mb-2">
            {label}
          </p>

          <h3 className="text-3xl font-bold text-white">
            {value}
          </h3>

          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-600">
            <ArrowUpIcon size={12} />
            {description}
          </div>

        </div>

        <div className="w-11 h-11 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
          {icon}
        </div>

      </div>

    </div>
  )
}


function ProgressRow({
  label,
  count,
  percentage,
}: {
  label: string
  count: string
  percentage: number
}) {
  return (
    <div>

      <div className="flex items-center justify-between mb-2">

        <span className="text-sm text-slate-300">
          {label}
        </span>

        <span className="text-xs text-slate-600">
          {count}
        </span>

      </div>

      <div className="flex items-center gap-3">

        <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">

          <div
            className="h-full rounded-full bg-brand-primary transition-all"
            style={{ width: `${percentage}%` }}
          />

        </div>

        <span className="w-8 text-right text-xs text-slate-500">
          {percentage}%
        </span>

      </div>

    </div>
  )
}


function Legend({
  label,
  active = false,
}: {
  label: string
  active?: boolean
}) {
  return (
    <span className="flex items-center gap-2 text-xs text-slate-500">

      <span
        className={`w-2.5 h-2.5 rounded-full ${
          active ? 'bg-brand-primary' : 'bg-slate-700'
        }`}
      />

      {label}

    </span>
  )
}


function LessonCard({
  title,
  subtitle,
  icon,
  type,
}: {
  title: string
  subtitle: string
  icon: ReactNode
  type: string
}) {
  return (
    <Link
      href="/courses"
      className="group flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition"
    >

      <div className="w-11 h-11 shrink-0 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
        {icon}
      </div>

      <div className="flex-1 min-w-0">

        <div className="flex items-center gap-2">

          <h3 className="text-sm font-semibold text-white group-hover:text-brand-primary transition truncate">
            {title}
          </h3>

        </div>

        <p className="text-xs text-slate-600 mt-1 truncate">
          {subtitle}
        </p>

      </div>

      <div className="hidden sm:block">

        <span className="px-2 py-1 rounded-md bg-slate-800 text-[9px] uppercase tracking-wide text-slate-500">
          {type}
        </span>

      </div>

      <ArrowRightIcon
        size={17}
        className="text-slate-700 group-hover:text-brand-primary group-hover:translate-x-1 transition-all"
      />

    </Link>
  )
}


function ActivityItem({
  icon,
  title,
  description,
  time,
}: {
  icon: ReactNode
  title: string
  description: string
  time: string
}) {
  return (
    <div className="flex gap-3 p-4 border-b border-slate-800 last:border-0">

      <div className="w-10 h-10 shrink-0 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center">
        {icon}
      </div>

      <div className="flex-1 min-w-0">

        <h4 className="text-sm font-semibold text-white">
          {title}
        </h4>

        <p className="text-xs text-slate-600 mt-1 leading-5">
          {description}
        </p>

        <p className="text-[10px] text-slate-700 mt-1.5">
          {time}
        </p>

      </div>

    </div>
  )
}


function LibraryRow({
  icon,
  title,
  subtitle,
  type,
}: {
  icon: ReactNode
  title: string
  subtitle: string
  type: string
}) {
  return (
    <tr className="border-b border-slate-800 last:border-0">

      <td className="px-5 py-4">

        <div className="flex items-center gap-3">

          <div className="w-10 h-10 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center">
            {icon}
          </div>

          <div>

            <p className="text-sm font-semibold text-white">
              {title}
            </p>

            <p className="text-xs text-slate-600 mt-1">
              {subtitle}
            </p>

          </div>

        </div>

      </td>


      <td className="px-5 py-4">

        <span className="text-xs text-slate-500">
          {type}
        </span>

      </td>


      <td className="px-5 py-4">

        <span className="inline-flex items-center gap-2 text-xs text-slate-500">

          <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />

          Available

        </span>

      </td>


      <td className="px-5 py-4 text-right">

        <Link
          href="/store"
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:gap-2 transition-all"
        >
          Explore
          <ArrowRightIcon size={13} />
        </Link>

      </td>

    </tr>
  )
}
