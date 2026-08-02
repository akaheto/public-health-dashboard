// Invoked by Vercel Cron (see vercel.json) on a daily schedule. Triggers a
// fresh deployment via the project's deploy hook, which re-runs the full
// build (prebuild -> build:data -> next build) so the site always reflects
// the newest available PopHIVE/NYC DOHMH pull, per D-001/A-003 (static site
// + scheduled rebuild rather than a live backend).
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const hookUrl = process.env.DEPLOY_HOOK_URL;
  if (!hookUrl) {
    return new Response("DEPLOY_HOOK_URL not configured", { status: 500 });
  }

  const res = await fetch(hookUrl, { method: "POST" });
  if (!res.ok) {
    return new Response(`Deploy hook failed: ${res.status}`, { status: 502 });
  }

  return Response.json({ triggered: true, at: new Date().toISOString() });
}
