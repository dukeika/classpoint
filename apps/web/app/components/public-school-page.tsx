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
    <main className="page">
      <section className="shell">
        <div className="hero fade-up">
          <div>
            <span className="chip">School</span>
            <h1>{school?.name || heroContent.headline || slug}</h1>
            <p>{heroContent.subheadline || "School profile and updates."}</p>
          </div>
          {profile?.logoUrl && (
            <Image
              src={profile.logoUrl}
              alt={`${school?.name || slug} logo`}
              width={72}
              height={72}
              unoptimized
            />
          )}
        </div>

        {loading && <div className="card">Loading school page...</div>}
        {error && <div className="card">{error}</div>}

        {!loading && !error && (
          <>
            <div className="grid fade-up delay-2">
              <div className="card">
                <h3>About</h3>
                <p>{aboutContent.body || "About section not configured yet."}</p>
                <p>
                  {profile?.address ? `${profile.address}, ` : ""}
                  {profile?.city ? `${profile.city}, ` : ""}
                  {profile?.state || ""}
                </p>
                <p>{profile?.contactEmail || ""}</p>
                <p>{profile?.contactPhone || ""}</p>
              </div>
              <div className="card">
                <h3>Announcements</h3>
                <div className="list">
                  {announcements.length === 0 && <p>No announcements yet.</p>}
                  {announcements.map((item) => (
                    <div key={item.id} className="line-item">
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.body}</small>
                      </div>
                      <span>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : ""}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card fade-up delay-3">
              <h3>Calendar</h3>
              <div className="list">
                {events.length === 0 && <p>No events posted.</p>}
                {events.map((event) => (
                  <div key={event.id} className="line-item">
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
            </div>
          </>
        )}
      </section>
    </main>
  );
}
