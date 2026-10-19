const VENDOR_API_URL =
  process.env.VENDOR_API_URL ?? 'https://vendor-bot-final.onrender.com';

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function proxyRequest(request: Request, context: RouteContext) {
  const { path } = await context.params;
  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(
    `/api/${path.map(encodeURIComponent).join('/')}${incomingUrl.search}`,
    VENDOR_API_URL,
  );

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  const authorization = request.headers.get('authorization');
  if (contentType) headers.set('content-type', contentType);
  if (authorization) headers.set('authorization', authorization);

  if (path[0] === 'auth') {
    const origin = request.headers.get('origin');
    if (origin && origin !== incomingUrl.origin) return Response.json({error: 'Origine non autorisée'}, {status: 403});
    const cookie = request.headers.get('cookie');
    if (cookie) headers.set('cookie', cookie);
    const sessionHeader = request.headers.get('X-FanMilk-Session');
    if (sessionHeader) headers.set('X-FanMilk-Session', sessionHeader);
  }
  try {
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body:
        request.method === 'GET' || request.method === 'HEAD'
          ? undefined
          : await request.arrayBuffer(),
      redirect: 'manual',
      signal: AbortSignal.timeout(path[0] === "auth" ? 90_000 : 15_000),
    });

    const responseHeaders = new Headers();
    const upstreamContentType = upstream.headers.get('content-type');
    if (upstreamContentType)
      responseHeaders.set('content-type', upstreamContentType);
    responseHeaders.set('cache-control', 'no-store');
    const cookie = upstream.headers.get('set-cookie');
    if (path[0] === 'auth' && cookie) responseHeaders.append('set-cookie', cookie);

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      {
        error:
          'Le service FanMilk se réveille. Patientez quelques secondes puis réessayez.',
      },
      { status: 503, headers: { 'cache-control': 'no-store' } },
    );
  }
}

export const dynamic = 'force-dynamic';

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
