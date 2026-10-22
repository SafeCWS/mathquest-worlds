/**
 * POST /api/otp/request  { email }  →  always
 *   200 { ok: true, message: "If that email is on the family list, a code is on its way.", resendAfterSec: 60 }
 *
 * Identical body and a fixed timing floor for every outcome (L99 / L162).
 * Logic + tests: lib/auth/requestCode.ts, lib/auth/__tests__/requestCode.test.ts.
 * Public route: listed in the middleware negative lookahead as `api/otp`.
 */
import { handleRequestCode } from '@/lib/auth/requestCode'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request): Promise<Response> {
  return handleRequestCode(req)
}
