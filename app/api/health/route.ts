export const dynamic = 'force-dynamic'

export async function GET() {
  return Response.json({
    status: 'ok',
    commit: process.env.RENDER_GIT_COMMIT ?? 'local',
    plan: 'starter',
    timestamp: new Date().toISOString(),
  })
}
