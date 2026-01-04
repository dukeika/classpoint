export function generateStaticParams() {
  return [{ classGroupId: "class-demo", date: "2024-01-01" }];
}

export default function TeacherAttendanceHistoryDateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
