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

  return {
    title: brand?.meta_title || brand?.brand_name || 'IfaLode',
    description: brand?.meta_description || 'Ifá Wisdom, Courses & Sacred Store',
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
