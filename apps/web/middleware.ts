import { NextResponse, type NextRequest } from "next/server";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || process.env.ROOT_DOMAIN || "classpoint.ng";
const HQ_HOST = `app.${ROOT_DOMAIN}`;
const ROOT_HOSTS = new Set([ROOT_DOMAIN, `www.${ROOT_DOMAIN}`]);

const normalizeHost = (host: string | null) => {
  if (!host) return "";
  return host.split(":")[0].toLowerCase();
};

const getRequestHost = (request: NextRequest) => {
  const forwarded = request.headers.get("x-forwarded-host");
  return normalizeHost(forwarded || request.headers.get("host"));
};

const isLocalhost = (host: string) => host === "localhost" || host.endsWith(".localhost");

const getTenantSlug = (host: string) => {
  if (!host) return "";
  if (isLocalhost(host)) return "";
  if (host.endsWith(".localhost")) {
    return host.replace(".localhost", "");
  }
  if (ROOT_HOSTS.has(host) || host === HQ_HOST) return "";
  if (host.endsWith(`.${ROOT_DOMAIN}`)) {
    return host.slice(0, -(ROOT_DOMAIN.length + 1));
  }
  return "";
};

const isTenantOnlyPath = (pathname: string) =>
  pathname.startsWith("/admin") ||
  pathname.startsWith("/teacher") ||
  pathname.startsWith("/portal") ||
  pathname.startsWith("/invoices");

const isHqOnlyPath = (pathname: string) => pathname.startsWith("/platform");

const isAuthPath = (pathname: string) => pathname.startsWith("/auth") || pathname.startsWith("/api/auth");

export function middleware(request: NextRequest) {
  const host = getRequestHost(request);
  const pathname = request.nextUrl.pathname;
  const proto = request.headers.get("x-forwarded-proto") || (isLocalhost(host) ? "http" : "https");

  if (!host) return NextResponse.next();

  if (ROOT_HOSTS.has(host)) {
    const target = `${proto}://${HQ_HOST}${pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(target, 307);
  }

  const tenantSlug = getTenantSlug(host);
  const isHq = host === HQ_HOST;
  const isTenantHost = Boolean(tenantSlug);
  const isAllowedHost = isHq || isTenantHost || ROOT_HOSTS.has(host) || isLocalhost(host);

  if (!isAllowedHost && !isAuthPath(pathname)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  if (isHq) {
    if (isTenantOnlyPath(pathname)) {
      const target = `${proto}://${HQ_HOST}/platform`;
      return NextResponse.redirect(target, 307);
    }
  }

  if (isTenantHost) {
    if (isHqOnlyPath(pathname)) {
      const target = `${proto}://${host}/`;
      return NextResponse.redirect(target, 307);
    }
  }

  if (!isHq && !isTenantHost && !isAuthPath(pathname)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  if (isTenantHost) {
    response.headers.set("x-tenant-slug", tenantSlug);
    response.headers.set("x-host-type", "tenant");
  } else if (isHq) {
    response.headers.set("x-host-type", "hq");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
