export function generateStaticParams() {
  return [{ studentId: "student-demo" }];
}

export default function PortalStudentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
