import LoginClient from "./login-client";

type LoginPageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

const toStringParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value || "";

export default function LoginPage({ searchParams }: LoginPageProps) {
  const next = toStringParam(searchParams.next) || "/";
  const email = toStringParam(searchParams.email);
  const school = toStringParam(searchParams.school);
  const variant = next.startsWith("/admin") || next.startsWith("/platform") ? "admin" : "portal";

  return (
    <LoginClient
      initialNext={next}
      initialEmail={email}
      initialSchool={school}
      initialVariant={variant}
    />
  );
}
