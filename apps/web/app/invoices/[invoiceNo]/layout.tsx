export function generateStaticParams() {
  return [{ invoiceNo: "INV-DEMO-001" }];
}

export default function InvoiceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
