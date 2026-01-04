"use client";

import { useEffect, useMemo, useState } from "react";
import { decodeSchoolId, decodeToken } from "../../components/auth-utils";
import { graphqlFetch } from "../../components/graphql";
import { useStaffAuth } from "../../components/staff-auth";

type User = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  userType?: string | null;
  status?: string | null;
};

type Role = {
  id: string;
  name: string;
  isSystemRole: boolean;
};

type UserRole = {
  id: string;
  userId: string;
  roleId: string;
  schoolId: string;
};

type ClassGroup = {
  id: string;
  displayName: string;
  classYearId: string;
  classArmId?: string | null;
  classTeacherUserId?: string | null;
};

type Subject = {
  id: string;
  name: string;
  code?: string | null;
  levelType?: string | null;
};

const welcomeTasks = [
  "Share login credentials",
  "Confirm role assignment",
  "Assign classes/subjects (teachers)",
  "Review attendance workflow",
  "Review messaging expectations"
];

export default function StaffPage() {
  const { token } = useStaffAuth();
  const schoolId = decodeSchoolId(token);
  const [staff, setStaff] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("STAFF");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingUserRoles, setLoadingUserRoles] = useState(false);
  const [loadingClassGroups, setLoadingClassGroups] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [welcomeTaskState, setWelcomeTaskState] = useState<Record<string, boolean>>({});
  const [plannedSubjects, setPlannedSubjects] = useState<Record<string, { planned: boolean; note?: string }>>({});
  const [accessToken, setAccessToken] = useState("");
  const [createStatus, setCreateStatus] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; tempPassword: string } | null>(null);
  const [createForm, setCreateForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "SCHOOL_ADMIN",
    schoolId: ""
  });

  const tokenDetails = decodeToken(token);
  const staffGroups = Array.isArray(tokenDetails?.["cognito:groups"])
    ? tokenDetails?.["cognito:groups"]
    : [];
  const isAppAdmin = staffGroups.includes("APP_ADMIN");
  const adminApiBase = process.env.NEXT_PUBLIC_ADMIN_API_URL || "";

  const selectedUser = staff.find((user) => user.id === selectedUserId) || null;
  const staffById = useMemo(() => {
    return staff.reduce<Record<string, User>>((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});
  }, [staff]);

  const filteredStaff = useMemo(() => {
    return staff;
  }, [staff]);

  const loadStaff = async () => {
    if (!token || !schoolId) return;
    setLoading(true);
    setStatus("");
    try {
      const data = await graphqlFetch<{ usersBySchool: User[] }>(
        `query UsersBySchool($schoolId: ID!, $userType: UserType!, $limit: Int) {
          usersBySchool(schoolId: $schoolId, userType: $userType, limit: $limit) {
            id
            name
            email
            phone
            userType
            status
          }
        }`,
        { schoolId, userType: userTypeFilter, limit: 100 },
        token
      );
      setStaff(data.usersBySchool || []);
      setStatus("Staff loaded.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load staff.");
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    if (!token || !schoolId) return;
    setLoadingRoles(true);
    setStatus("");
    try {
      const data = await graphqlFetch<{ rolesBySchool: Role[] }>(
        `query RolesBySchool($schoolId: ID!, $limit: Int) {
          rolesBySchool(schoolId: $schoolId, limit: $limit) {
            id
            name
            isSystemRole
          }
        }`,
        { schoolId, limit: 50 },
        token
      );
      setRoles(data.rolesBySchool || []);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load roles.");
    } finally {
      setLoadingRoles(false);
    }
  };

  const loadUserRoles = async (userId: string) => {
    if (!token || !userId) return;
    setLoadingUserRoles(true);
    setStatus("");
    try {
      const data = await graphqlFetch<{ userRolesByUser: UserRole[] }>(
        `query UserRolesByUser($userId: ID!, $limit: Int) {
          userRolesByUser(userId: $userId, limit: $limit) {
            id
            userId
            roleId
            schoolId
          }
        }`,
        { userId, limit: 50 },
        token
      );
      setUserRoles(data.userRolesByUser || []);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load user roles.");
    } finally {
      setLoadingUserRoles(false);
    }
  };

  const loadClassGroups = async () => {
    if (!token || !schoolId) return;
    setLoadingClassGroups(true);
    setStatus("");
    try {
      const data = await graphqlFetch<{ classGroupsBySchool: ClassGroup[] }>(
        `query ClassGroupsBySchool($schoolId: ID!, $limit: Int) {
          classGroupsBySchool(schoolId: $schoolId, limit: $limit) {
            id
            displayName
            classYearId
            classArmId
            classTeacherUserId
          }
        }`,
        { schoolId, limit: 200 },
        token
      );
      setClassGroups(data.classGroupsBySchool || []);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load class groups.");
    } finally {
      setLoadingClassGroups(false);
    }
  };

  const loadSubjects = async () => {
    if (!token || !schoolId) return;
    setLoadingSubjects(true);
    setStatus("");
    try {
      const data = await graphqlFetch<{ subjectsBySchool: Subject[] }>(
        `query SubjectsBySchool($schoolId: ID!, $limit: Int) {
          subjectsBySchool(schoolId: $schoolId, limit: $limit) {
            id
            name
            code
            levelType
          }
        }`,
        { schoolId, limit: 200 },
        token
      );
      setSubjects(data.subjectsBySchool || []);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load subjects.");
    } finally {
      setLoadingSubjects(false);
    }
  };

  const updateClassGroupTeacher = async (group: ClassGroup, nextTeacherId: string | null) => {
    if (!token || !schoolId) return;
    setStatus("");
    try {
      await graphqlFetch(
        `mutation UpdateClassGroup($input: UpdateClassGroupInput!) {
          updateClassGroup(input: $input) { id }
        }`,
        {
          input: {
            schoolId,
            id: group.id,
            classYearId: group.classYearId,
            classArmId: group.classArmId || null,
            displayName: group.displayName,
            classTeacherUserId: nextTeacherId
          }
        },
        token
      );
      await loadClassGroups();
      setStatus("Class ownership updated.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to update class ownership.");
    }
  };

  const assignRole = async (roleId: string) => {
    if (!token || !schoolId || !selectedUserId) return;
    try {
      await graphqlFetch(
        `mutation AssignUserRole($input: AssignUserRoleInput!) {
          assignUserRole(input: $input) { id }
        }`,
        { input: { schoolId, userId: selectedUserId, roleId } },
        token
      );
      await loadUserRoles(selectedUserId);
      setStatus("Role assigned.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to assign role.");
    }
  };

  const removeRole = async (roleId: string) => {
    if (!token || !schoolId || !selectedUserId) return;
    try {
      await graphqlFetch(
        `mutation RemoveUserRole($input: RemoveUserRoleInput!) {
          removeUserRole(input: $input)
        }`,
        { input: { schoolId, userId: selectedUserId, roleId } },
        token
      );
      await loadUserRoles(selectedUserId);
      setStatus("Role removed.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to remove role.");
    }
  };

  useEffect(() => {
    loadStaff();
    loadRoles();
    loadClassGroups();
    loadSubjects();
  }, [token, schoolId, userTypeFilter]);

  useEffect(() => {
    const saved = window.localStorage.getItem("cp.accessToken") || "";
    setAccessToken(saved);
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadUserRoles(selectedUserId);
      const saved = window.localStorage.getItem(`cp.staff.welcome.${selectedUserId}`);
      if (saved) {
        try {
          setWelcomeTaskState(JSON.parse(saved));
        } catch (_err) {
          setWelcomeTaskState({});
        }
      } else {
        setWelcomeTaskState({});
      }
      const planned = window.localStorage.getItem(`cp.staff.subjectPlan.${selectedUserId}`);
      if (planned) {
        try {
          const parsed = JSON.parse(planned) as Record<string, boolean | { planned: boolean; note?: string }>;
          const normalized = Object.entries(parsed).reduce<Record<string, { planned: boolean; note?: string }>>(
            (acc, [key, value]) => {
              if (typeof value === "boolean") {
                acc[key] = { planned: value };
              } else if (value && typeof value === "object") {
                acc[key] = { planned: Boolean(value.planned), note: value.note || "" };
              }
              return acc;
            },
            {}
          );
          setPlannedSubjects(normalized);
        } catch (_err) {
          setPlannedSubjects({});
        }
      } else {
        setPlannedSubjects({});
      }
    }
  }, [selectedUserId]);

  const toggleWelcomeTask = (task: string) => {
    if (!selectedUserId) return;
    const next = { ...welcomeTaskState, [task]: !welcomeTaskState[task] };
    setWelcomeTaskState(next);
    window.localStorage.setItem(`cp.staff.welcome.${selectedUserId}`, JSON.stringify(next));
  };

  const togglePlannedSubject = (subjectId: string) => {
    if (!selectedUserId) return;
    const current = plannedSubjects[subjectId];
    const next = {
      ...plannedSubjects,
      [subjectId]: { planned: !current?.planned, note: current?.note || "" }
    };
    setPlannedSubjects(next);
    window.localStorage.setItem(`cp.staff.subjectPlan.${selectedUserId}`, JSON.stringify(next));
  };

  const updatePlannedSubjectNote = (subjectId: string, note: string) => {
    if (!selectedUserId) return;
    const current = plannedSubjects[subjectId];
    const next = {
      ...plannedSubjects,
      [subjectId]: { planned: current?.planned ?? false, note }
    };
    setPlannedSubjects(next);
    window.localStorage.setItem(`cp.staff.subjectPlan.${selectedUserId}`, JSON.stringify(next));
  };

  const clearPlannedSubjects = () => {
    if (!selectedUserId) return;
    setPlannedSubjects({});
    window.localStorage.setItem(`cp.staff.subjectPlan.${selectedUserId}`, JSON.stringify({}));
  };

  const assignedRoleIds = new Set(userRoles.map((role) => role.roleId));
  const assignedRoles = roles.filter((role) => assignedRoleIds.has(role.id));
  const assignedClassGroups = classGroups.filter((group) => group.classTeacherUserId === selectedUserId);
  const plannedSubjectCount = Object.values(plannedSubjects).filter((entry) => entry?.planned).length;
  const plannedSubjectList = subjects.filter((subject) => plannedSubjects[subject.id]?.planned);
  const plannedSubjectPreview = plannedSubjectList.slice(0, 6);
  const plannedSubjectOverflow = Math.max(0, plannedSubjectList.length - plannedSubjectPreview.length);
  const plannedSubjectOverflowTitle =
    plannedSubjectOverflow > 0
      ? plannedSubjectList
          .slice(plannedSubjectPreview.length)
          .map((subject) => {
            const note = plannedSubjects[subject.id]?.note ? ` — ${plannedSubjects[subject.id]?.note}` : "";
            return `${subject.name}${note}`;
          })
          .join(", ")
      : "";

  const copyOnboardingSummary = async () => {
    if (!selectedUser) return;
    const lines = [
      `Staff onboarding summary: ${selectedUser.name}`,
      `Contact: ${selectedUser.email || selectedUser.phone || "n/a"}`,
      `User type: ${selectedUser.userType || "STAFF"}`,
      `Assigned roles: ${assignedRoles.map((role) => role.name).join(", ") || "none"}`,
      `Class ownership: ${assignedClassGroups.map((group) => group.displayName).join(", ") || "none"}`,
      `Planned subjects: ${
        subjects
          .filter((subject) => plannedSubjects[subject.id]?.planned)
          .map((subject) => subject.name)
          .join(", ") || "none"
      }`,
      "",
      "Welcome tasks:",
      ...welcomeTasks.map((task) => `- ${task}: ${welcomeTaskState[task] ? "Done" : "Pending"}`)
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setStatus("Onboarding summary copied.");
    } catch (_err) {
      setStatus("Unable to copy onboarding summary.");
    }
  };

  const copyPlannedSubjects = async () => {
    if (!selectedUser) return;
    const planned = subjects.filter((subject) => plannedSubjects[subject.id]?.planned);
    const lines = [
      `Planned subjects for ${selectedUser.name}`,
      ...planned.map((subject) => {
        const note = plannedSubjects[subject.id]?.note || "";
        return `- ${subject.name}${subject.code ? ` (${subject.code})` : ""}${note ? ` — ${note}` : ""}`;
      })
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setStatus("Planned subjects copied.");
    } catch (_err) {
      setStatus("Unable to copy planned subjects.");
    }
  };

  const exportPlannedSubjectsCsv = () => {
    if (!selectedUser) return;
    const header = ["Subject", "Code", "Level", "Planned", "Note"];
    const rows = subjects.map((subject) => [
      subject.name,
      subject.code || "",
      subject.levelType || "",
      plannedSubjects[subject.id]?.planned ? "Yes" : "No",
      plannedSubjects[subject.id]?.note || ""
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, "\"\"")}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `planned-subjects-${selectedUser.name.replace(/\s+/g, "-").toLowerCase()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const createUser = async () => {
    if (!accessToken) {
      setCreateStatus("Access token missing. Sign in again to continue.");
      return;
    }
    if (!adminApiBase) {
      setCreateStatus("Admin API endpoint missing. Set NEXT_PUBLIC_ADMIN_API_URL.");
      return;
    }
    if (!createForm.email || !createForm.firstName || !createForm.lastName || !createForm.role) {
      setCreateStatus("Email, first name, last name, and role are required.");
      return;
    }

    setCreateLoading(true);
    setCreateStatus("");
    setCreatedCredentials(null);
    try {
      const payload: Record<string, string> = {
        email: createForm.email,
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        role: createForm.role
      };
      if (createForm.phone) {
        payload.phone = createForm.phone;
      }
      if (isAppAdmin && createForm.schoolId) {
        payload.schoolId = createForm.schoolId;
      }

      const res = await fetch(`${adminApiBase}/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create user.");
      }
      setCreatedCredentials({
        email: data.username || createForm.email,
        tempPassword: data.tempPassword
      });
      setCreateStatus("User created. Share the temporary password.");
      setCreateForm((prev) => ({ ...prev, email: "", firstName: "", lastName: "", phone: "" }));
      await loadStaff();
    } catch (err) {
      setCreateStatus(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setCreateLoading(false);
    }
  };

  const copyCredentials = async () => {
    if (!createdCredentials) return;
    const text = `Email: ${createdCredentials.email}\nTemporary password: ${createdCredentials.tempPassword}`;
    try {
      await navigator.clipboard.writeText(text);
      setCreateStatus("Credentials copied.");
    } catch (_err) {
      setCreateStatus("Unable to copy credentials.");
    }
  };

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Admin / Staff</div>
          <h1>Staff directory</h1>
          <p className="muted">Invite staff, assign roles, and track onboarding readiness.</p>
        </div>
        <a className="button" href="/admin/setup/staff-roles">
          Invite staff
        </a>
      </div>

      <div className="card">
        <div className="quick-actions">
          <select value={userTypeFilter} onChange={(event) => setUserTypeFilter(event.target.value)}>
            <option value="STAFF">Staff</option>
            <option value="SCHOOL_ADMIN">School Admins</option>
          </select>
          <button className="chip" type="button" onClick={loadStaff} disabled={loading || !schoolId}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
        {status && <p className="muted">{status}</p>}
      </div>

      <div className="grid">
        <div className="card">
          <h3>Create staff account</h3>
          <div className="form-grid">
            <input
              type="email"
              placeholder="Email address"
              value={createForm.email}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
            <div className="grid">
              <input
                type="text"
                placeholder="First name"
                value={createForm.firstName}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, firstName: event.target.value }))}
                required
              />
              <input
                type="text"
                placeholder="Last name"
                value={createForm.lastName}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, lastName: event.target.value }))}
                required
              />
            </div>
            <input
              type="tel"
              placeholder="Phone number (optional)"
              value={createForm.phone}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, phone: event.target.value }))}
            />
            <select
              value={createForm.role}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, role: event.target.value }))}
            >
              <option value="SCHOOL_ADMIN">School Admin</option>
              <option value="BURSAR">Bursar</option>
              <option value="TEACHER">Teacher</option>
              {isAppAdmin && <option value="APP_ADMIN">App Admin</option>}
            </select>
            {isAppAdmin && (
              <input
                type="text"
                placeholder="School ID override (optional)"
                value={createForm.schoolId}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, schoolId: event.target.value }))}
              />
            )}
            <button className="button" type="button" onClick={createUser} disabled={createLoading}>
              {createLoading ? "Creating..." : "Create user"}
            </button>
            {createdCredentials && (
              <div className="line-item">
                <div>
                  <strong>{createdCredentials.email}</strong>
                  <small>Temporary password: {createdCredentials.tempPassword}</small>
                </div>
                <button className="ghost-button" type="button" onClick={copyCredentials}>
                  Copy
                </button>
              </div>
            )}
            {createStatus && <p className="muted">{createStatus}</p>}
            {!accessToken && <p className="muted">Access token missing. Sign in again to create users.</p>}
          </div>
        </div>

        <div className="card">
          <h3>Staff list</h3>
          <div className="desktop-only">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((member) => (
                    <tr key={member.id} onClick={() => setSelectedUserId(member.id)}>
                      <td>{member.name}</td>
                      <td>{member.email || member.phone || "No contact"}</td>
                      <td>
                        <span className="status-pill">{member.status || "INVITED"}</span>
                      </td>
                    </tr>
                  ))}
                  {filteredStaff.length === 0 && (
                    <tr>
                      <td colSpan={3}>No staff loaded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mobile-only list-cards">
            {filteredStaff.map((member) => (
              <button
                key={member.id}
                className="list-card"
                type="button"
                onClick={() => setSelectedUserId(member.id)}
              >
                <strong>{member.name}</strong>
                <span>{member.email || member.phone || "No contact"}</span>
                <span className="status-pill">{member.status || "INVITED"}</span>
              </button>
            ))}
            {filteredStaff.length === 0 && <p>No staff loaded.</p>}
          </div>
        </div>

        <div className="card">
          <h3>Role assignment</h3>
          {!selectedUser && <p className="muted">Select a staff member to manage roles.</p>}
          {selectedUser && (
            <div className="list">
              <div className="line-item">
                <div>
                  <strong>{selectedUser.name}</strong>
                  <small>{selectedUser.email || selectedUser.phone || "No contact"}</small>
                </div>
                <span className="badge">{selectedUser.userType || "STAFF"}</span>
              </div>
              {loadingRoles && <p className="muted">Loading roles...</p>}
              {!loadingRoles &&
                roles.map((role) => (
                  <label key={role.id} className="line-item">
                    <div>
                      <strong>{role.name}</strong>
                      <small>{role.isSystemRole ? "System role" : "Custom role"}</small>
                    </div>
                    <input
                      type="checkbox"
                      checked={assignedRoleIds.has(role.id)}
                      onChange={() =>
                        assignedRoleIds.has(role.id) ? removeRole(role.id) : assignRole(role.id)
                      }
                      disabled={loadingUserRoles}
                    />
                  </label>
                ))}
              {!loadingRoles && roles.length === 0 && <p className="muted">No roles found.</p>}
            </div>
          )}
        </div>

        <div className="card">
          <h3>Class ownership</h3>
          {!selectedUser && <p className="muted">Select a staff member to assign class ownership.</p>}
          {selectedUser && (
            <div className="list">
              {loadingClassGroups && <p className="muted">Loading class groups...</p>}
              {!loadingClassGroups &&
                classGroups.map((group) => (
                  <label key={group.id} className="line-item">
                    <div>
                      <strong>{group.displayName}</strong>
                      <small>
                        Teacher:{" "}
                        {group.classTeacherUserId ? staffById[group.classTeacherUserId]?.name || "Assigned" : "Unassigned"}
                      </small>
                    </div>
                    <input
                      type="checkbox"
                      checked={group.classTeacherUserId === selectedUserId}
                      onChange={() =>
                        updateClassGroupTeacher(
                          group,
                          group.classTeacherUserId === selectedUserId ? null : selectedUserId
                        )
                      }
                    />
                  </label>
                ))}
              {!loadingClassGroups && classGroups.length === 0 && <p className="muted">No class groups found.</p>}
            </div>
          )}
        </div>

        <div className="card">
          <h3>Subject assignments</h3>
          {loadingSubjects && <p className="muted">Loading subjects...</p>}
          {!loadingSubjects && subjects.length === 0 && (
            <p className="muted">No subjects yet. Add subjects in Academics first.</p>
          )}
          {!loadingSubjects && subjects.length > 0 && (
            <>
              <div className="line-item">
                <div>
                  <strong>Subjects configured</strong>
                  <small>
                    {subjects.length} subjects available
                    {selectedUser ? ` · ${plannedSubjectCount} planned for this teacher` : ""}
                  </small>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <a className="ghost-button" href="/admin/academics">
                    Manage subjects
                  </a>
                  {selectedUser && (
                    <>
                      <button className="ghost-button" type="button" onClick={copyPlannedSubjects}>
                        Copy plan
                      </button>
                      <button className="ghost-button" type="button" onClick={exportPlannedSubjectsCsv}>
                        Export CSV
                      </button>
                      <button className="ghost-button" type="button" onClick={clearPlannedSubjects}>
                        Clear plan
                      </button>
                    </>
                  )}
                </div>
              </div>
              {selectedUser ? (
                <p className="muted">
                  Subject assignment API is pending. Use this list to plan teacher loads.
                </p>
              ) : (
                <p className="muted">Select a staff member to plan subject assignments.</p>
              )}
              {selectedUser && plannedSubjectPreview.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  {plannedSubjectPreview.map((subject) => (
                    <span
                      key={subject.id}
                      className="badge"
                      title={`${subject.name}${plannedSubjects[subject.id]?.note ? ` — ${plannedSubjects[subject.id]?.note}` : ""}`}
                    >
                      {subject.name}
                    </span>
                  ))}
                  {plannedSubjectOverflow > 0 && (
                    <span className="badge" title={plannedSubjectOverflowTitle}>
                      +{plannedSubjectOverflow}
                    </span>
                  )}
                </div>
              )}
              <div className="list">
                {subjects.map((subject) => (
                  <div key={subject.id} className="line-item">
                    <div>
                      <strong>{subject.name}</strong>
                      <small>{subject.code || "No code"} · {subject.levelType || "Unspecified"}</small>
                    </div>
                    {selectedUser && (
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                          type="checkbox"
                          checked={Boolean(plannedSubjects[subject.id]?.planned)}
                          onChange={() => togglePlannedSubject(subject.id)}
                        />
                        <input
                          className="input"
                          placeholder="Note (optional)"
                          value={plannedSubjects[subject.id]?.note || ""}
                          onChange={(event) => updatePlannedSubjectNote(subject.id, event.target.value)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="card">
          <h3>Welcome task list</h3>
          {!selectedUser && <p className="muted">Select a staff member to track onboarding tasks.</p>}
          {selectedUser && (
            <div className="list">
              <div className="line-item">
                <div>
                  <strong>Onboarding pack</strong>
                  <small>Share a summary of role and class ownership.</small>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="ghost-button" type="button" onClick={copyOnboardingSummary}>
                    Copy summary
                  </button>
                  <button className="ghost-button" type="button" onClick={() => window.print()}>
                    Print pack
                  </button>
                </div>
              </div>
              {welcomeTasks.map((task) => (
                <label key={task} className="line-item">
                  <span>{task}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(welcomeTaskState[task])}
                    onChange={() => toggleWelcomeTask(task)}
                  />
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

