export function generateStaticParams() {
  return [{ ticketId: "ticket-demo" }];
}

export default function AdminSupportTicketLayout({ children }: { children: React.ReactNode }) {
  return children;
}
