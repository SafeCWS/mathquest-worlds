// ONE colour per place value, across all 4 modes (research rec #2).
// Every value is an existing token from the real app's app/globals.css — never re-typed hex.
//   tens  = --retry-blue        (#2196F3)  rods, area-model tens piece, column tens digit
//   ones  = --candy-primary     (#FF1493)  cubes, area-model ones piece, column ones digit
//   carry = --dino-secondary    (#FF6B35)  carry bubble + carry echo
//   hundreds = --space-secondary (#7B68EE) answer hundreds digit only
// FILLS use the bright token. TEXT uses a darker shade of the SAME hue (QA M3b: bright tokens
// are 2.8–3.3:1 as text) — color-mix with black, so the hue still matches its fill.
export const PV = {
  tens: 'var(--retry-blue)',
  ones: 'var(--candy-primary)',
  // darkened from the token so white digits on the bubble reach 3:1 (large bold)
  carry: 'color-mix(in srgb, var(--dino-secondary) 80%, black)',
  hundreds: 'var(--space-secondary)',
} as const

export const PV_TEXT = {
  tens: 'color-mix(in srgb, var(--retry-blue) 60%, black)',
  ones: 'color-mix(in srgb, var(--candy-primary) 68%, black)',
  carry: 'color-mix(in srgb, var(--dino-secondary) 62%, black)',
  hundreds: 'color-mix(in srgb, var(--space-secondary) 70%, black)',
} as const

export const pvBg = (c: keyof typeof PV) => ({ backgroundColor: PV[c] })
export const pvText = (c: keyof typeof PV) => ({ color: PV_TEXT[c] })
export const pvBorder = (c: keyof typeof PV) => ({ borderColor: PV[c] })
