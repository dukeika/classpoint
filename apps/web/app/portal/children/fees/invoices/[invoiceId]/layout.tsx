export function generateStaticParams() {
  return [{ invoiceId: "inv-demo" }];
}

export default function PortalInvoiceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
