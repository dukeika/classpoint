"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { decodeToken } from "./auth-utils";
import type { NavSection } from "./navigation";

type DashboardShellProps = {
  sections: NavSection[];
  children: React.ReactNode;
  brandName?: string;
};

const roleLabelForGroups = (groups: string[]) => {
  if (groups.includes("APP_ADMIN")) return "Platform Admin";
  if (groups.includes("SCHOOL_ADMIN")) return "School Admin";
  if (groups.includes("BURSAR")) return "Bursar";
  if (groups.includes("TEACHER")) return "Teacher";
  if (groups.includes("PARENT")) return "Parent";
  return "Staff";
};

const isLikelyId = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const displayNameFromToken = (decoded: Record<string, unknown> | null) => {
  if (!decoded) return "User";
  const given = typeof decoded.given_name === "string" ? decoded.given_name : "";
  const family = typeof decoded.family_name === "string" ? decoded.family_name : "";
  const full = `${given} ${family}`.trim();
  if (full) return full;
  const name = typeof decoded.name === "string" ? decoded.name : "";
  if (name && !isLikelyId(name)) return name;
  const email = typeof decoded.email === "string" ? decoded.email : "";
  if (email) return email;
  return "User";
};

const initialsForName = (name: string) => {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "CP";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export default function DashboardShell({ sections, children, brandName = "ClassPoint" }: DashboardShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [profile, setProfile] = useState({
    name: "User",
    role: "Staff",
    groups: [] as string[]
  });

  useEffect(() => {
    const stored = window.localStorage.getItem("cp.sidebar");
    setCollapsed(stored === "collapsed");
    const storedFavorites = window.localStorage.getItem("cp.favorites");
    if (storedFavorites) {
      try {
        const parsed = JSON.parse(storedFavorites);
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
        }
      } catch (err) {
        setFavorites([]);
      }
    }
    const decoded = decodeToken("session");
    const groups = Array.isArray(decoded?.["cognito:groups"]) ? decoded?.["cognito:groups"] : [];
    const name = displayNameFromToken(decoded);
    setProfile({
      name,
      role: roleLabelForGroups(groups),
      groups
    });
  }, []);

  useEffect(() => {
    window.localStorage.setItem("cp.sidebar", collapsed ? "collapsed" : "expanded");
  }, [collapsed]);

  useEffect(() => {
    window.localStorage.setItem("cp.favorites", JSON.stringify(favorites));
  }, [favorites]);

  const allowedSections = useMemo(() => {
    if (!profile.groups.length) return sections;
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => item.roles.some((role) => profile.groups.includes(role)))
      }))
      .filter((section) => section.items.length > 0);
  }, [profile.groups, sections]);

  const flatItems = useMemo(() => allowedSections.flatMap((section) => section.items), [allowedSections]);

  const favoriteItems = useMemo(
    () => flatItems.filter((item) => favorites.includes(item.href)).slice(0, 6),
    [favorites, flatItems]
  );

  const toggleFavorite = (href: string) => {
    setFavorites((prev) => {
      if (prev.includes(href)) {
        return prev.filter((item) => item !== href);
      }
      if (prev.length >= 6) return prev;
      return [...prev, href];
    });
  };

  return (
    <div className={`dashboard-shell ${collapsed ? "is-collapsed" : ""} ${drawerOpen ? "drawer-open" : ""}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">{brandName.slice(0, 2).toUpperCase()}</div>
          <div className="brand-meta">
            <strong>{brandName}</strong>
            <span>{profile.role}</span>
          </div>
        </div>

        {favoriteItems.length > 0 && (
          <div className="nav-section">
            <div className="nav-title">Favorites</div>
            <div className="nav-list">
              {favoriteItems.map((item) => (
                <Link key={item.href} className={`nav-item ${pathname === item.href ? "active" : ""}`} href={item.href}>
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {allowedSections.map((section) => (
          <div key={section.title} className="nav-section">
            <div className="nav-title">{section.title}</div>
            <div className="nav-list">
              {section.items.map((item) => (
                <div key={item.href} className="nav-row">
                  <Link className={`nav-item ${pathname === item.href ? "active" : ""}`} href={item.href}>
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </Link>
                  <button
                    className={`nav-fav ${favorites.includes(item.href) ? "pinned" : ""}`}
                    type="button"
                    onClick={() => toggleFavorite(item.href)}
                    aria-label={`Toggle favorite for ${item.label}`}
                  >
                    *
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="sidebar-footer">
          <Link className="nav-item" href="/help">
            <span className="nav-icon">?</span>
            <span className="nav-label">Help</span>
          </Link>
          <Link className="nav-item" href="/help/contact-support">
            <span className="nav-icon">S</span>
            <span className="nav-label">Support</span>
          </Link>
        </div>
      </aside>

      <div className="content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-only"
              type="button"
              onClick={() => setDrawerOpen((prev) => !prev)}
              aria-label="Toggle navigation"
            >
              ==
            </button>
            <button
              className="icon-button desktop-only"
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              aria-label="Collapse sidebar"
            >
              {collapsed ? ">>" : "<<"}
            </button>
            <div className="search">
              <input placeholder="Search students, invoices, payments..." />
            </div>
          </div>
          <div className="topbar-right">
            <button className="icon-button" type="button" aria-label="Notifications">
              !
              <span className="dot" />
            </button>
            <button className="icon-button" type="button" aria-label="Quick actions">
              +
            </button>
            <div className="profile">
              <div className="avatar">{initialsForName(profile.name)}</div>
              <div className="profile-meta">
                <strong>{profile.name}</strong>
                <span>{profile.role}</span>
              </div>
            </div>
          </div>
        </header>
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
