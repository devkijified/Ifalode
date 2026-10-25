'use client'

import { Product } from '@/types'
import Link from 'next/link'
import { Price } from '@/components/ui/primitives'

interface ProductCardProps {
  product: Product
}

/**
 * The whole card opens the product page. The product file itself is
 * never linked from here: files only reach buyers, on the product page,
 * after a completed order exists.
 */
export const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <Link href={`/store/${product.id}`}>
      <div className="bg-ink-850 rounded-2xl border border-cream/10 hover:border-brand-primary/40 transition-all hover:translate-y-[-4px] hover:shadow-xl hover:shadow-brand-primary/5 overflow-hidden">
        <div className="p-4">
          <h3 className="font-semibold text-white text-lg mb-1 line-clamp-1">{product.title}</h3>
          <p className="text-cream-dim text-sm line-clamp-2 mb-3">{product.description}</p>
          <div className="flex justify-between items-center">
            <Price amount={product.price} className="text-xl text-brand-primary" />
            <span className="text-xs text-cream-faint bg-ink-700 px-2 py-1 rounded-full">
              {product.is_ebook ? 'E-book' : 'Product'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
