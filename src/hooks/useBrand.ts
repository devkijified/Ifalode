import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface BrandSettings {
  id: string
  brand_name: string
  display_name: string
  primary_color: string
  secondary_color: string
  accent_color: string
  font_family: string
  logo_url: string | null
  favicon_url: string | null
  meta_title: string | null
  meta_description: string | null
  updated_at: string
}

export const useBrand = () => {
  const [brand, setBrand] = useState<BrandSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchBrand = async () => {
      const { data, error } = await supabase
        .from('brand_settings')
        .select('*')
        .limit(1)
        .single()

      if (!error && data) {
        const brandData = data as BrandSettings
        setBrand(brandData)
        document.documentElement.style.setProperty('--brand-primary', brandData.primary_color)
        document.documentElement.style.setProperty('--brand-secondary', brandData.secondary_color)
        document.documentElement.style.setProperty('--brand-accent', brandData.accent_color)
      }

      setLoading(false)
    }

    fetchBrand()
  }, [])

  const updateBrand = async (updates: Partial<BrandSettings>) => {
    if (!brand?.id) {
      return {
        success: false,
        error: new Error('No brand loaded yet'),
      }
    }

    // Use `any` type casting to bypass strict Supabase RPC type checking if the database types are out of sync
    const { data, error } = await (supabase.rpc as any)('update_brand_settings', {
      p_id: brand.id,
      p_updates: updates,
    })

    if (!error && data) {
      const brandData = (data as unknown as { brand: BrandSettings } | null)?.brand ?? (data as unknown as BrandSettings | null) ?? null

      if (brandData) {
        setBrand(brandData)

        if (updates.primary_color) {
          document.documentElement.style.setProperty('--brand-primary', updates.primary_color)
        }
        if (updates.secondary_color) {
          document.documentElement.style.setProperty('--brand-secondary', updates.secondary_color)
        }
        if (updates.accent_color) {
          document.documentElement.style.setProperty('--brand-accent', updates.accent_color)
        }

        return { success: true, data: brandData }
      }
    }

    return { success: false, error: error as any }
  }

  return { brand, loading, updateBrand }
}
