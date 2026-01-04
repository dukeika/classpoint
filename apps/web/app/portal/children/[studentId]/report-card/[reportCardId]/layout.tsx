export function generateStaticParams() {
  return [{ studentId: "student-demo", reportCardId: "report-demo" }];
}

export default function PortalReportCardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
