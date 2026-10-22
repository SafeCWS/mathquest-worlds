'use client'

import { useTranslations } from 'next-intl'
import NumberPad from '@/components/multiplication/NumberPad'

// Thin wrapper over the real components/multiplication/NumberPad.tsx
// (60×60 keys, on-screen only — no keyboard). Up to 4 digits for 99 × 9 = 891.
export function AnswerPad({ label, onSubmit }: { label: string; onSubmit: (n: number) => void }) {
  const t = useTranslations('bigMult')
  return (
    <div className="dock-card bg-white/90 backdrop-blur-sm rounded-3xl p-3 md:p-4 shadow-xl border-4 border-white/60" data-testid="answer-pad">
      <NumberPad onSubmit={onSubmit} maxValue={9999} label={label} deleteLabel={t('padDelete')} checkLabel={t('padCheck')} displayLabel={t('padDisplay')} />
    </div>
  )
}
