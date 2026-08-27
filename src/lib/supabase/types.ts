export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'user' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      brand_settings: {
        Row: {
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
        Insert: {
          id?: string
          brand_name?: string
          display_name?: string
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          font_family?: string
          logo_url?: string | null
          favicon_url?: string | null
          meta_title?: string | null
          meta_description?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          brand_name?: string
          display_name?: string
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          font_family?: string
          logo_url?: string | null
          favicon_url?: string | null
          meta_title?: string | null
          meta_description?: string | null
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          title: string
          description: string | null
          price: number
          cover_image: string | null
          file_url: string | null
          category: string | null
          is_ebook: boolean
          stock: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          price: number
          cover_image?: string | null
          file_url?: string | null
          category?: string | null
          is_ebook?: boolean
          stock?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          price?: number
          cover_image?: string | null
          file_url?: string | null
          category?: string | null
          is_ebook?: boolean
          stock?: number
          created_at?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string | null
          instructor: string | null
          price: number | null
          cover_image: string | null
          category: string | null
          level: 'beginner' | 'intermediate' | 'advanced' | null
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          instructor?: string | null
          price?: number | null
          cover_image?: string | null
          category?: string | null
          level?: 'beginner' | 'intermediate' | 'advanced' | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          instructor?: string | null
          price?: number | null
          cover_image?: string | null
          category?: string | null
          level?: 'beginner' | 'intermediate' | 'advanced' | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      lessons: {
        Row: {
          id: string
          course_id: string
          title: string
          content: string | null
          video_url: string | null
          order_number: number | null
          duration: number | null
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          content?: string | null
          video_url?: string | null
          order_number?: number | null
          duration?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          content?: string | null
          video_url?: string | null
          order_number?: number | null
          duration?: number | null
          created_at?: string
        }
      }
    }
  }
}
