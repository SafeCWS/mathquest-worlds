export const dynamic = 'force-dynamic'

export async function GET() {
  return Response.json({
    status: 'ok',
    commit: process.env.RENDER_GIT_COMMIT ?? 'local',
    plan: 'starter',
    timestamp: new Date().toISOString(),
    // Static config flag only. Nothing here may move when a code is sent
    // (that would reveal who is on the family list). Per-send proof-of-life
    // is the `[otp-mail] result=…` server log line.
    mailConfigured: !!process.env.GMAIL_APP_PASSWORD,
  })
}
