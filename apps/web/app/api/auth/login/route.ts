import crypto from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand
} from "@aws-sdk/client-cognito-identity-provider";

const COGNITO_REGION = process.env.COGNITO_REGION || process.env.NEXT_PUBLIC_COGNITO_REGION || "us-east-1";
const COGNITO_CLIENT_ID =
  process.env.COGNITO_CLIENT_ID || process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "";
const COGNITO_CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET || "";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || process.env.ROOT_DOMAIN || "classpoint.ng";

const normalizeHost = (host: string | null) => {
  if (!host) return "";
  return host.split(":")[0].toLowerCase();
};

const getRequestHost = (request: NextRequest) => {
  const forwarded = request.headers.get("x-forwarded-host");
  return normalizeHost(forwarded || request.headers.get("host"));
};

const isLocalhost = (host: string) => host === "localhost" || host.endsWith(".localhost");

const isHqHost = (host: string) => host === `app.${ROOT_DOMAIN}`;

const isAllowedSchoolHost = (currentHost: string, host: string) => {
  if (!host) return false;
  if (isLocalhost(currentHost)) return isLocalhost(host);
  if (host === ROOT_DOMAIN) return true;
  return host.endsWith(`.${ROOT_DOMAIN}`);
};

const getCookieDomain = (host: string) => {
  if (isLocalhost(host)) return undefined;
  if (!ROOT_DOMAIN) return undefined;
  if (host === ROOT_DOMAIN || host.endsWith(`.${ROOT_DOMAIN}`)) {
    return `.${ROOT_DOMAIN}`;
  }
  return undefined;
};

const pickDefaultRoute = (host: string, groups: string[]) => {
  if (groups.includes("PARENT") || groups.includes("STUDENT")) return "/portal";
  if (groups.includes("TEACHER")) return "/teacher";
  if (groups.includes("BURSAR") || groups.includes("SCHOOL_ADMIN")) return "/admin";
  if (groups.includes("APP_ADMIN")) return isHqHost(host) ? "/platform" : "/admin";
  return "/";
};

const computeSecretHash = (username: string) => {
  if (!COGNITO_CLIENT_SECRET) return undefined;
  const hmac = crypto.createHmac("sha256", COGNITO_CLIENT_SECRET);
  hmac.update(`${username}${COGNITO_CLIENT_ID}`);
  return hmac.digest("base64");
};

const decodeJwtPayload = (token: string) => {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "=");
  try {
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch {
    return null;
  }
};

export async function POST(request: NextRequest) {
  if (!COGNITO_CLIENT_ID) {
    return NextResponse.json({ error: "COGNITO client id missing" }, { status: 500 });
  }

  const host = getRequestHost(request);
  const proto = request.headers.get("x-forwarded-proto") || (isLocalhost(host) ? "http" : "https");

  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const nextPath = typeof body?.next === "string" ? body.next : "";
  const safeNext = nextPath.startsWith("/") && nextPath !== "/" ? nextPath : "";
  const requestedHost = typeof body?.schoolHost === "string" ? normalizeHost(body.schoolHost) : "";

  if (!username || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const client = new CognitoIdentityProviderClient({ region: COGNITO_REGION });
  const secretHash = computeSecretHash(username);

  try {
    const result = await client.send(
      new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: COGNITO_CLIENT_ID,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
          ...(secretHash ? { SECRET_HASH: secretHash } : {})
        }
      })
    );

    const auth = result.AuthenticationResult;
    if (!auth?.IdToken) {
      return NextResponse.json({ error: "Authentication failed." }, { status: 401 });
    }

    const expiresIn = Number(auth.ExpiresIn || 3600);
    const refreshTtl = 60 * 60 * 24 * 30;

    const claims = decodeJwtPayload(auth.IdToken);
    const groups = Array.isArray(claims?.["cognito:groups"])
      ? claims?.["cognito:groups"]
      : typeof claims?.["cognito:groups"] === "string"
      ? [claims?.["cognito:groups"]]
      : [];
    const defaultRoute = safeNext || pickDefaultRoute(host, groups);
    const targetHost =
      requestedHost && requestedHost !== host && isAllowedSchoolHost(host, requestedHost)
        ? requestedHost
        : "";
    const redirectTo = targetHost ? `${proto}://${targetHost}${defaultRoute}` : defaultRoute;
    const cookieDomain = getCookieDomain(host);
    const response = NextResponse.json({ ok: true, redirectTo });
    response.cookies.set("cp.id_token", auth.IdToken, {
      httpOnly: true,
      secure: !isLocalhost(host),
      sameSite: "lax",
      path: "/",
      maxAge: expiresIn,
      ...(cookieDomain ? { domain: cookieDomain } : {})
    });
    if (auth.AccessToken) {
      response.cookies.set("cp.access_token", auth.AccessToken, {
        httpOnly: true,
        secure: !isLocalhost(host),
        sameSite: "lax",
        path: "/",
        maxAge: expiresIn,
        ...(cookieDomain ? { domain: cookieDomain } : {})
      });
    }
    if (auth.RefreshToken) {
      response.cookies.set("cp.refresh_token", auth.RefreshToken, {
        httpOnly: true,
        secure: !isLocalhost(host),
        sameSite: "lax",
        path: "/",
        maxAge: refreshTtl,
        ...(cookieDomain ? { domain: cookieDomain } : {})
      });
    }

    if (claims) {
      const raw = Buffer.from(JSON.stringify(claims)).toString("base64");
      const encoded = raw.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
      response.cookies.set("cp.session", encoded, {
        httpOnly: false,
        secure: !isLocalhost(host),
        sameSite: "lax",
        path: "/",
        maxAge: refreshTtl,
        ...(cookieDomain ? { domain: cookieDomain } : {})
      });
    }

    return response;
  } catch (err) {
    const message =
      err && typeof err === "object" && "name" in err && err.name === "NotAuthorizedException"
        ? "Invalid email or password."
        : "Unable to sign in.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
