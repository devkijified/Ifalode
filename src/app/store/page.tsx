'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Product } from '@/types'
import { ProductCard } from '@/components/store/ProductCard'
import { useBrand } from '@/hooks/useBrand'

export default function StorePage() {
  const { brand } = useBrand()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest')
  const supabase = createClient()

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (data) setProducts(data)
      setLoading(false)
    }

    fetchProducts()
  }, [])

  // Filter and sort products dynamically
  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const matchesSearch = 
        product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = selectedCategory === 'All' || (product as any).category === selectedCategory
      return matchesSearch && matchesCategory
    })

    return result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
      }
      if (sortBy === 'price-low') {
        return (a.price || 0) - (b.price || 0)
      }
      if (sortBy === 'price-high') {
        return (b.price || 0) - (a.price || 0)
      }
      return 0
    })
  }, [products, searchQuery, selectedCategory, sortBy])

  // Get a featured product for the top spotlight banner (if any exist)
  const spotlightProduct = products[0]

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-brand-primary/20 animate-pulse" />
          <div className="absolute inset-0 rounded-full border-4 border-brand-primary border-t-transparent animate-spin" />
        </div>
        <p className="text-slate-400 text-sm font-medium tracking-wide">Syncing secure store inventory...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-brand-primary selection:text-white">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/75 border-b border-slate-800/80 shadow-2xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-3">
            <span className="text-2xl font-black tracking-wider bg-gradient-to-r from-brand-primary via-indigo-400 to-brand-secondary bg-clip-text text-transparent group-hover:opacity-90 transition">
              {brand?.display_name || 'Ifalode'}
            </span>
          </Link>
          
          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link href="/store" className="text-brand-primary font-semibold transition">Store</Link>
              <Link href="/courses" className="text-slate-400 hover:text-white transition">Courses</Link>
              <Link href="/dashboard" className="text-slate-400 hover:text-white transition">Dashboard</Link>
            </div>
            <Link 
              href="/login"
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl shadow-lg shadow-brand-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Header & Spotlight Banner */}
      <header className="relative overflow-hidden bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 border-b border-slate-800/60 pt-16 pb-12 px-6">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-brand-secondary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-bold uppercase tracking-widest mb-6">
              <span className="w-2 h-2 rounded-full bg-brand-primary animate-ping" />
              Verified Digital Assets & Guides
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
              Secure Your Stack with <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">Expert Toolkits</span>
            </h1>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed mb-8">
              Equip yourself with elite operational security blue-prints, forensic toolkits, and robust e-books designed to safeguard your digital assets.
            </p>

            {/* Interactive Search Field */}
            <div className="max-w-xl mx-auto relative group">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-brand-primary transition">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search by keyword, title, or toolkit type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-900/90 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition shadow-2xl"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs text-slate-500 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Spotlight Hero Card (Shows first product if available) */}
          {spotlightProduct && !searchQuery && selectedCategory === 'All' && (
            <div className="mt-8 bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-brand-primary text-white text-[10px] font-black uppercase px-4 py-1 rounded-bl-2xl tracking-widest shadow-md">
                Featured Release
              </div>
              <div className="space-y-3 max-w-xl">
                <span className="text-xs font-semibold text-brand-secondary uppercase tracking-wider">Top Recommendation</span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white">{spotlightProduct.title}</h2>
                <p className="text-slate-400 text-sm line-clamp-2">{spotlightProduct.description}</p>
                <div className="flex items-center gap-4 pt-2">
                  <span className="text-xl font-black text-white">${spotlightProduct.price ?? '0.00'}</span>
                  <Link
                    href={`/store/${spotlightProduct.id}`}
                    className="px-6 py-2.5 bg-brand-primary hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-brand-primary/25"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
              <div className="w-full md:w-72 h-44 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-4xl shadow-inner shrink-0">
                🛡️
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Catalog Section */}
      <main className="flex-1 container mx-auto px-6 py-12 max-w-7xl">
        {/* Filtering & Sorting Toolbar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-800/80">
          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {['All', 'E-Books', 'Toolkits', 'Security Audits'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/25 scale-[1.02]'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <span className="text-xs text-slate-500 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl focus:outline-none focus:border-brand-primary transition"
            >
              <option value="newest">Newest Releases</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Product Grid / Empty State */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-28 bg-slate-900/30 border border-slate-800/80 rounded-3xl p-8 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center text-3xl mx-auto mb-4 border border-slate-700/50">
              🔍
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No items found</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              We couldn't find any resources matching your criteria. Try adjusting your filters or search keywords.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition shadow-md"
            >
              Clear Search Filters
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-10 text-xs text-slate-500 bg-slate-950">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <p>© {new Date().getFullYear()} {brand?.display_name || 'Ifalode'}. All rights reserved. Built for absolute security.</p>
          <div className="flex gap-6 font-medium">
            <Link href="/store" className="hover:text-white transition">Store</Link>
            <Link href="/courses" className="hover:text-white transition">Courses</Link>
            <Link href="/dashboard" className="hover:text-white transition">Dashboard</Link>
            <Link href="/login" className="hover:text-white transition">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
