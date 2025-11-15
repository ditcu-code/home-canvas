import React from 'react'
import { Product } from '../types'

interface ObjectCardProps {
  product: Product
  isSelected: boolean
  onClick?: () => void
}

const ObjectCard: React.FC<ObjectCardProps> = ({ product, isSelected, onClick }) => {
  const cardClasses = `
        bg-[hsl(var(--surface))]/80 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden transition-all duration-300
        ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}
        ${isSelected ? 'ring-2 ring-[hsl(var(--primary)/0.6)] shadow-md' : 'border border-[hsl(var(--border))]'}
    `

  return (
    <div className={cardClasses} onClick={onClick}>
      <div className="aspect-square w-full bg-[hsl(var(--surface-2))] flex items-center justify-center">
        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
      </div>
      <div className="p-3 text-center">
        <h4 className="text-sm font-semibold text-[hsl(var(--text))] truncate">{product.name}</h4>
      </div>
    </div>
  )
}

export default ObjectCard
