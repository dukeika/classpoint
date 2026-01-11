import PublicSchoolPage from "../../components/public-school-page";

type TenantLandingPageProps = {
  params: {
    slug: string;
  };
};

export default function TenantLandingPage({ params }: TenantLandingPageProps) {
  return <PublicSchoolPage slug={params.slug} />;
}
