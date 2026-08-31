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

  const fetchBrand = async () => {
    try {
      const { data, error } = await supabase
        .from('brand_settings')
        .select('*')
        .limit(1)

      if (error) {
        console.error('Error fetching brand:', error)
        return
      }

      if (data && data.length > 0) {
        const brandData = data[0] as BrandSettings
        setBrand(brandData)
        document.documentElement.style.setProperty('--brand-primary', brandData.primary_color)
        document.documentElement.style.setProperty('--brand-secondary', brandData.secondary_color)
        document.documentElement.style.setProperty('--brand-accent', brandData.accent_color)
        return brandData
      }
      return null
    } catch (err) {
      console.error('Error fetching brand:', err)
      return null
    }
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await fetchBrand()
      setLoading(false)
    }
    init()
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

      console.log('🔄 Updating brand settings:', updateData)

      const { error } = await supabase
        .from('brand_settings')
        .update(updateData)
        .eq('id', brand.id)

      if (error) {
        console.error('❌ Error updating brand:', error)
        return { success: false, error }
      }

      console.log('✅ Update successful, refetching fresh data...')

      // Refetch fresh data
      const freshData = await fetchBrand()

      if (freshData) {
        return { success: true, data: freshData }
      }

      return { success: true, data: null }
    } catch (err) {
      console.error('❌ Unexpected error:', err)
      return { success: false, error: err as Error }
    }
  }

  return { brand, loading, updateBrand }
}
