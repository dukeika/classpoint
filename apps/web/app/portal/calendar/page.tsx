"use client";

import { useEffect, useState } from "react";
import { graphqlFetch } from "../components/graphql";
import { usePortalAuth } from "../components/portal-auth";

type CalendarEvent = {
  id: string;
  title: string;
  description?: string | null;
  startAt?: string | null;
  endAt?: string | null;
};

export default function PortalCalendarPage() {
  const { token: authToken, schoolId } = usePortalAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      if (!authToken || !schoolId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await graphqlFetch<{ eventsBySchool: CalendarEvent[] }>(
          `query EventsBySchool($schoolId: ID!, $limit: Int) {
            eventsBySchool(schoolId: $schoolId, limit: $limit) {
              id
              title
              description
              startAt
              endAt
            }
          }`,
          { schoolId, limit: 20 }
        );
        setEvents(data.eventsBySchool || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load events.");
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, [authToken, schoolId]);

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Portal / Calendar</div>
          <h1>Calendar</h1>
          <p className="muted">Upcoming school events and important dates.</p>
        </div>
      </div>

      <div className="card">
        {loading && <p>Loading calendar...</p>}
        {error && <p>{error}</p>}
        {!loading && !error && events.length === 0 && (
          <div className="list-cards">
            <div className="list-card">
              <strong>No events scheduled</strong>
              <span>School calendar updates will appear here.</span>
            </div>
          </div>
        )}
        <div className="list-cards">
          {events.map((event) => (
            <div key={event.id} className="list-card">
              <strong>{event.title}</strong>
              <span>{event.description || "School event"}</span>
              <span>
                {event.startAt ? new Date(event.startAt).toLocaleDateString() : ""}{" "}
                {event.endAt ? `- ${new Date(event.endAt).toLocaleDateString()}` : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
