import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { createServerClient } from '@/lib/supabase/server'

const inter = Inter({ subsets: ['latin'] })

export async function generateMetadata(): Promise<Metadata> {
  const supabase = createServerClient()
  const { data: brand } = await supabase
    .from('brand_settings')
    .select('meta_title, meta_description, brand_name')
    .limit(1)
    .single()

  // Use type assertion to handle the unknown type
  const brandData = brand as any

  return {
    title: brandData?.meta_title || brandData?.brand_name || 'IfaLode',
    description: brandData?.meta_description || 'Ifá Wisdom, Courses & Sacred Store',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
