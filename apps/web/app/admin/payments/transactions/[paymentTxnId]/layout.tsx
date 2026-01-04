export function generateStaticParams() {
  return [{ paymentTxnId: "txn-demo" }];
}

export default function PaymentTransactionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
