import { getMailStats } from '@/lib/auth/mailStats'

export const dynamic = 'force-dynamic'

export async function GET() {
  return Response.json({
    status: 'ok',
    commit: process.env.RENDER_GIT_COMMIT ?? 'local',
    plan: 'starter',
    timestamp: new Date().toISOString(),
    // OTP mail proof-of-life (L104): boolean + count only, no addresses.
    otpMail: getMailStats().snapshot(),
  })
}
