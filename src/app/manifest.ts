import type { MetadataRoute } from 'next'
import { createServerClient } from '@/lib/supabase/server'

// The installed app carries the tenant's own name: the manifest is
// generated from brand_settings, so a Babalawo or Iyalorisa running
// their own house sees their organization name on the home screen,
// not IfaLode. Next serves this at /manifest.webmanifest.
export const dynamic = 'force-dynamic'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const supabase = createServerClient() as any
  const { data } = await supabase
    .from('brand_settings')
    .select('display_name, meta_description')
    .limit(1)
  const brand = (data ?? [])[0]
  const name: string = brand?.display_name || 'IfaLode'

  return {
    name,
    short_name: name,
    description:
      brand?.meta_description ||
      'Ifá wisdom, courses, live classes and the sacred store.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0B0908',
    theme_color: '#0B0908',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
