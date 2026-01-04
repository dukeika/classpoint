export type TokenPayload = {
  sub?: string;
  name?: string;
  email?: string;
  phone_number?: string;
  ["cognito:username"]?: string;
  ["cognito:groups"]?: string[];
  ["custom:schoolId"]?: string;
  schoolId?: string;
};

const readSessionCookie = (): TokenPayload | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )cp\.session=([^;]+)/);
  if (!match) return null;
  try {
    const raw = decodeURIComponent(match[1]);
    const normalized = raw.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

export const decodeToken = (token: string): TokenPayload | null => {
  if (!token || token.split(".").length < 2) {
    return readSessionCookie();
  }
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    return JSON.parse(atob(padded));
  } catch {
    return readSessionCookie();
  }
};

export const decodeSchoolId = (token: string) => {
  const decoded = decodeToken(token);
  return decoded?.["custom:schoolId"] || decoded?.schoolId || "";
};

export const decodeUserId = (token: string) => {
  const decoded = decodeToken(token);
  return decoded?.sub || "";
};
