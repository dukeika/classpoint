export function generateStaticParams() {
  return [{ ticketId: "ticket-demo" }];
}

export default function PortalSupportTicketLayout({ children }: { children: React.ReactNode }) {
  return children;
}
