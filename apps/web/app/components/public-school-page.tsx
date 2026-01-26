"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type School = {
  id: string;
  name: string;
  slug: string;
  status?: string | null;
};

type SchoolProfile = {
  id: string;
  schoolId: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  logoUrl?: string | null;
  heroImageUrl?: string | null;
  themeJson?: string | null;
};

type HomeSection = {
  id: string;
  type: string;
  contentJson: string;
  sortOrder: number;
  isEnabled: boolean;
};

type Announcement = {
  id: string;
  title: string;
  body: string;
  publishedAt?: string | null;
};

type CalendarEvent = {
  id: string;
  title: string;
  startAt?: string | null;
  endAt?: string | null;
};

const graphqlFetch = async (query: string, variables: Record<string, unknown>) => {
  const res = await fetch("/api/public-graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query, variables })
  });
  const json = await res.json();
  if (!res.ok || json.errors?.length) {
    throw new Error(json.errors?.[0]?.message || "Request failed.");
  }
  return json.data;
};

const parseJsonContent = (value: string) => {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch (_err) {
    return {};
  }
};

export default function PublicSchoolPage({ slug }: { slug: string }) {
  const isDemo = slug === "demo";
  const [school, setSchool] = useState<School | null>(null);
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSchool = async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const schoolData = await graphqlFetch(
        `query SchoolBySlug($slug: String!) {
          schoolBySlug(slug: $slug) {
            id
            name
            slug
            status
          }
        }`,
        { slug }
      );
      const nextSchool = schoolData.schoolBySlug || null;
      setSchool(nextSchool);
      if (!nextSchool?.id) {
        setError("School not found.");
        return;
      }

      const schoolId = nextSchool.id;
      const [profileData, sectionData, announcementsData, eventsData] = await Promise.all([
        graphqlFetch(
          `query SchoolProfileBySchool($schoolId: ID!, $limit: Int) {
            schoolProfileBySchool(schoolId: $schoolId, limit: $limit) {
              id
              schoolId
              address
              city
              state
              contactEmail
              contactPhone
              logoUrl
              heroImageUrl
              themeJson
            }
          }`,
          { schoolId, limit: 1 }
        ),
        graphqlFetch(
          `query HomeSectionsBySchool($schoolId: ID!, $limit: Int) {
            homeSectionsBySchool(schoolId: $schoolId, limit: $limit) {
              id
              type
              contentJson
              sortOrder
              isEnabled
            }
          }`,
          { schoolId, limit: 10 }
        ),
        graphqlFetch(
          `query AnnouncementsBySchool($schoolId: ID!, $limit: Int) {
            announcementsBySchool(schoolId: $schoolId, limit: $limit) {
              id
              title
              body
              publishedAt
            }
          }`,
          { schoolId, limit: 5 }
        ),
        graphqlFetch(
          `query EventsBySchool($schoolId: ID!, $limit: Int) {
            eventsBySchool(schoolId: $schoolId, limit: $limit) {
              id
              title
              startAt
              endAt
            }
          }`,
          { schoolId, limit: 5 }
        )
      ]);

      setProfile(profileData.schoolProfileBySchool?.[0] || null);
      const nextSections: HomeSection[] = sectionData.homeSectionsBySchool || [];
      setSections(nextSections.filter((section) => section.isEnabled).sort((a, b) => a.sortOrder - b.sortOrder));
      setAnnouncements(announcementsData.announcementsBySchool || []);
      setEvents(eventsData.eventsBySchool || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load school page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      loadSchool();
    }
  }, [slug]);

  const hero = sections.find((section) => section.type === "HERO");
  const about = sections.find((section) => section.type === "ABOUT");

  const heroContent = hero ? parseJsonContent(hero.contentJson) : {};
  const aboutContent = about ? parseJsonContent(about.contentJson) : {};

  return (
    <main className="school-page">
      <header className="school-nav">
        <div className="school-logo">
          {profile?.logoUrl ? (
            <Image
              src={profile.logoUrl}
              alt={`${school?.name || slug} logo`}
              width={46}
              height={46}
              unoptimized
            />
          ) : (
            <span className="school-mark">{(school?.name || slug).slice(0, 2).toUpperCase()}</span>
          )}
          <div>
            <strong>{school?.name || heroContent.headline || slug}</strong>
            <span>{profile?.city || "Nigeria"}</span>
          </div>
        </div>
        <div className="school-nav-actions">
          <a className="ghost-button" href="/login?next=/portal">
            Parent portal
          </a>
          <a className="ghost-button" href="/login?next=/teacher">
            Teacher sign in
          </a>
          <a className="button" href="/login?next=/admin">
            Staff sign in
          </a>
          <a className="ghost-button" href={`mailto:${profile?.contactEmail || "support@classpoint.ng"}`}>
            Contact support
          </a>
        </div>
      </header>

      <section className="school-hero">
        <div className="school-hero-copy">
          <span className="chip">School overview</span>
          <h1>{heroContent.headline || school?.name || slug}</h1>
          <p>
            {heroContent.subheadline ||
              (isDemo
                ? "This is the demo campus. Parents use the Parent portal; staff use Staff sign in."
                : "A modern learning community with transparent communication.")}
          </p>
          <div className="school-hero-meta">
            <span className="school-pill">Admissions open</span>
            <span className="school-pill">Term updates</span>
            <span className="school-pill">Parent support</span>
          </div>
          <div className="role-shortcuts">
            <div>
              <strong>Parent portal</strong>
              <p className="muted">View fees, results, messages, and support.</p>
              <a className="ghost-button" href="/login?next=/portal">
                Open parent portal
              </a>
            </div>
            <div>
              <strong>Teacher sign in</strong>
              <p className="muted">Access attendance, classes, and communications.</p>
              <a className="ghost-button" href="/login?next=/teacher">
                Teacher sign in
              </a>
            </div>
            <div>
              <strong>Admin / staff</strong>
              <p className="muted">Fees, collections, imports, and operations.</p>
              <a className="button" href="/login?next=/admin">
                Open staff dashboard
              </a>
            </div>
          </div>
        </div>
        <div className="school-hero-media">
          {profile?.heroImageUrl ? (
            <Image
              src={profile.heroImageUrl}
              alt={`${school?.name || slug} campus`}
              width={520}
              height={360}
              unoptimized
            />
          ) : (
            <div className="school-hero-placeholder">
              <h3>ClassPoint Public Page</h3>
              <p>Upload a hero image in Branding to showcase your campus.</p>
            </div>
          )}
        </div>
      </section>

      {loading && <div className="school-card">Loading school page...</div>}
      {error && <div className="school-card">{error}</div>}

      {!loading && !error && (
        <>
          <section className="school-grid">
            <div className="school-card">
              <h3>About {school?.name || slug}</h3>
              <p>
                {aboutContent.body ||
                  (isDemo
                    ? "Demo Academy is a sample school to explore ClassPoint. Use the Parent portal for families and Staff sign in for admins/teachers."
                    : "About section not configured yet.")}
              </p>
              <div className="school-contact">
                <div>
                  <strong>Location</strong>
                  <span>
                    {profile?.address ? `${profile.address}, ` : ""}
                    {profile?.city ? `${profile.city}, ` : ""}
                    {profile?.state || ""}
                  </span>
                </div>
                <div>
                  <strong>Email</strong>
                  <span>{profile?.contactEmail || "Not provided"}</span>
                </div>
                <div>
                  <strong>Phone</strong>
                  <span>{profile?.contactPhone || "Not provided"}</span>
                </div>
                <div className="school-contact-actions">
                  <a
                    className="ghost-button"
                    href={`mailto:${profile?.contactEmail || "support@classpoint.ng"}?subject=${encodeURIComponent(`Hello ${school?.name || slug}`)}`}
                  >
                    Contact school
                  </a>
                </div>
              </div>
            </div>

            <div className="school-card">
              <h3>Latest announcements</h3>
              <div className="school-list">
                {announcements.length === 0 && <p>No announcements yet.</p>}
                {announcements.map((item) => (
                  <div key={item.id} className="school-list-item">
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.body}</small>
                    </div>
                    <span>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : ""}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="school-card school-calendar">
            <div className="school-card-header">
              <h3>Upcoming events</h3>
              <span className="muted">Academic calendar highlights</span>
            </div>
            <div className="school-list">
              {events.length === 0 && <p>No events posted.</p>}
              {events.map((event) => (
                <div key={event.id} className="school-list-item">
                  <div>
                    <strong>{event.title}</strong>
                    <small>
                      {event.startAt ? new Date(event.startAt).toLocaleDateString() : ""}{" "}
                      {event.endAt ? `- ${new Date(event.endAt).toLocaleDateString()}` : ""}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
