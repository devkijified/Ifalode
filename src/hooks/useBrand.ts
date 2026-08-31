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
  }, [supabase])

  const updateBrand = async (updates: Partial<BrandSettings>) => {
    if (!brand?.id) {
      return {
        success: false,
        error: new Error('No brand loaded yet'),
      }
    }

    // Direct table update instead of relying on a custom RPC function
    const { data, error } = await supabase
      .from('brand_settings')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', brand.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating brand settings:', error)
      return { success: false, error }
    }

    if (data) {
      const brandData = data as BrandSettings
      setBrand(brandData)

      if (brandData.primary_color) {
        document.documentElement.style.setProperty('--brand-primary', brandData.primary_color)
      }
      if (brandData.secondary_color) {
        document.documentElement.style.setProperty('--brand-secondary', brandData.secondary_color)
      }
      if (brandData.accent_color) {
        document.documentElement.style.setProperty('--brand-accent', brandData.accent_color)
      }

      return { success: true, data: brandData }
    }

    return { success: false, error: new Error('No data returned from update') }
  }

  return { brand, loading, updateBrand }
}
