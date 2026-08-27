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
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ 
        backgroundColor: '#0f172a',
        color: 'var(--brand-secondary)'
      }}>
        <div className="relative w-20 h-20">
          <div 
            className="absolute inset-0 rounded-full border-2 animate-pulse" 
            style={{ borderColor: 'var(--brand-primary, #8B5E3C)' }}
          />
          <div 
            className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin" 
            style={{ 
              borderColor: 'var(--brand-primary, #8B5E3C)',
              borderTopColor: 'transparent'
            }} 
          />
          <div className="absolute inset-0 flex items-center justify-center text-3xl">🪵</div>
        </div>
        <div className="text-center space-y-2">
          <p 
            className="text-sm font-medium tracking-widest uppercase"
            style={{ color: 'var(--brand-secondary, #D4A574)' }}
          >
            Consulting the Oracle
          </p>
          <p className="text-stone-400 text-xs">Loading sacred knowledge...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ 
      backgroundColor: '#0f172a',
      color: '#f1f5f9'
    }}>
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl border-b shadow-2xl" style={{ 
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        borderColor: 'var(--brand-primary, #8B5E3C)'
      }}>
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-3">
            <span className="text-3xl">🪵</span>
            <div className="flex flex-col">
              <span 
                className="text-xl font-bold tracking-wider transition"
                style={{ color: 'var(--brand-secondary, #D4A574)' }}
              >
                {brand?.display_name || 'IFALODE'}
              </span>
              <span className="text-[10px] uppercase tracking-widest" style={{ 
                color: 'var(--brand-primary, #8B5E3C)',
                opacity: 0.8
              }}>
                Digital Ifá Library
              </span>
            </div>
          </Link>
          
          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link 
                href="/store" 
                className="font-semibold transition"
                style={{ color: 'var(--brand-secondary, #D4A574)' }}
              >
                Store
              </Link>
              <Link href="/courses" className="text-stone-400 hover:text-white transition">Courses</Link>
              <Link href="/dashboard" className="text-stone-400 hover:text-white transition">Dashboard</Link>
            </div>
            <Link 
              href="/login"
              className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ 
                background: 'linear-gradient(to right, var(--brand-primary, #8B5E3C), var(--brand-secondary, #D4A574))',
                color: 'white',
                boxShadow: '0 10px 25px -5px var(--brand-primary, #8B5E3C)'
              }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="relative overflow-hidden border-b pt-20 pb-16 px-6" style={{ 
        background: 'linear-gradient(to bottom, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 1))',
        borderColor: 'var(--brand-primary, #8B5E3C)'
      }}>
        {/* Decorative patterns */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
          <div 
            className="absolute top-20 left-10 w-64 h-64 border rounded-full" 
            style={{ borderColor: 'var(--brand-primary, #8B5E3C)' }}
          />
          <div 
            className="absolute top-40 right-20 w-96 h-96 border rounded-full" 
            style={{ borderColor: 'var(--brand-primary, #8B5E3C)' }}
          />
          <div 
            className="absolute bottom-20 left-1/3 w-80 h-80 border rounded-full" 
            style={{ borderColor: 'var(--brand-primary, #8B5E3C)' }}
          />
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-12">
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest mb-6"
              style={{ 
                backgroundColor: 'var(--brand-primary, #8B5E3C)',
                borderColor: 'var(--brand-secondary, #D4A574)',
                color: 'var(--brand-secondary, #D4A574)'
              }}
            >
              <span 
                className="w-2 h-2 rounded-full animate-pulse" 
                style={{ backgroundColor: 'var(--brand-secondary, #D4A574)' }}
              />
              Òrìṣà-Approved Knowledge
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight text-white">
              Sacred Texts & <br />
              <span style={{ 
                background: 'linear-gradient(to right, var(--brand-secondary, #D4A574), var(--brand-primary, #8B5E3C))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Divination Tools
              </span>
            </h1>
            <p className="text-stone-400 text-base md:text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
              Access authentic Ifá corpus, Odu verses, and spiritual guides from initiated Babalawo. 
              Preserve the wisdom of Ọ̀rúnmìlà for the digital age.
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto relative group">
              <span 
                className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition text-xl"
                style={{ color: 'var(--brand-primary, #8B5E3C)' }}
              >
                🔍
              </span>
              <input
                type="text"
                placeholder="Search Odu, verses, e-books, or spiritual tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-5 py-5 border rounded-2xl text-white placeholder-stone-500 focus:outline-none focus:ring-4 transition shadow-2xl text-base"
                style={{ 
                  backgroundColor: 'rgba(30, 41, 59, 0.7)',
                  borderColor: 'var(--brand-primary, #8B5E3C)',
                  '--tw-ring-color': 'var(--brand-primary, #8B5E3C)'
                } as any}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-xs text-stone-500 hover:text-white transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Spotlight */}
          {spotlightProduct && !searchQuery && selectedCategory === 'All' && (
            <div 
              className="mt-12 border rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden"
              style={{ 
                background: 'linear-gradient(to right, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.5), rgba(15, 23, 42, 0.9))',
                borderColor: 'var(--brand-primary, #8B5E3C)'
              }}
            >
              <div 
                className="absolute top-0 right-0 text-[10px] font-bold uppercase px-5 py-2 rounded-bl-2xl tracking-widest shadow-lg border-b border-l"
                style={{ 
                  background: 'linear-gradient(to right, var(--brand-primary, #8B5E3C), var(--brand-secondary, #D4A574))',
                  color: 'white',
                  borderColor: 'var(--brand-primary, #8B5E3C)'
                }}
              >
                ✨ Featured Teaching
              </div>
              <div className="space-y-4 max-w-xl">
                <span 
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--brand-secondary, #D4A574)' }}
                >
                  Babalawo Recommended
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
                  {spotlightProduct.title}
                </h2>
                <p className="text-stone-400 text-sm leading-relaxed line-clamp-3">
                  {spotlightProduct.description}
                </p>
                <div className="flex items-center gap-5 pt-3">
                  <span 
                    className="text-2xl font-black"
                    style={{ color: 'var(--brand-secondary, #D4A574)' }}
                  >
                    ${spotlightProduct.price ?? '0.00'}
                  </span>
                  <Link
                    href={`/store/${spotlightProduct.id}`}
                    className="px-8 py-3 font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg border"
                    style={{ 
                      background: 'linear-gradient(to right, var(--brand-primary, #8B5E3C), var(--brand-secondary, #D4A574))',
                      color: 'white',
                      borderColor: 'var(--brand-primary, #8B5E3C)',
                      boxShadow: '0 10px 25px -5px var(--brand-primary, #8B5E3C)'
                    }}
                  >
                    Explore This Resource →
                  </Link>
                </div>
              </div>
              <div 
                className="w-full md:w-80 h-52 rounded-2xl border flex items-center justify-center text-6xl shadow-inner shrink-0"
                style={{ 
                  background: 'linear-gradient(to bottom right, #1e293b, rgba(15, 23, 42, 0.5))',
                  borderColor: 'var(--brand-primary, #8B5E3C)'
                }}
              >
                📿
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Catalog */}
      <main className="flex-1 container mx-auto px-6 py-16 max-w-7xl">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-12 pb-8 border-b" style={{ 
          borderColor: 'var(--brand-primary, #8B5E3C)'
        }}>
          {/* Categories */}
          <div className="flex items-center gap-3 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
            {['All', 'E-Books', 'Odu Corpus', 'Divination Tools', 'Ritual Guides'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'scale-[1.02] border shadow-lg'
                    : 'border text-stone-400 hover:text-white hover:border-opacity-50'
                }`}
                style={{ 
                  ...(selectedCategory === cat ? {
                    background: 'linear-gradient(to right, var(--brand-primary, #8B5E3C), var(--brand-secondary, #D4A574))',
                    color: 'white',
                    borderColor: 'var(--brand-primary, #8B5E3C)',
                    boxShadow: '0 10px 25px -5px var(--brand-primary, #8B5E3C)'
                  } : {
                    backgroundColor: 'rgba(30, 41, 59, 0.5)',
                    borderColor: 'var(--brand-primary, #8B5E3C)'
                  })
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--brand-secondary, #D4A574)' }}>
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border text-xs font-semibold px-4 py-2.5 rounded-xl focus:outline-none transition cursor-pointer"
              style={{ 
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                borderColor: 'var(--brand-primary, #8B5E3C)',
                color: 'var(--brand-secondary, #D4A574)'
              }}
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
          <div 
            className="text-center py-32 border rounded-3xl p-10 max-w-lg mx-auto"
            style={{ 
              backgroundColor: 'rgba(30, 41, 59, 0.4)',
              borderColor: 'var(--brand-primary, #8B5E3C)'
            }}
          >
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl mx-auto mb-6 border"
              style={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.5)',
                borderColor: 'var(--brand-primary, #8B5E3C)'
              }}
            >
              🔮
            </div>
            <h3 className="text-xl font-bold text-white mb-3">No Results Found</h3>
            <p className="text-stone-400 text-sm leading-relaxed mb-8">
              The oracle did not reveal any resources matching your search. 
              Try different keywords or clear your filters.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-md border"
              style={{ 
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                borderColor: 'var(--brand-primary, #8B5E3C)',
                color: 'var(--brand-secondary, #D4A574)'
              }}
            >
              Reset Search
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer 
        className="border-t py-12 text-xs bg-opacity-80"
        style={{ 
          borderColor: 'var(--brand-primary, #8B5E3C)',
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          color: 'var(--brand-secondary, #D4A574)'
        }}
      >
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-xl">🪵</span>
            <p>© {new Date().getFullYear()} {brand?.display_name || 'IFALODE'}. 
            <span className="ml-2" style={{ color: 'var(--brand-primary, #8B5E3C)', opacity: 0.6 }}>
              Preserving Ifá wisdom for future generations.
            </span></p>
          </div>
          <div className="flex gap-6 font-medium">
            <Link href="/store" className="hover:text-white transition" style={{ color: 'var(--brand-secondary, #D4A574)' }}>Store</Link>
            <Link href="/courses" className="hover:text-white transition" style={{ color: 'var(--brand-secondary, #D4A574)' }}>Courses</Link>
            <Link href="/dashboard" className="hover:text-white transition" style={{ color: 'var(--brand-secondary, #D4A574)' }}>Dashboard</Link>
            <Link href="/login" className="hover:text-white transition" style={{ color: 'var(--brand-secondary, #D4A574)' }}>Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
