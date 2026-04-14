'use client'

import { useParams } from 'next/navigation'
import BubblePop from '@/components/multiplication/BubblePop'

export default function BubblePage() {
  const params = useParams()
  const tableNumber = Number(params.table)

  if (isNaN(tableNumber) || tableNumber < 1 || tableNumber > 10) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">Invalid table number</p>
      </div>
    )
  }

  return <BubblePop tableNumber={tableNumber} />
}
