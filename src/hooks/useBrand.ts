import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BrandSettings } from '@/types'

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
        // Use type assertion to handle the unknown type
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
    const { data, error } = await supabase
      .from('brand_settings')
      .update(updates)
      .eq('id', brand?.id)
      .select()
      .single()

    if (!error && data) {
      const brandData = data as BrandSettings
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
    return { success: false, error }
  }

  return { brand, loading, updateBrand }
}
