import { NextResponse, type NextRequest } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";

type SessionResponse = {
  authenticated: boolean;
  expiresAt?: number;
  claims?: {
    sub?: string;
    name?: string;
    email?: string;
    phone_number?: string;
    ["cognito:username"]?: string;
    ["cognito:groups"]?: string[];
    ["custom:schoolId"]?: string;
  };
};

const COGNITO_REGION = process.env.COGNITO_REGION || "us-east-1";
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || "";
const COGNITO_CLIENT_ID =
  process.env.COGNITO_CLIENT_ID || process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "";
const COGNITO_ISSUER =
  process.env.COGNITO_ISSUER ||
  (COGNITO_USER_POOL_ID
    ? `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`
    : "");

const jwks = COGNITO_ISSUER ? createRemoteJWKSet(new URL(`${COGNITO_ISSUER}/.well-known/jwks.json`)) : null;

const verifyIdToken = async (token: string): Promise<Record<string, unknown> | null> => {
  if (!jwks || !COGNITO_ISSUER) return null;
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: COGNITO_ISSUER,
      audience: COGNITO_CLIENT_ID || undefined
    });
    const tokenUse = typeof payload["token_use"] === "string" ? payload["token_use"] : undefined;
    if (tokenUse && tokenUse !== "id") return null;
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
};

export async function GET(request: NextRequest) {
  const idToken = request.cookies.get("cp.id_token")?.value || "";
  if (!idToken) {
    const empty: SessionResponse = { authenticated: false };
    return NextResponse.json(empty);
  }

  const claims = await verifyIdToken(idToken);
  if (!claims) {
    const empty: SessionResponse = { authenticated: false };
    return NextResponse.json(empty, { status: 401 });
  }

  const exp = typeof claims.exp === "number" ? claims.exp : undefined;

  const response: SessionResponse = {
    authenticated: true,
    expiresAt: exp,
    claims: claims as SessionResponse["claims"]
  };
  return NextResponse.json(response);
}
