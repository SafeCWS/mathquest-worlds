import { EnglishOnly } from '@/components/EnglishOnly'

// English only (operator ruling 2026-10-22) — no EN/ES toggle on the new sign-in.
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <EnglishOnly>{children}</EnglishOnly>
}
