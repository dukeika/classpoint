import { NextResponse, type NextRequest } from "next/server";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || process.env.ROOT_DOMAIN || "classpoint.ng";
const COGNITO_DOMAIN = process.env.COGNITO_DOMAIN || "https://auth.classpoint.ng";
const COGNITO_CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "";

const normalizeHost = (host: string | null) => {
  if (!host) return "";
  return host.split(":")[0].toLowerCase();
};

const getRequestHost = (request: NextRequest) => {
  const forwarded = request.headers.get("x-forwarded-host");
  return normalizeHost(forwarded || request.headers.get("host"));
};

const isLocalhost = (host: string) => host === "localhost" || host.endsWith(".localhost");

export async function GET(request: NextRequest) {
  const host = getRequestHost(request);
  const proto = request.headers.get("x-forwarded-proto") || (isLocalhost(host) ? "http" : "https");
  const logoutUri = `${proto}://${host}/`;

  const logoutUrl = new URL(`${COGNITO_DOMAIN}/logout`);
  if (COGNITO_CLIENT_ID) logoutUrl.searchParams.set("client_id", COGNITO_CLIENT_ID);
  logoutUrl.searchParams.set("logout_uri", logoutUri);

  const response = NextResponse.redirect(logoutUrl.toString(), 302);
  response.cookies.set("cp.id_token", "", { path: "/", maxAge: 0 });
  response.cookies.set("cp.access_token", "", { path: "/", maxAge: 0 });
  response.cookies.set("cp.refresh_token", "", { path: "/", maxAge: 0 });
  response.cookies.set("cp.session", "", { path: "/", maxAge: 0 });
  return response;
}
