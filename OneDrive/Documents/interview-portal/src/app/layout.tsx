//src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
// Note: Amplify is now configured in AuthContext using aws-exports.js

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ProRecruit - Professional Recruitment Platform",
  description: "Streamline your hiring process with ProRecruit's comprehensive recruitment and interview management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
