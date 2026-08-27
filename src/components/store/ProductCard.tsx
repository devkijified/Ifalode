'use client'

import { Product } from '@/types'
import Link from 'next/link'

interface ProductCardProps {
  product: Product
}

export const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <Link href={`/store/${product.id}`}>
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-4">
        <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
          {product.cover_image ? (
            <img src={product.cover_image} alt={product.title} className="w-full h-full object-cover rounded-lg" />
          ) : (
            <span className="text-gray-400">📚</span>
          )}
        </div>
        <h3 className="font-semibold text-lg mb-1">{product.title}</h3>
        <p className="text-gray-600 text-sm line-clamp-2 mb-2">{product.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-brand-primary">${product.price}</span>
          <span className="text-sm text-gray-500">{product.is_ebook ? 'E-book' : 'Product'}</span>
        </div>
      </div>
    </Link>
  )
}
