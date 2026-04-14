'use client'

import { useParams } from 'next/navigation'
import DiceRoller from '@/components/multiplication/DiceRoller'

export default function DicePage() {
  const params = useParams()
  const tableNumber = Number(params.table)

  if (isNaN(tableNumber) || tableNumber < 1 || tableNumber > 10) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">Invalid table number</p>
      </div>
    )
  }

  return <DiceRoller tableNumber={tableNumber} />
}
