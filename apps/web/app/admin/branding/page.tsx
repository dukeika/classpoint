"use client";

import { useEffect, useMemo, useState } from "react";
import { graphqlFetch } from "../../components/graphql";
import { useStaffAuth } from "../../components/staff-auth";

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
  schoolId: string;
  type: string;
  contentJson: string;
  sortOrder: number;
  isEnabled: boolean;
};

const normalizeJsonField = (value: unknown) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch (err) {
    return "";
  }
};

export default function BrandingPage() {
  const { token: authToken, schoolId: sessionSchoolId } = useStaffAuth();
  const [schoolIdInput, setSchoolIdInput] = useState("");
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingSections, setLoadingSections] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSection, setSavingSection] = useState(false);
  const [status, setStatus] = useState("");

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [themeJson, setThemeJson] = useState("");

  const [sectionId, setSectionId] = useState("");
  const [sectionType, setSectionType] = useState("HERO");
  const [sectionOrder, setSectionOrder] = useState(0);
  const [sectionEnabled, setSectionEnabled] = useState(true);
  const [sectionContent, setSectionContent] = useState("{\"title\":\"\",\"body\":\"\"}");

  useEffect(() => {
    if (sessionSchoolId) {
      setSchoolIdInput((prev) => (prev ? prev : sessionSchoolId));
    }
  }, [sessionSchoolId]);

  const schoolId = useMemo(() => schoolIdInput.trim(), [schoolIdInput]);

  const loadProfile = async () => {
    if (!authToken || !schoolId) return;
    setLoadingProfile(true);
    setStatus("");
    try {
      const data = await graphqlFetch<{ schoolProfileBySchool: SchoolProfile[] }>(
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
      );
      const nextProfile: SchoolProfile | null = data.schoolProfileBySchool?.[0] || null;
      setProfile(nextProfile);
      setAddress(nextProfile?.address || "");
      setCity(nextProfile?.city || "");
      setStateName(nextProfile?.state || "");
      setContactEmail(nextProfile?.contactEmail || "");
      setContactPhone(nextProfile?.contactPhone || "");
      setLogoUrl(nextProfile?.logoUrl || "");
      setHeroImageUrl(nextProfile?.heroImageUrl || "");
      setThemeJson(normalizeJsonField(nextProfile?.themeJson));
      setStatus(nextProfile ? "Profile loaded." : "No profile found.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load profile.");
    } finally {
      setLoadingProfile(false);
    }
  };

  const saveProfile = async () => {
    if (!authToken || !schoolId) return;
    setSavingProfile(true);
    setStatus("");
    try {
      const input = {
        schoolId,
        address: address || null,
        city: city || null,
        state: stateName || null,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        logoUrl: logoUrl || null,
        heroImageUrl: heroImageUrl || null,
        themeJson: themeJson ? themeJson : null
      };
      if (profile?.id) {
        const data = await graphqlFetch<{ updateSchoolProfile: SchoolProfile }>(
          `mutation UpdateSchoolProfile($input: UpdateSchoolProfileInput!) {
            updateSchoolProfile(input: $input) {
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
          { input: { ...input, id: profile.id } }
        );
        setProfile(data.updateSchoolProfile);
        setStatus("Profile updated.");
      } else {
        const data = await graphqlFetch<{ createSchoolProfile: SchoolProfile }>(
          `mutation CreateSchoolProfile($input: CreateSchoolProfileInput!) {
            createSchoolProfile(input: $input) {
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
          { input }
        );
        setProfile(data.createSchoolProfile);
        setStatus("Profile created.");
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const loadSections = async () => {
    if (!authToken || !schoolId) return;
    setLoadingSections(true);
    setStatus("");
    try {
      const data = await graphqlFetch<{ homeSectionsBySchool: HomeSection[] }>(
        `query HomeSectionsBySchool($schoolId: ID!, $limit: Int) {
          homeSectionsBySchool(schoolId: $schoolId, limit: $limit) {
            id
            schoolId
            type
            contentJson
            sortOrder
            isEnabled
          }
        }`,
        { schoolId, limit: 50 }
      );
      const items: HomeSection[] = data.homeSectionsBySchool || [];
      setSections(items.sort((a, b) => a.sortOrder - b.sortOrder));
      setStatus("Sections loaded.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load sections.");
    } finally {
      setLoadingSections(false);
    }
  };

  const saveSection = async () => {
    if (!authToken || !schoolId || !sectionType) return;
    setSavingSection(true);
    setStatus("");
    try {
      const input = {
        schoolId,
        type: sectionType,
        contentJson: sectionContent,
        sortOrder: Number(sectionOrder) || 0,
        isEnabled: sectionEnabled
      };
      if (sectionId) {
        await graphqlFetch(
          `mutation UpdateSchoolHomePageSection($input: UpdateSchoolHomePageSectionInput!) {
            updateSchoolHomePageSection(input: $input) { id }
          }`,
          { input: { ...input, id: sectionId } }
        );
        setStatus("Section updated.");
      } else {
        await graphqlFetch(
          `mutation CreateSchoolHomePageSection($input: CreateSchoolHomePageSectionInput!) {
            createSchoolHomePageSection(input: $input) { id }
          }`,
          { input }
        );
        setStatus("Section created.");
      }
      await loadSections();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to save section.");
    } finally {
      setSavingSection(false);
    }
  };

  const deleteSection = async (id: string) => {
    if (!authToken || !schoolId || !id) return;
    if (!window.confirm("Delete this section?")) return;
    setSavingSection(true);
    setStatus("");
    try {
      await graphqlFetch(
        `mutation DeleteSchoolHomePageSection($schoolId: ID!, $id: ID!) {
          deleteSchoolHomePageSection(schoolId: $schoolId, id: $id)
        }`,
        { schoolId, id }
      );
      setStatus("Section deleted.");
      setSectionId("");
      await loadSections();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to delete section.");
    } finally {
      setSavingSection(false);
    }
  };

  return (
    <main className="page">
      <section className="shell">
        <div className="hero fade-up">
          <div>
            <span className="chip">Admin</span>
            <h1>Branding & homepage</h1>
            <p>Manage the school profile and public landing sections.</p>
          </div>
        </div>

        <div className="card fade-up delay-1">
          <h3>School profile</h3>
          <div className="form-grid">
            <input
              placeholder="School ID"
              value={schoolIdInput}
              onChange={(event) => setSchoolIdInput(event.target.value)}
            />
            <input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
            <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
            <input placeholder="State" value={stateName} onChange={(e) => setStateName(e.target.value)} />
            <input
              placeholder="Contact email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
            <input
              placeholder="Contact phone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
            <input placeholder="Logo URL" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
            <input
              placeholder="Hero image URL"
              value={heroImageUrl}
              onChange={(e) => setHeroImageUrl(e.target.value)}
            />
            <textarea
              placeholder="Theme JSON (optional)"
              value={themeJson}
              onChange={(e) => setThemeJson(e.target.value)}
              rows={4}
            />
            <div className="grid">
              <button className="button" onClick={loadProfile} disabled={loadingProfile || !schoolId}>
                Load profile
              </button>
              <button className="button" onClick={saveProfile} disabled={savingProfile || !schoolId}>
                {profile ? "Update profile" : "Create profile"}
              </button>
            </div>
            {status && <p>{status}</p>}
          </div>
        </div>

        <div className="card fade-up delay-2">
          <h3>Homepage sections</h3>
          <div className="form-grid">
            <input
              placeholder="Section ID (leave empty to create)"
              value={sectionId}
              onChange={(event) => setSectionId(event.target.value)}
            />
            <input
              placeholder="Type (HERO/ABOUT/ANNOUNCEMENTS/CALENDAR)"
              value={sectionType}
              onChange={(event) => setSectionType(event.target.value)}
            />
            <input
              type="number"
              placeholder="Sort order"
              value={sectionOrder}
              onChange={(event) => setSectionOrder(Number(event.target.value || 0))}
            />
            <label className="line-item" style={{ alignItems: "center" }}>
              <span>Enabled</span>
              <input
                type="checkbox"
                checked={sectionEnabled}
                onChange={(event) => setSectionEnabled(event.target.checked)}
              />
            </label>
            <textarea
              placeholder='Content JSON (e.g. {"title":"About","body":"..."})'
              value={sectionContent}
              onChange={(event) => setSectionContent(event.target.value)}
              rows={5}
            />
            <div className="grid">
              <button className="button" onClick={loadSections} disabled={loadingSections || !schoolId}>
                Load sections
              </button>
              <button className="button" onClick={saveSection} disabled={savingSection || !schoolId}>
                {sectionId ? "Update section" : "Create section"}
              </button>
            </div>
          </div>
          <div className="list" style={{ marginTop: 16 }}>
            {sections.length === 0 && <p>No sections loaded.</p>}
            {sections.map((section) => (
              <div key={section.id} className="line-item">
                <div>
                  <strong>{section.type}</strong>
                  <small>{section.id}</small>
                  <small>Order: {section.sortOrder}</small>
                </div>
                <div className="grid">
                  <span className="badge">{section.isEnabled ? "Enabled" : "Disabled"}</span>
                  <button
                    className="button"
                    type="button"
                    onClick={() => {
                      setSectionId(section.id);
                      setSectionType(section.type);
                      setSectionOrder(section.sortOrder);
                      setSectionEnabled(section.isEnabled);
                      setSectionContent(normalizeJsonField(section.contentJson));
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="button"
                    type="button"
                    onClick={() => deleteSection(section.id)}
                    disabled={savingSection}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

