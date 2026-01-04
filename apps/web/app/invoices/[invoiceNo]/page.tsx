import InvoiceClient from "./invoice-client";

export default function InvoicePage({ params }: { params: { invoiceNo: string } }) {
  return <InvoiceClient invoiceNo={params.invoiceNo} />;
}
