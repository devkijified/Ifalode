'use client'

interface AttendanceRecord {
  user_id: string
  email: string
  full_name: string
  total_seconds: number
  sessions: number
  first_join: string
  last_leave: string | null
  is_active: boolean
  status: string
}

interface Props {
  attendance: AttendanceRecord[]
}

export function AttendanceTable({ attendance }: Props) {
  const formatDuration = (seconds: number) => {
    if (!seconds) return '—'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return 'bg-green-500/10 text-green-400 border-green-500/30'
      case 'Partial':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30'
    }
  }

  if (attendance.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center">
        <div className="text-4xl mb-4">👥</div>
        <h3 className="text-lg font-bold mb-2">No attendance yet</h3>
        <p className="text-slate-500">Students will appear here when they join.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-800 text-left">
              <th className="px-5 py-4 text-xs uppercase tracking-wide text-slate-500">Student</th>
              <th className="px-5 py-4 text-xs uppercase tracking-wide text-slate-500">Join Time</th>
              <th className="px-5 py-4 text-xs uppercase tracking-wide text-slate-500">Duration</th>
              <th className="px-5 py-4 text-xs uppercase tracking-wide text-slate-500">Sessions</th>
              <th className="px-5 py-4 text-xs uppercase tracking-wide text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((a) => (
              <tr key={a.user_id} className="border-b border-slate-800 last:border-0">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center font-bold text-white text-sm">
                      {(a.full_name || a.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {a.full_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-500">{a.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-slate-400">
                  {new Date(a.first_join).toLocaleString()}
                </td>
                <td className="px-5 py-4 text-sm text-slate-300 font-medium">
                  {formatDuration(a.total_seconds)}
                </td>
                <td className="px-5 py-4 text-sm text-slate-400">
                  {a.sessions}
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${statusColor(a.status)}`}>
                    {a.is_active && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                    {a.is_active ? 'Active' : a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
