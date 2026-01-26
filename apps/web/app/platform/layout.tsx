/* eslint-disable @next/next/no-html-link-for-pages */
"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

const nav = [
  { label: "Overview", href: "/platform" },
  { label: "Schools", href: "/platform/schools" },
  { label: "Plans & Add-ons", href: "/platform/plans" },
  { label: "Providers", href: "/platform/providers" },
  { label: "Support", href: "/platform/support" },
  { label: "Status", href: "/platform/status" }
];

export default function PlatformLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="dashboard-shell">
      <aside className="platform-nav">
        <div className="platform-nav-header">
          <span className="platform-mark">CP</span>
          <div>
            <strong>ClassPoint HQ</strong>
            <small className="muted">Platform admin</small>
          </div>
        </div>
        <nav className="platform-nav-links">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`platform-nav-link${pathname === item.href ? " active" : ""}`}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
      <main className="platform-content">{children}</main>
    </div>
  );
}
