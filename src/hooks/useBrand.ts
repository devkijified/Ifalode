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
      try {
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
      } catch (err) {
        console.error('Error fetching brand:', err)
      } finally {
        setLoading(false)
      }
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

    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      }

      // Cast to any to bypass TypeScript strict checking
      const { data, error } = await (supabase as any)
        .from('brand_settings')
        .update(updateData)
        .eq('id', brand.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating brand:', error)
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

      return { success: false, error: new Error('No data returned') }
    } catch (err) {
      console.error('Unexpected error:', err)
      return { success: false, error: err as Error }
    }
  }

  return { brand, loading, updateBrand }
}
