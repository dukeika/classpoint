import PlaceholderPage from "../../components/placeholder-page";

export default function ForbiddenPage() {
  return (
    <PlaceholderPage
      title="Access Denied"
      description="You do not have permission to view this page. Request access from your school admin."
      actionLabel="Back to dashboard"
      actionHref="/"
    />
  );
}
