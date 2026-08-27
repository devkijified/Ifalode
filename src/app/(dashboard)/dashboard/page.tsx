'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  GraduationCap,
  Store as StoreIcon,
  Shield,
  PhoneCall,
  User,
  ArrowRight,
  ArrowLeft,
  Activity,
  Zap,
  Clock,
  Lock,
  Search,
  CreditCard,
  ShieldAlert,
  HelpCircle,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Server,
  FileText
} from 'lucide-react'

export default function Dashboard({ brand }: { brand?: { display_name?: string } }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? 'w-20' : 'w-64'
        } bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col justify-between hidden md:flex sticky top-0 h-screen`}
      >
        <div className="p-5 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <span className="font-extrabold text-xl tracking-wider text-white">
                {brand?.display_name || 'TRUSTLINE'}
              </span>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
              aria-label="Toggle Sidebar"
            >
              {collapsed ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            <SidebarLink href="/dashboard" icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" active collapsed={collapsed} />
            <SidebarLink href="/courses" icon={<GraduationCap className="w-5 h-5" />} label="Courses" collapsed={collapsed} />
            <SidebarLink href="/store" icon={<StoreIcon className="w-5 h-5" />} label="Store" collapsed={collapsed} />
            <SidebarLink href="/security" icon={<Shield className="w-5 h-5" />} label="Security" collapsed={collapsed} />
            <SidebarLink href="/contact" icon={<PhoneCall className="w-5 h-5" />} label="Contact" collapsed={collapsed} />
            <SidebarLink href="/profile" icon={<User className="w-5 h-5" />} label="Profile" collapsed={collapsed} />
          </nav>
        </div>

        <div className="p-5 border-t border-slate-800">
          <Link
            href="/contact"
            className={`flex items-center ${
              collapsed ? 'justify-center' : 'gap-3 px-3'
            } py-3 rounded-lg bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 transition`}
            title={collapsed ? 'Get Help Now' : undefined}
          >
            <HelpCircle className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="text-sm font-bold">Get Help Now</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-900/50 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <span className="font-bold text-lg md:hidden text-white">{brand?.display_name || 'TRUSTLINE'}</span>
            <h1 className="text-xl font-bold text-white">Dashboard Overview</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/contact" className="btn-nav text-xs font-semibold px-4 py-2 rounded-lg bg-brand-primary text-white hover:opacity-90 transition">
              Get Help Now
            </Link>
          </div>
        </nav>

        <header className="hero px-8 py-10 bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
            Secure Your Digital Life <br />
            <span style={{ color: 'var(--accent)' }}>Regain Full Control.</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mb-6 text-sm md:text-base">
            Expert intervention for hacking, debt resolution, and data recovery. Trustline Tech Services provides the professional support you need to protect your privacy and assets.
          </p>
          <a href="#expertise" className="btn-primary inline-block px-5 py-2.5 rounded-xl bg-brand-primary text-white font-semibold text-sm hover:opacity-90 transition">
            View Expertise
          </a>
        </header>

        <div className="p-6 md:p-8 flex-1 flex flex-col gap-8 max-w-7xl w-full mx-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Active Protections" value="12" change="+2 this month" icon={<Shield className="w-5 h-5 text-brand-primary" />} positive />
            <StatCard label="Resolved Issues" value="48" change="+12% success rate" icon={<Zap className="w-5 h-5 text-brand-primary" />} positive />
            <StatCard label="Pending Cases" value="3" change="Requires attention" icon={<Clock className="w-5 h-5 text-amber-400" />} />
            <StatCard label="System Security" value="98%" change="Optimal status" icon={<Lock className="w-5 h-5 text-brand-primary" />} positive />
          </div>

          {/* Courses & Modules Section */}
          <section id="expertise">
            <SectionHeader title="Your Services & Expertise" action="View All" href="/courses" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CourseCard
                title="Digital Forensics & Recovery"
                status="Active"
                progress="75%"
                remaining="2 modules left"
                icon={<Search className="w-6 h-6 text-brand-primary" />}
                color="primary"
              />
              <CourseCard
                title="Debt Resolution & Shield"
                status="Paused"
                progress="40%"
                remaining="5 steps remaining"
                icon={<CreditCard className="w-6 h-6 text-orange-400" />}
                color="orange"
              />
              <CourseCard
                title="Cybersecurity Fundamentals"
                status="Finished"
                progress="100%"
                remaining="Completed successfully"
                icon={<ShieldCheckIcon className="w-6 h-6 text-green-400" />}
                color="green"
              />
            </div>
          </section>

          {/* Lesson & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <SectionHeader title="Recommended Interventions" action="Explore Store" href="/store" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <LessonCard title="Anti-Malware Audit" subtitle="Comprehensive deep scan" icon={<ShieldAlert className="w-5 h-5" />} color="primary" />
                <LessonCard title="Identity Theft Recovery" subtitle="Restore compromised data" icon={<User className="w-5 h-5" />} color="purple" />
                <LessonCard title="Secure Comm Setup" subtitle="Encrypted channels configuration" icon={<Lock className="w-5 h-5" />} color="green" />
                <LessonCard title="Emergency Lockout Help" subtitle="Immediate expert assistance" icon={<ShieldAlert className="w-5 h-5" />} color="red" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Live Security Feed</h3>
                <p className="text-xs text-slate-500 mb-4">Real-time status updates on your defense perimeter.</p>
                <div className="flex flex-col gap-3">
                  <ProgressItem label="Firewall Integrity" users="99.9%" percentage={99} />
                  <ProgressItem label="Data Encryption" users="AES-256" percentage={100} />
                  <ProgressItem label="Access Logs" users="Monitored" percentage={85} />
                </div>
              </div>
              <div className="mt-6">
                <ActivityItem
                  icon={<Shield className="w-5 h-5 text-brand-primary" />}
                  title="Perimeter Secured"
                  description="All nodes successfully verified against threats."
                  time="10 mins ago"
                />
              </div>
            </div>
          </div>

          {/* Library / Table Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white">Active Asset Protections</h3>
              <Link href="/store" className="text-xs text-brand-primary hover:underline">View Store →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-500">
                    <th className="px-5 py-3 font-semibold">Asset Name</th>
                    <th className="px-5 py-3 font-semibold">Type</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <LibraryRow title="Primary Cloud Vault" subtitle="Encrypted storage instance" icon={<Cloud className="w-4 h-4 text-brand-primary" />} type="Storage" status="Protected" />
                  <LibraryRow title="Financial Gateway Shield" subtitle="Transaction surveillance" icon={<CreditCard className="w-4 h-4 text-brand-primary" />} type="Finance" status="Active" />
                </tbody>
              </table>
            </div>
          </div>

          {/* Explore Courses Callout */}
          <Link
            href="/courses"
            className="group rounded-2xl p-6 bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-95 transition"
          >
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full border border-white/30 flex items-center justify-center text-white">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">
                  Explore Courses
                </h3>
                <p className="text-sm text-white/70 mt-1">
                  Continue your education and grow your skills
                </p>
              </div>
            </div>
          </Link>

          <footer className="border-t border-slate-800 pt-6 pb-4 flex flex-col md:flex-row justify-between gap-3 text-xs text-slate-600">
            <p>
              © {new Date().getFullYear()} {brand?.display_name || 'Ifalode'}. All rights reserved.
            </p>
            <div className="flex gap-5">
              <Link href="/store" className="hover:text-slate-400">
                Store
              </Link>
              <Link href="/courses" className="hover:text-slate-400">
                Courses
              </Link>
              <Link href="/profile" className="hover:text-slate-400">
                Profile
              </Link>
            </div>
          </footer>
        </div>
      </main>
    </div>
  )
}

function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function SidebarLink({
  href,
  icon,
  label,
  active = false,
  collapsed = false,
}: {
  href: string
  icon: React.ReactNode
  label: string
  active?: boolean
  collapsed?: boolean
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`flex items-center ${
        collapsed ? 'justify-center' : 'gap-3 px-3'
      } py-3 rounded-lg mb-1 transition ${
        active
          ? 'bg-brand-primary/10 text-brand-primary'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <span className="shrink-0 flex items-center justify-center w-6">
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
          className="text-xs font-semibold text-brand-primary hover:underline"
        >
          {action}
        </Link>
      ) : (
        <button className="text-xs px-3 py-1.5 rounded-lg bg-brand-primary/10 text-brand-primary">
          {action}
        </button>
      )}
    </div>
  )
}

function CourseCard({
  title,
  status,
  progress,
  remaining,
  icon,
  color,
}: {
  title: string
  status: string
  progress: string
  remaining: string
  icon: React.ReactNode
  color: 'primary' | 'purple' | 'green' | 'orange'
}) {
  const colors = {
    primary: 'from-brand-primary/20',
    purple: 'from-purple-500/20',
    green: 'from-green-500/20',
    orange: 'from-orange-500/20',
  }

  const textColors = {
    primary: 'text-brand-primary',
    purple: 'text-purple-400',
    green: 'text-green-400',
    orange: 'text-orange-400',
  }

  return (
    <div
      className={`relative overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition group`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colors[color]} to-transparent opacity-50`}
      />
      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <span
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                status === 'Finished'
                  ? 'bg-green-500/10 text-green-400'
                  : status === 'Paused'
                  ? 'bg-orange-500/10 text-orange-400'
                  : 'bg-brand-primary/10 text-brand-primary'
              }`}
            >
              {status}
            </span>
            <span className="px-2 py-1 rounded-md bg-slate-800 text-slate-400 text-xs flex items-center justify-center">
              <Lock className="w-3 h-3" />
            </span>
          </div>
          <button className="text-slate-600 hover:text-white">
            •••
          </button>
        </div>
        <div className="p-3 bg-slate-800/50 w-fit rounded-xl mb-4 border border-slate-700/50">
          {icon}
        </div>
        <h3 className="font-bold text-white mb-1">
          {title}
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          {remaining}
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-primary rounded-full"
              style={{ width: progress }}
            />
          </div>
          <span className={`text-xs font-bold ${textColors[color]}`}>
            {progress}
          </span>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  change,
  icon,
  positive,
}: {
  label: string
  value: string
  change: string
  icon: React.ReactNode
  positive?: boolean
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-2">
            {label}
          </p>
          <h3 className="text-3xl font-bold text-white">
            {value}
          </h3>
          <p
            className={`text-xs mt-2 ${
              positive ? 'text-slate-500' : 'text-red-400'
            }`}
          >
            {change}
          </p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-brand-primary/10 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  )
}

function ProgressItem({
  label,
  users,
  percentage,
}: {
  label: string
  users: string
  percentage: number
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-brand-primary">
          {label}
        </span>
        <span className="text-xs text-slate-500">
          {users}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-primary rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-slate-400 w-8 text-right">
          {percentage}%
        </span>
      </div>
    </div>
  )
}

function LessonCard({
  title,
  subtitle,
  icon,
  color,
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  color: 'primary' | 'orange' | 'red' | 'purple' | 'green' | 'blue'
}) {
  const bg = {
    primary: 'bg-brand-primary/10 text-brand-primary',
    orange: 'bg-orange-500/10 text-orange-400',
    red: 'bg-red-500/10 text-red-400',
    purple: 'bg-purple-500/10 text-purple-400',
    green: 'bg-green-500/10 text-green-400',
    blue: 'bg-blue-500/10 text-blue-400',
  }

  return (
    <Link
      href="/courses"
      className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition group"
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg[color]}`}
        >
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white group-hover:text-brand-primary transition">
            {title}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {subtitle}
          </p>
        </div>
      </div>
      <span className="text-slate-600 group-hover:text-brand-primary transition">
        <ArrowRight className="w-5 h-5" />
      </span>
    </Link>
  )
}

function ActivityItem({
  icon,
  title,
  description,
  time,
}: {
  icon: React.ReactNode
  title: string
  description: string
  time: string
}) {
  return (
    <div className="p-4 flex gap-4">
      <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <h4 className="text-sm font-semibold text-white">
          {title}
        </h4>
        <p className="text-xs text-slate-500 mt-1">
          {description}
        </p>
        <p className="text-[10px] text-slate-600 mt-2">
          {time}
        </p>
      </div>
    </div>
  )
}

function LibraryRow({
  title,
  subtitle,
  icon,
  type,
  status,
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  type: string
  status: string
}) {
  return (
    <tr className="border-b border-slate-800 last:border-0">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {title}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {subtitle}
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4 text-sm text-slate-400">
        {type}
      </td>
      <td className="px-5 py-4">
        <span className="inline-flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-brand-primary" />
          {status}
        </span>
      </td>
      <td className="px-5 py-4">
        <Link
          href="/store"
          className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1"
        >
          Explore <ArrowRight className="w-3 h-3" />
        </Link>
      </td>
    </tr>
  )
}
