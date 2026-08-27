'use client'

import { Product } from '@/types'
import Link from 'next/link'

interface ProductCardProps {
  product: Product
}

export const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <Link href={`/store/${product.id}`}>
      <div className="bg-slate-900 rounded-2xl border border-slate-800 hover:border-brand-primary/40 transition-all hover:translate-y-[-4px] hover:shadow-xl hover:shadow-brand-primary/5 overflow-hidden">
        {/* ... rest of component */}
        <div className="p-4">
          <h3 className="font-semibold text-white text-lg mb-1 line-clamp-1">{product.title}</h3>
          <p className="text-slate-400 text-sm line-clamp-2 mb-3">{product.description}</p>
          <div className="flex justify-between items-center">
            {/* ✅ Uses brand-primary for price */}
            <span className="text-xl font-bold text-brand-primary">${product.price}</span>
            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full">
              {product.is_ebook ? 'E-book' : 'Product'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
