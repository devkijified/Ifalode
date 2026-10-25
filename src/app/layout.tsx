import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'
import { createServerClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/shell/AppShell'
import { RefCapture } from '@/components/RefCapture'
import { SWRegister } from '@/components/SWRegister'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0B0908',
}

export async function generateMetadata(): Promise<Metadata> {
  const supabase = createServerClient()
  const { data: brand } = await supabase
    .from('brand_settings')
    .select('meta_title, meta_description, brand_name')
    .limit(1)
    .single()

  const brandData = brand as any

  return {
    title: brandData?.meta_title || brandData?.brand_name || 'IfaLode',
    description:
      brandData?.meta_description || 'Ifá Wisdom, Courses & Sacred Store',
    manifest: '/manifest.webmanifest',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: 'IfaLode',
    },
    icons: {
      icon: '/icons/icon-192.png',
      apple: '/icons/icon-192.png',
    },
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <RefCapture />
          <SWRegister />
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  )
}
