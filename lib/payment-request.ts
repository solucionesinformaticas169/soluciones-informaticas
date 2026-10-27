export function isPaymentSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    // Next's internal URL can use localhost behind a proxy; the Host header is
    // the browser-facing destination and cannot be chosen by cross-origin JS.
    const internalUrl = new URL(request.url);
    const host = request.headers.get("host") ?? internalUrl.host;
    if (!/^[a-z0-9.\-:\[\]]+$/i.test(host)) return false;
    const forwarded = request.headers.get("x-forwarded-proto");
    const protocol = forwarded === "https" || forwarded === "http" ? `${forwarded}:` : internalUrl.protocol;
    const destination = new URL(`${protocol}//${host}`);
    return new URL(origin).origin === destination.origin;
  } catch { return false; }
}
