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

  const spotlightProduct = products[0]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-950 via-stone-950 to-neutral-950 flex flex-col items-center justify-center text-amber-100 gap-6">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-2 border-amber-600/30 animate-pulse" />
          <div className="absolute inset-0 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">🪵</div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-amber-200 text-sm font-medium tracking-widest uppercase">Consulting the Oracle</p>
          <p className="text-stone-400 text-xs">Loading sacred knowledge...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-950 via-stone-950 to-neutral-950 text-stone-100 flex flex-col selection:bg-amber-700 selection:text-amber-50">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-stone-950/80 border-b border-amber-900/50 shadow-2xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-3">
            <span className="text-3xl">🪵</span>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-wider text-amber-100 group-hover:text-amber-200 transition">
                {brand?.display_name || 'IFALODE'}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-amber-600/80">Digital Ifá Library</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link href="/store" className="text-amber-400 font-semibold transition">Store</Link>
              <Link href="/courses" className="text-stone-400 hover:text-amber-200 transition">Courses</Link>
              <Link href="/dashboard" className="text-stone-400 hover:text-amber-200 transition">Dashboard</Link>
            </div>
            <Link 
              href="/login"
              className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-700 to-amber-800 text-amber-50 rounded-lg shadow-lg shadow-amber-900/40 hover:from-amber-600 hover:to-amber-700 hover:scale-[1.02] active:scale-[0.98] transition-all border border-amber-600/30"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="relative overflow-hidden bg-gradient-to-b from-stone-900/80 via-amber-950/50 to-transparent border-b border-amber-900/30 pt-20 pb-16 px-6">
        {/* Decorative patterns */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 border border-amber-500/30 rounded-full" />
          <div className="absolute top-40 right-20 w-96 h-96 border border-amber-600/20 rounded-full" />
          <div className="absolute bottom-20 left-1/3 w-80 h-80 border border-amber-700/20 rounded-full" />
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-900/30 border border-amber-700/40 text-amber-300 text-[10px] font-bold uppercase tracking-widest mb-6">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Òrìṣà-Approved Knowledge
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-amber-50 tracking-tight mb-6 leading-tight">
              Sacred Texts & <br />
              <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">Divination Tools</span>
            </h1>
            <p className="text-stone-400 text-base md:text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
              Access authentic Ifá corpus, Odu verses, and spiritual guides from initiated Babalawo. 
              Preserve the wisdom of Ọ̀rúnmìlà for the digital age.
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto relative group">
              <span className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-amber-600/70 group-focus-within:text-amber-400 transition text-xl">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search Odu, verses, e-books, or spiritual tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-5 py-5 bg-stone-900/70 border border-amber-900/50 rounded-2xl text-amber-50 placeholder-stone-500 focus:outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-700/20 transition shadow-2xl text-base"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-xs text-stone-500 hover:text-amber-300 transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Spotlight */}
          {spotlightProduct && !searchQuery && selectedCategory === 'All' && (
            <div className="mt-12 bg-gradient-to-r from-stone-900/90 via-amber-950/50 to-stone-900/90 border border-amber-800/40 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-700 to-amber-800 text-amber-50 text-[10px] font-bold uppercase px-5 py-2 rounded-bl-2xl tracking-widest shadow-lg border-b border-l border-amber-600/30">
                ✨ Featured Teaching
              </div>
              <div className="space-y-4 max-w-xl">
                <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Babalawo Recommended</span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-amber-50 leading-tight">{spotlightProduct.title}</h2>
                <p className="text-stone-400 text-sm leading-relaxed line-clamp-3">{spotlightProduct.description}</p>
                <div className="flex items-center gap-5 pt-3">
                  <span className="text-2xl font-black text-amber-300">${spotlightProduct.price ?? '0.00'}</span>
                  <Link
                    href={`/store/${spotlightProduct.id}`}
                    className="px-8 py-3 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-amber-50 font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-amber-900/50 border border-amber-600/30"
                  >
                    Explore This Resource →
                  </Link>
                </div>
              </div>
              <div className="w-full md:w-80 h-52 rounded-2xl bg-gradient-to-br from-stone-900 to-amber-950/50 border border-amber-800/40 flex items-center justify-center text-6xl shadow-inner shrink-0">
                📿
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Catalog */}
      <main className="flex-1 container mx-auto px-6 py-16 max-w-7xl">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-12 pb-8 border-b border-amber-900/30">
          {/* Categories */}
          <div className="flex items-center gap-3 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
            {['All', 'E-Books', 'Odu Corpus', 'Divination Tools', 'Ritual Guides'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-amber-700 to-amber-800 text-amber-50 shadow-lg shadow-amber-900/40 scale-[1.02] border border-amber-600/40'
                    : 'bg-stone-900/50 border border-amber-900/30 text-stone-400 hover:text-amber-200 hover:border-amber-700/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <span className="text-xs text-stone-500 font-medium uppercase tracking-wider">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-stone-900/50 border border-amber-900/30 text-amber-100 text-xs font-semibold px-4 py-2.5 rounded-xl focus:outline-none focus:border-amber-600 transition cursor-pointer"
            >
              <option value="newest">Latest Additions</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Products / Empty */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-stone-900/40 border border-amber-900/30 rounded-3xl p-10 max-w-lg mx-auto">
            <div className="w-20 h-20 rounded-2xl bg-amber-950/50 flex items-center justify-center text-5xl mx-auto mb-6 border border-amber-800/30">
              🔮
            </div>
            <h3 className="text-xl font-bold text-amber-100 mb-3">No Results Found</h3>
            <p className="text-stone-400 text-sm leading-relaxed mb-8">
              The oracle did not reveal any resources matching your search. 
              Try different keywords or clear your filters.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="px-6 py-3 bg-stone-800/80 hover:bg-stone-700/80 text-amber-100 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-md border border-amber-900/30"
            >
              Reset Search
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-amber-900/30 py-12 text-xs text-stone-500 bg-stone-950/80">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-xl">🪵</span>
            <p>© {new Date().getFullYear()} {brand?.display_name || 'IFALODE'}. 
            <span className="ml-2 text-amber-700/60">Preserving Ifá wisdom for future generations.</span></p>
          </div>
          <div className="flex gap-6 font-medium">
            <Link href="/store" className="hover:text-amber-300 transition">Store</Link>
            <Link href="/courses" className="hover:text-amber-300 transition">Courses</Link>
            <Link href="/dashboard" className="hover:text-amber-300 transition">Dashboard</Link>
            <Link href="/login" className="hover:text-amber-300 transition">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
