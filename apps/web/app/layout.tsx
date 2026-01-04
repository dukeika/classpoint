import "./globals.css";

export const metadata = {
  title: "ClassPoint Parent Portal",
  description: "Invoice view and optional item selection."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
