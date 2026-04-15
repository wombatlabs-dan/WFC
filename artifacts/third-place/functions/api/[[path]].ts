/**
 * Cloudflare Pages Function — proxies all /api/* requests to the Worker.
 * This avoids CORS entirely: the browser sees everything as same-origin.
 */
const WORKER_URL = "https://third-place-api.dan-22b.workers.dev";

export async function onRequest(context: { request: Request }): Promise<Response> {
  const url = new URL(context.request.url);
  const target = `${WORKER_URL}${url.pathname}${url.search}`;

  // Forward the request, stripping any host header that would confuse the Worker
  const req = new Request(target, {
    method: context.request.method,
    headers: context.request.headers,
    body: ["GET", "HEAD"].includes(context.request.method) ? undefined : context.request.body,
    redirect: "follow",
  });

  return fetch(req);
}
