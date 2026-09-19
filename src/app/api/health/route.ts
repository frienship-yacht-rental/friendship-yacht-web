/**
 * Liveness probe for the web tier. Deliberately does not call the API: a
 * backend outage should surface on the backend's probe, not take the web
 * tier out of rotation with it.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok", timestamp: new Date().toISOString() });
}
