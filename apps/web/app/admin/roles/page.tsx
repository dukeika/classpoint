"use client";

import { useEffect, useMemo, useState } from "react";
import { graphqlFetch } from "../../components/graphql";
import { useStaffAuth } from "../../components/staff-auth";

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

type RolePermission = {
  id: string;
  roleId: string;
  permissionCode: string;
  schoolId: string;
};

type User = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  userType?: string | null;
  status?: string | null;
};

type AuditEvent = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorUserId?: string | null;
  createdAt: string;
};

type AuditEventConnection = {
  items?: AuditEvent[];
  nextToken?: string | null;
};

export default function RolesAdminPage() {
  const { token: authToken, schoolId: sessionSchoolId } = useStaffAuth();
  const [schoolIdInput, setSchoolIdInput] = useState("");
  const [userIdInput, setUserIdInput] = useState("");
  const [roleIdInput, setRoleIdInput] = useState("");
  const [roleNameInput, setRoleNameInput] = useState("");
  const [permissionCodeInput, setPermissionCodeInput] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("STAFF");
  const [roleIsSystem, setRoleIsSystem] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [userRolesCache, setUserRolesCache] = useState<Record<string, UserRole[]>>({});
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [rolePermissionsCache, setRolePermissionsCache] = useState<Record<string, RolePermission[]>>({});
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [auditNextToken, setAuditNextToken] = useState<string | null>(null);
  const [auditLimit, setAuditLimit] = useState(10);
  const [auditActionFilter, setAuditActionFilter] = useState("");
  const [auditEntityFilter, setAuditEntityFilter] = useState("");
  const [auditActorFilter, setAuditActorFilter] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [autoRefreshSeconds, setAutoRefreshSeconds] = useState(30);
  const [lastAuditLoadedAt, setLastAuditLoadedAt] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingUserRoles, setLoadingUserRoles] = useState(false);
  const [loadingRolePermissions, setLoadingRolePermissions] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    if (sessionSchoolId) {
      setSchoolIdInput((prev) => (prev ? prev : sessionSchoolId));
    }
  }, [sessionSchoolId]);

  useEffect(() => {
    const selected = roles.find((role) => role.id === roleIdInput);
    setRoleIsSystem(Boolean(selected?.isSystemRole));
  }, [roleIdInput, roles]);

  const schoolId = useMemo(() => schoolIdInput.trim(), [schoolIdInput]);
  const userId = useMemo(() => userIdInput.trim(), [userIdInput]);
  const roleId = useMemo(() => roleIdInput.trim(), [roleIdInput]);
  const permissionCode = useMemo(() => permissionCodeInput.trim(), [permissionCodeInput]);
  const roleName = useMemo(() => roleNameInput.trim(), [roleNameInput]);

  const loadUsers = async () => {
    if (!authToken || !schoolId) return;
    setLoadingUsers(true);
    setStatus("");
    try {
      const data = await graphqlFetch(
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
        { schoolId, userType: userTypeFilter, limit: 50 });
      setUsers(data.usersBySchool || []);
      setStatus("Users loaded.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadRoles = async () => {
    if (!authToken || !schoolId) return;
    setLoading(true);
    setStatus("");
    try {
      const data = await graphqlFetch(
        `query RolesBySchool($schoolId: ID!, $limit: Int) {
          rolesBySchool(schoolId: $schoolId, limit: $limit) {
            id
            name
            isSystemRole
          }
        }`,
        { schoolId, limit: 25 });
      setRoles(data.rolesBySchool || []);
      setStatus("Roles loaded.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load roles.");
    } finally {
      setLoading(false);
    }
  };

  const loadUserRoles = async (force = false) => {
    if (!authToken || !userId) return;
    const cached = userRolesCache[userId];
    if (cached && !force) {
      setUserRoles(cached);
      setStatus("User roles loaded (cached).");
      return;
    }
    setLoadingUserRoles(true);
    setStatus("");
    try {
      const data = await graphqlFetch(
        `query UserRolesByUser($userId: ID!, $limit: Int) {
          userRolesByUser(userId: $userId, limit: $limit) {
            id
            userId
            roleId
            schoolId
          }
        }`,
        { userId, limit: 25 });
      const items = data.userRolesByUser || [];
      setUserRoles(items);
      setUserRolesCache((prev) => ({ ...prev, [userId]: items }));
      setStatus("User roles loaded.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load user roles.");
    } finally {
      setLoadingUserRoles(false);
    }
  };

  const loadRolePermissions = async (force = false) => {
    if (!authToken || !roleId) return;
    const cached = rolePermissionsCache[roleId];
    if (cached && !force) {
      setRolePermissions(cached);
      setStatus("Role permissions loaded (cached).");
      return;
    }
    setLoadingRolePermissions(true);
    setStatus("");
    try {
      const data = await graphqlFetch(
        `query RolePermissionsByRole($roleId: ID!, $limit: Int) {
          rolePermissionsByRole(roleId: $roleId, limit: $limit) {
            id
            roleId
            permissionCode
            schoolId
          }
        }`,
        { roleId, limit: 25 });
      const items = data.rolePermissionsByRole || [];
      setRolePermissions(items);
      setRolePermissionsCache((prev) => ({ ...prev, [roleId]: items }));
      setStatus("Role permissions loaded.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load role permissions.");
    } finally {
      setLoadingRolePermissions(false);
    }
  };

  const loadAuditEvents = async (append = false) => {
    if (!authToken || !schoolId) return;
    setLoadingAudit(true);
    setStatus("");
    try {
      const action = auditActionFilter.trim();
      const entityType = auditEntityFilter.trim();
      const actorUserId = auditActorFilter.trim();
      const limit = Number.isFinite(auditLimit) && auditLimit > 0 ? auditLimit : 10;
      const variables: Record<string, unknown> = {
        schoolId,
        limit
      };
      if (!append) {
        setAuditNextToken(null);
      }
      if (append && auditNextToken) {
        variables.nextToken = auditNextToken;
      }
      if (action) {
        variables.action = action;
      }
      if (entityType) {
        variables.entityType = entityType;
      }
      if (actorUserId) {
        variables.actorUserId = actorUserId;
      }
      const data = await graphqlFetch(
        `query AuditBySchool(
          $schoolId: ID!
          $limit: Int
          $nextToken: String
          $action: String
          $entityType: String
          $actorUserId: ID
        ) {
          auditBySchool(
            schoolId: $schoolId
            limit: $limit
            nextToken: $nextToken
            action: $action
            entityType: $entityType
            actorUserId: $actorUserId
          ) {
            items {
              id
              action
              entityType
              entityId
              actorUserId
              createdAt
            }
            nextToken
          }
        }`,
        variables);
      const connection: AuditEventConnection | null = data.auditBySchool || null;
      const items = connection?.items || [];
      setAuditNextToken(connection?.nextToken || null);
      setAuditEvents((prev) => (append ? [...prev, ...items] : items));
      setLastAuditLoadedAt(new Date().toISOString());
      setStatus("Audit events loaded.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load audit events.");
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (!autoRefresh || !authToken || !schoolId) return;
    const seconds = Number.isFinite(autoRefreshSeconds) ? autoRefreshSeconds : 30;
    const intervalMs = Math.max(10, seconds) * 1000;
    const handle = window.setInterval(() => {
      loadAuditEvents();
    }, intervalMs);
    return () => window.clearInterval(handle);
  }, [autoRefresh, autoRefreshSeconds, authToken, schoolId, auditActionFilter, auditEntityFilter, auditActorFilter]);

  useEffect(() => {
    if (userId) {
      loadUserRoles();
    }
  }, [userId]);

  useEffect(() => {
    if (roleId) {
      loadRolePermissions();
    }
  }, [roleId]);

  const createRole = async () => {
    if (!authToken || !schoolId || !roleName) return;
    setLoading(true);
    setStatus("");
    try {
      const data = await graphqlFetch(
        `mutation CreateRole($input: CreateRoleInput!) {
          createRole(input: $input) {
            id
            name
            schoolId
            isSystemRole
          }
        }`,
        {
          input: {
            schoolId,
            name: roleName,
            createdByUserId: "user-admin"
          }
        });
      setRoleIdInput(data.createRole.id);
      setStatus("Role created.");
      await loadRoles();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to create role.");
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async () => {
    if (!authToken || !schoolId || !roleId || !roleName || roleIsSystem) return;
    setLoading(true);
    setStatus("");
    try {
      await graphqlFetch(
        `mutation UpdateRole($input: UpdateRoleInput!) {
          updateRole(input: $input) {
            id
            name
          }
        }`,
        {
          input: {
            schoolId,
            id: roleId,
            name: roleName,
            updatedByUserId: "user-admin"
          }
        });
      setStatus("Role updated.");
      await loadRoles();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to update role.");
    } finally {
      setLoading(false);
    }
  };

  const deleteRole = async () => {
    if (!authToken || !schoolId || !roleId || roleIsSystem) return;
    setLoading(true);
    setStatus("");
    try {
      await graphqlFetch(
        `mutation DeleteRole($input: DeleteRoleInput!) {
          deleteRole(input: $input)
        }`,
        {
          input: {
            schoolId,
            id: roleId,
            deletedByUserId: "user-admin"
          }
        });
      setStatus("Role deleted.");
      await loadRoles();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to delete role.");
    } finally {
      setLoading(false);
    }
  };

  const assignUserRole = async () => {
    if (!authToken || !schoolId || !userId || !roleId) return;
    setLoading(true);
    setStatus("");
    try {
      await graphqlFetch(
        `mutation AssignUserRole($input: AssignUserRoleInput!) {
          assignUserRole(input: $input) { id }
        }`,
        {
          input: {
            schoolId,
            userId,
            roleId,
            assignedByUserId: "user-admin"
          }
        });
      setStatus("User role assigned.");
      await loadUserRoles(true);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to assign user role.");
    } finally {
      setLoading(false);
    }
  };

  const removeUserRole = async () => {
    if (!authToken || !schoolId || !userId || !roleId) return;
    setLoading(true);
    setStatus("");
    try {
      await graphqlFetch(
        `mutation RemoveUserRole($input: RemoveUserRoleInput!) {
          removeUserRole(input: $input)
        }`,
        {
          input: {
            schoolId,
            userId,
            roleId,
            removedByUserId: "user-admin"
          }
        });
      setStatus("User role removed.");
      await loadUserRoles(true);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to remove user role.");
    } finally {
      setLoading(false);
    }
  };

  const assignRolePermission = async () => {
    if (!authToken || !schoolId || !roleId || !permissionCode) return;
    setLoading(true);
    setStatus("");
    try {
      await graphqlFetch(
        `mutation AssignRolePermission($input: AssignRolePermissionInput!) {
          assignRolePermission(input: $input) { id }
        }`,
        {
          input: {
            schoolId,
            roleId,
            permissionCode,
            assignedByUserId: "user-admin"
          }
        });
      setStatus("Role permission assigned.");
      await loadRolePermissions(true);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to assign role permission.");
    } finally {
      setLoading(false);
    }
  };

  const removeRolePermission = async () => {
    if (!authToken || !schoolId || !roleId || !permissionCode) return;
    setLoading(true);
    setStatus("");
    try {
      await graphqlFetch(
        `mutation RemoveRolePermission($input: RemoveRolePermissionInput!) {
          removeRolePermission(input: $input)
        }`,
        {
          input: {
            schoolId,
            roleId,
            permissionCode,
            removedByUserId: "user-admin"
          }
        });
      setStatus("Role permission removed.");
      await loadRolePermissions(true);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to remove role permission.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <section className="shell">
        <div className="hero fade-up">
          <div>
            <span className="chip">Admin</span>
            <h1>Role Management</h1>
            <p>Manage roles, permissions, and user role assignments.</p>
          </div>
        </div>

        <div className="card fade-up delay-1">
          <h3>Context</h3>
          <div className="form-grid">
            <input
              placeholder="School ID"
              value={schoolIdInput}
              onChange={(event) => setSchoolIdInput(event.target.value)}
            />
            <input
              placeholder="User ID"
              value={userIdInput}
              onChange={(event) => setUserIdInput(event.target.value)}
            />
            <input
              placeholder="Role name (create new)"
              value={roleNameInput}
              onChange={(event) => setRoleNameInput(event.target.value)}
            />
            <input
              placeholder="Role ID"
              value={roleIdInput}
              onChange={(event) => setRoleIdInput(event.target.value)}
            />
            <input
              placeholder="Permission code (e.g. USERS.MANAGE)"
              value={permissionCodeInput}
              onChange={(event) => setPermissionCodeInput(event.target.value)}
            />
            <div className="grid">
              <button className="button" onClick={createRole} disabled={loading || !schoolId || !roleName}>
                Create role
              </button>
              <button
                className="button"
                onClick={updateRole}
                disabled={loading || !schoolId || !roleId || !roleName || roleIsSystem}
              >
                Rename role
              </button>
              <button className="button" onClick={deleteRole} disabled={loading || !schoolId || !roleId || roleIsSystem}>
                Delete role
              </button>
              <button className="button" onClick={loadRoles} disabled={loading || !schoolId}>
                Load roles
              </button>
              <button
                className="button"
                onClick={() => loadUserRoles(true)}
                disabled={loadingUserRoles || !userId}
              >
                Load user roles
              </button>
              <button
                className="button"
                onClick={() => loadRolePermissions(true)}
                disabled={loadingRolePermissions || !roleId}
              >
                Load role permissions
              </button>
              <button className="button" onClick={() => loadAuditEvents(false)} disabled={loadingAudit || !schoolId}>
                Load audit events
              </button>
              <label className="line-item" style={{ alignItems: "center" }}>
                <span>Auto-refresh</span>
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(event) => setAutoRefresh(event.target.checked)}
                />
              </label>
              <input
                type="number"
                min={10}
                placeholder="Refresh seconds"
                value={autoRefreshSeconds}
                onChange={(event) => setAutoRefreshSeconds(Number(event.target.value || 0))}
              />
              <button className="button" onClick={assignUserRole} disabled={loading || !schoolId || !userId || !roleId}>
                Assign user role
              </button>
              <button className="button" onClick={removeUserRole} disabled={loading || !schoolId || !userId || !roleId}>
                Remove user role
              </button>
              <button
                className="button"
                onClick={assignRolePermission}
                disabled={loading || !schoolId || !roleId || !permissionCode}
              >
                Assign permission
              </button>
              <button
                className="button"
                onClick={removeRolePermission}
                disabled={loading || !schoolId || !roleId || !permissionCode}
              >
                Remove permission
              </button>
            </div>
            {status && <p>{status}</p>}
            {roleIsSystem && <p className="muted">System roles cannot be renamed or deleted.</p>}
            {!authToken && <p>Sign in to load live role data.</p>}
          </div>
        </div>

        <div className="grid fade-up delay-2">
          <div className="card">
            <h3>Roles</h3>
            <div className="list">
              {roles.length === 0 && <p>No roles loaded.</p>}
              {roles.map((role) => (
                <div key={role.id} className="line-item">
                  <div>
                    <strong>{role.name}</strong>
                    <small>{role.id}</small>
                  </div>
                  <div>
                    <button
                      className="button"
                      type="button"
                      onClick={() => {
                        setRoleIdInput(role.id);
                        setRoleNameInput(role.name);
                      }}
                      disabled={loading}
                    >
                      Edit
                    </button>
                    {!role.isSystemRole && (
                      <button
                        className="button"
                        type="button"
                        onClick={() => {
                          setRoleIdInput(role.id);
                          setRoleNameInput(role.name);
                          setStatus("");
                          if (window.confirm(`Delete role "${role.name}"?`)) {
                            deleteRole();
                          }
                        }}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    )}
                    <span className="badge">{role.isSystemRole ? "System" : "Custom"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3>User roles</h3>
            <div className="form-grid">
              <div className="grid">
                <label className="line-item" style={{ alignItems: "center" }}>
                  <span>User type</span>
                  <select
                    value={userTypeFilter}
                    onChange={(event) => setUserTypeFilter(event.target.value)}
                  >
                    <option value="SCHOOL_ADMIN">SCHOOL_ADMIN</option>
                    <option value="STAFF">STAFF</option>
                    <option value="PARENT">PARENT</option>
                    <option value="STUDENT">STUDENT</option>
                  </select>
                </label>
                <button className="button" onClick={loadUsers} disabled={loadingUsers || !schoolId}>
                  Load users
                </button>
              </div>
              <select
                value={userIdInput}
                onChange={(event) => setUserIdInput(event.target.value)}
              >
                <option value="">Select a user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} {user.email ? `(${user.email})` : ""} {user.phone ? `(${user.phone})` : ""}
                  </option>
                ))}
              </select>
              {loadingUsers && <p>Loading users...</p>}
            </div>
            <div className="list">
              {loadingUserRoles && <p>Loading user roles...</p>}
              {!loadingUserRoles && userRoles.length === 0 && <p>No user roles loaded.</p>}
              {userRoles.map((userRole) => (
                <div key={userRole.id} className="line-item">
                  <div>
                    <strong>{userRole.userId}</strong>
                    <small>{userRole.roleId}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3>Role permissions</h3>
            <div className="list">
              {loadingRolePermissions && <p>Loading permissions...</p>}
              {!loadingRolePermissions && rolePermissions.length === 0 && <p>No permissions loaded.</p>}
              {rolePermissions.map((perm) => (
                <div key={perm.id} className="line-item">
                  <div>
                    <strong>{perm.permissionCode}</strong>
                    <small>{perm.id}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3>Recent audit events</h3>
            <div className="list">
              <div className="form-grid">
                <input
                  placeholder="Filter by action (e.g. ROLE_CREATED)"
                  value={auditActionFilter}
                  onChange={(event) => setAuditActionFilter(event.target.value)}
                />
                <input
                  placeholder="Filter by entity (e.g. RolePermission)"
                  value={auditEntityFilter}
                  onChange={(event) => setAuditEntityFilter(event.target.value)}
                />
                <input
                  placeholder="Filter by actor (e.g. user-admin)"
                  value={auditActorFilter}
                  onChange={(event) => setAuditActorFilter(event.target.value)}
                />
                <label className="line-item" style={{ alignItems: "center" }}>
                  <span>Limit</span>
                  <select
                    value={auditLimit}
                    onChange={(event) => setAuditLimit(Number(event.target.value || 10))}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </label>
                <button className="button" onClick={() => loadAuditEvents(false)} disabled={loadingAudit || !schoolId}>
                  Apply filters
                </button>
              </div>
              <div className="list">
                {lastAuditLoadedAt && (
                  <div className="line-item">
                    <div>
                      <strong>Last refreshed</strong>
                      <small>{new Date(lastAuditLoadedAt).toLocaleString()}</small>
                    </div>
                  </div>
                )}
                {(auditActionFilter || auditEntityFilter || auditActorFilter) && (
                  <div className="line-item">
                    <div>
                      <strong>Filters</strong>
                      <small>
                        {auditActionFilter ? `action=${auditActionFilter}` : "action=any"}{" "}
                        {auditEntityFilter ? `entity=${auditEntityFilter}` : "entity=any"}{" "}
                        {auditActorFilter ? `actor=${auditActorFilter}` : "actor=any"}
                      </small>
                    </div>
                  </div>
                )}
              </div>
              {loadingAudit && <p>Loading audit events...</p>}
              {!loadingAudit && auditEvents.length === 0 && <p>No audit events loaded.</p>}
              {auditEvents.map((evt) => (
                <div key={evt.id} className="line-item">
                  <div>
                    <strong>{evt.action}</strong>
                    <small>{evt.entityType} - {evt.entityId}</small>
                    <small>{new Date(evt.createdAt).toLocaleString()}</small>
                  </div>
                  <span className="badge">{evt.actorUserId || "system"}</span>
                </div>
              ))}
              {auditNextToken && (
                <button
                  className="button"
                  type="button"
                  onClick={() => loadAuditEvents(true)}
                  disabled={loadingAudit}
                >
                  Load more
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

