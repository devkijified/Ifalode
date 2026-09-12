import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { LiveClassRoom } from '@/components/live-class/LiveClassRoom'
import type { LiveClass } from '@/types/live-class'

interface Props {
  params: { id: string }
}

export default async function TeacherRoomPage({ params }: Props) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('live_classes')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !data) notFound()

  const liveClass = data as LiveClass

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = (profile as any)?.role === 'admin'
  const isTeacher = liveClass.instructor_id === user.id

  if (!isAdmin && !isTeacher) redirect('/dashboard')

  return (
    <LiveClassRoom
      liveClassId={liveClass.id}
      liveClassTitle={liveClass.title}
      isTeacher={true}
      recordingEnabled={!!liveClass.recording_enabled}
    />
  )
}
