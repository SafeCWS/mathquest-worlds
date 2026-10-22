'use client'

import { Suspense } from 'react'
import { BigMultiplication } from '@/components/big/BigMultiplication'

// Same pattern as the real /multiplication/9/fingers sub-route: a thin page around one component.
export default function BigMultiplicationPage() {
  return (
    <Suspense fallback={null}>
      <BigMultiplication />
    </Suspense>
  )
}
