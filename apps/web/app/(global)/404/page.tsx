import PlaceholderPage from "../../components/placeholder-page";

export default function NotFoundPage() {
  return (
    <PlaceholderPage
      title="Page Not Found"
      description="We could not find the page you were looking for."
      actionLabel="Back to dashboard"
      actionHref="/"
    />
  );
}
