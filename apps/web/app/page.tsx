import { headers } from "next/headers";
import MarketingLanding from "./components/marketing-landing";
import PublicSchoolPage from "./components/public-school-page";
import StaffLoginLanding from "./components/staff-login-landing";

const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "classpoint.ng";
const rootHosts = new Set([rootDomain, `www.${rootDomain}`]);
const appHost = `app.${rootDomain}`;

const normalizeHost = (host: string) => host.split(":")[0].toLowerCase();

const getRequestHost = () => {
  const headerList = headers();
  const classpointHost = headerList.get("x-classpoint-host");
  const hostHeader = headerList.get("host");
  const forwarded = headerList.get("x-forwarded-host");
  const host = classpointHost || hostHeader || forwarded || "";
  return normalizeHost(host);
};

const getSchoolSlugFromHost = (host: string) => {
  if (!host) return null;
  if (host === "localhost") return null;
  if (host.endsWith(".localhost")) {
    const slug = host.replace(".localhost", "");
    return slug || null;
  }
  if (rootHosts.has(host) || host === appHost) return null;
  if (host.endsWith(`.${rootDomain}`)) {
    return host.slice(0, -(rootDomain.length + 1));
  }
  return null;
};

export default function HomePage() {
  const host = getRequestHost();
  const publicSlug = getSchoolSlugFromHost(host);
  const isRootHost = rootHosts.has(host);
  const isAppHost = host === appHost;

  if (publicSlug) {
    return <PublicSchoolPage slug={publicSlug} />;
  }

  if (isRootHost) {
    return <MarketingLanding />;
  }

  return <StaffLoginLanding isAppHost={isAppHost} rootDomain={rootDomain} />;
}
