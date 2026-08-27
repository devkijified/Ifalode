'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BrandEditor } from '@/components/admin/BrandEditor'

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        router.push('/')
        return
      }

      // Check if user is admin - use type assertion to handle the type
      if (profile && (profile as any).role !== 'admin') {
        router.push('/')
        return
      }

      setUser(user)
      setLoading(false)
    }

    getUser()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 gap-8">
          <BrandEditor />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-4">Store Management</h3>
              <div className="space-y-2">
                <a href="/admin/store" className="block text-brand-primary hover:underline">
                  Manage Products
                </a>
                <a href="/admin/store/new" className="block text-brand-primary hover:underline">
                  Add New Product
                </a>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-4">LMS Management</h3>
              <div className="space-y-2">
                <a href="/admin/lms" className="block text-brand-primary hover:underline">
                  Manage Courses
                </a>
                <a href="/admin/lms/new" className="block text-brand-primary hover:underline">
                  Create New Course
                </a>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-4">Content Management</h3>
              <div className="space-y-2">
                <a href="/admin/cms" className="block text-brand-primary hover:underline">
                  Edit Content
                </a>
                <a href="/admin/cms/pages" className="block text-brand-primary hover:underline">
                  Manage Pages
                </a>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-4">Users & Enrollments</h3>
              <div className="space-y-2">
                <a href="/admin/users" className="block text-brand-primary hover:underline">
                  Manage Users
                </a>
                <a href="/admin/enrollments" className="block text-brand-primary hover:underline">
                  View Enrollments
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
