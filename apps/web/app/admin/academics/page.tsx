"use client";

import { useEffect, useMemo, useState } from "react";
import { graphqlFetch } from "../../components/graphql";
import { useStaffAuth } from "../../components/staff-auth";

type AttendanceSession = { id: string; classGroupId: string; date: string };
type AttendanceEntry = { id: string; studentId: string; status: string };
type AssessmentPolicy = { id: string; name: string; isActive: boolean };
type Assessment = { id: string; title: string; status: string };
type ScoreEntry = { id: string; studentId: string; totalScore?: number | null; grade?: string | null };
type FeatureFlag = { id: string; code: string; isEnabled: boolean };
type Subject = { id: string; name: string; code?: string | null; levelType?: string | null };
type ClassYear = { id: string; name: string; levelId?: string | null; sortOrder?: number | null };
type ClassSubject = { id: string; classYearId: string; subjectId: string; isCompulsory: boolean };

export default function AcademicsAdminPage() {
  const { token: authToken, schoolId: sessionSchoolId } = useStaffAuth();
  const [schoolIdInput, setSchoolIdInput] = useState("");
  const [classGroupId, setClassGroupId] = useState("");
  const [termIdInput, setTermIdInput] = useState("");
  const [date, setDate] = useState("");
  const [attendanceSessionId, setAttendanceSessionId] = useState("");
  const [newSessionDate, setNewSessionDate] = useState("");
  const [newSessionTakenBy, setNewSessionTakenBy] = useState("");
  const [newSessionId, setNewSessionId] = useState<string | null>(null);
  const [newEntryStudentId, setNewEntryStudentId] = useState("");
  const [newAssessmentTitle, setNewAssessmentTitle] = useState("");
  const [newAssessmentId, setNewAssessmentId] = useState<string | null>(null);
  const [newScoreStudentId, setNewScoreStudentId] = useState("");
  const [newScoreJson, setNewScoreJson] = useState("{\"CA1\":10,\"EXAM\":30}");
  const [newScoreGrade, setNewScoreGrade] = useState("");
  const [newScoreTotal, setNewScoreTotal] = useState(40);
  const [lockAssessmentId, setLockAssessmentId] = useState("");
  const [updateScoreId, setUpdateScoreId] = useState("");
  const [updateScoreTotal, setUpdateScoreTotal] = useState<number | undefined>(undefined);
  const [updateScoreGrade, setUpdateScoreGrade] = useState("");
  const [updateScoreJson, setUpdateScoreJson] = useState("");
  const [scoreGridAssessmentId, setScoreGridAssessmentId] = useState("");
  const [assessmentList, setAssessmentList] = useState<Assessment[]>([]);
  const [scoreGridRows, setScoreGridRows] = useState<ScoreEntry[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [assessmentId, setAssessmentId] = useState("");
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [entries, setEntries] = useState<AttendanceEntry[]>([]);
  const [policies, setPolicies] = useState<AssessmentPolicy[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectLevel, setSubjectLevel] = useState("BOTH");
  const [editSubjectId, setEditSubjectId] = useState<string | null>(null);
  const [classYears, setClassYears] = useState<ClassYear[]>([]);
  const [selectedClassYearId, setSelectedClassYearId] = useState("");
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gridUpdates, setGridUpdates] = useState<Record<string, { total?: number; grade?: string }>>({});

  useEffect(() => {
    if (sessionSchoolId) {
      setSchoolIdInput((prev) => (prev ? prev : sessionSchoolId));
    }
  }, [sessionSchoolId]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setDate(today);
  }, []);

  const schoolId = useMemo(() => schoolIdInput.trim(), [schoolIdInput]);
  const termId = useMemo(() => termIdInput.trim(), [termIdInput]);
  const selectedAssessment = useMemo(
    () => assessments.find((a) => a.id === (assessmentId || scoreGridAssessmentId)),
    [assessments, assessmentId, scoreGridAssessmentId]
  );
  const selectedAssessmentLocked = (selectedAssessment?.status || "").toUpperCase() === "LOCKED";

  const loadData = async () => {
    if (!authToken || !schoolId || !classGroupId || !date || !attendanceSessionId) {
      setStatus("Fill school, classGroupId, date, and attendanceSessionId.");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const data = await graphqlFetch(
        `query AcademicSanity($schoolId: ID!, $classGroupId: ID!, $date: AWSDate!, $attendanceSessionId: ID!, $subjectId: ID, $assessmentId: ID) {
          attendanceSessionsByClassAndDay(classGroupId: $classGroupId, date: $date, limit: 5) { id classGroupId date }
          attendanceEntriesBySession(attendanceSessionId: $attendanceSessionId, limit: 5) { id studentId status }
          assessmentPoliciesBySchool(schoolId: $schoolId, limit: 5) { id name isActive }
          assessmentsByClassSubjectTerm(classGroupId: $classGroupId, subjectId: $subjectId, limit: 5) { id title status }
          scoresByAssessment(assessmentId: $assessmentId, limit: 5) { id studentId totalScore grade }
          featuresBySchool(schoolId: $schoolId, limit: 5) { id code isEnabled }
        }`,
        {
          schoolId,
          classGroupId: classGroupId.trim(),
          date,
          attendanceSessionId: attendanceSessionId.trim(),
          subjectId: subjectId.trim() || null,
          assessmentId: assessmentId.trim() || null
        });
      setSessions(data.attendanceSessionsByClassAndDay || []);
      setEntries(data.attendanceEntriesBySession || []);
      setPolicies(data.assessmentPoliciesBySchool || []);
      setAssessments(data.assessmentsByClassSubjectTerm || []);
      setAssessmentList(data.assessmentsByClassSubjectTerm || []);
      setScores(data.scoresByAssessment || []);
      setFeatures(data.featuresBySchool || []);
      setStatus("Loaded.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load academics data.");
    } finally {
      setLoading(false);
    }
  };

  const refreshAfterChange = async () => {
    // Only refresh if required filters are present.
    if (!authToken || !schoolId || !classGroupId || !date || !attendanceSessionId) return;
    await loadData();
  };

  const loadSubjects = async () => {
    if (!authToken || !schoolId) return;
    setLoading(true);
    setStatus("");
    try {
      const data = await graphqlFetch(
        `query SubjectsBySchool($schoolId: ID!) {
          subjectsBySchool(schoolId: $schoolId, limit: 200) {
            id
            name
            code
            levelType
          }
        }`,
        { schoolId });
      setSubjects(data.subjectsBySchool || []);
      setStatus("Subjects loaded.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load subjects.");
    } finally {
      setLoading(false);
    }
  };

  const loadClassYears = async () => {
    if (!authToken || !schoolId) return;
    setLoading(true);
    setStatus("");
    try {
      const data = await graphqlFetch(
        `query ClassYearsBySchool($schoolId: ID!, $limit: Int) {
          classYearsBySchool(schoolId: $schoolId, limit: $limit) {
            id
            name
            levelId
            sortOrder
          }
        }`,
        { schoolId, limit: 200 });
      const items = data.classYearsBySchool || [];
      setClassYears(items);
      if (!selectedClassYearId && items.length > 0) {
        setSelectedClassYearId(items[0].id);
      }
      setStatus("Class years loaded.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load class years.");
    } finally {
      setLoading(false);
    }
  };

  const loadClassSubjects = async (classYearId: string) => {
    if (!authToken || !classYearId) return;
    setLoading(true);
    setStatus("");
    try {
      const data = await graphqlFetch(
        `query SubjectsByClassYear($classYearId: ID!, $limit: Int) {
          subjectsByClassYear(classYearId: $classYearId, limit: $limit) {
            id
            classYearId
            subjectId
            isCompulsory
          }
        }`,
        { classYearId, limit: 200 });
      setClassSubjects(data.subjectsByClassYear || []);
      setStatus("Class subjects loaded.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load class subjects.");
    } finally {
      setLoading(false);
    }
  };

  const resetSubjectForm = () => {
    setEditSubjectId(null);
    setSubjectName("");
    setSubjectCode("");
    setSubjectLevel("BOTH");
  };

  const loadScoreGrid = async () => {
    if (!authToken || !schoolId || !scoreGridAssessmentId) return;
    setLoading(true);
    setStatus("");
    try {
      const data = await graphqlFetch(
        `query ScoresForGrid($assessmentId: ID!) {
          scoresByAssessment(assessmentId: $assessmentId, limit: 200) {
            id
            studentId
            totalScore
            grade
          }
        }`,
        { assessmentId: scoreGridAssessmentId });
      setScoreGridRows(data.scoresByAssessment || []);
      setStatus("Scores loaded.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load scores.");
    } finally {
      setLoading(false);
    }
  };

  const refreshAssessmentStatus = async (id: string) => {
    if (!authToken || !schoolId || !classGroupId || !subjectId) {
      return selectedAssessmentLocked;
    }
    try {
      const data = await graphqlFetch(
        `query AssessmentStatus($classGroupId: ID!, $subjectId: ID!, $termId: ID) {
          assessmentsByClassSubjectTerm(classGroupId: $classGroupId, subjectId: $subjectId, termId: $termId, limit: 50) {
            id
            status
            title
          }
        }`,
        { classGroupId, subjectId, termId: termId || null });
      const list = data.assessmentsByClassSubjectTerm || [];
      setAssessmentList(list);
      setAssessments(list);
      const found = list.find((a: Assessment) => a.id === id);
      if (!found) return selectedAssessmentLocked;
      return (found.status || "").toUpperCase() === "LOCKED";
    } catch (_err) {
      // If status cannot be refreshed, fall back to cached flag
      return selectedAssessmentLocked;
    }
  };

  return (
    <main className="page">
      <section className="shell">
        <div className="hero fade-up">
          <div>
            <span className="chip">Admin</span>
            <h1>Academics queries</h1>
            <p>Quick sanity checks for attendance and assessments.</p>
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
              placeholder="Class group ID"
              value={classGroupId}
              onChange={(event) => setClassGroupId(event.target.value)}
            />
            <input
              placeholder="Term ID"
              value={termIdInput}
              onChange={(event) => setTermIdInput(event.target.value)}
            />
            <input
              type="date"
              placeholder="Date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
            <input
              placeholder="Attendance session ID"
              value={attendanceSessionId}
              onChange={(event) => setAttendanceSessionId(event.target.value)}
            />
            <input
              placeholder="Subject ID (optional for assessments)"
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
            />
            <input
              placeholder="Assessment ID (for scores query)"
              value={assessmentId}
              onChange={(event) => setAssessmentId(event.target.value)}
            />
            <button className="button" onClick={loadData} disabled={loading || !schoolId}>
              Load academics data
            </button>
            <button className="button secondary" onClick={loadSubjects} disabled={loading || !schoolId}>
              Load subjects
            </button>
            {status && <p>{status}</p>}
      {!authToken && <p>Sign in to load live academics data.</p>}
    </div>
  </div>

  <div className="card fade-up delay-2">
    <h3>Class year subjects</h3>
    <div className="form-grid">
      <div className="grid">
        <button className="button secondary" onClick={loadClassYears} disabled={loading || !schoolId}>
          Load class years
        </button>
        <button
          className="button secondary"
          onClick={() => loadClassSubjects(selectedClassYearId)}
          disabled={loading || !selectedClassYearId}
        >
          Load class subjects
        </button>
      </div>
      <select
        value={selectedClassYearId}
        onChange={(event) => {
          const next = event.target.value;
          setSelectedClassYearId(next);
          if (next) {
            loadClassSubjects(next);
          }
        }}
      >
        <option value="">Select class year</option>
        {classYears.map((year) => (
          <option key={year.id} value={year.id}>
            {year.name}
          </option>
        ))}
      </select>
      <small className="muted">
        Assign subjects to a class year and mark compulsory items.
      </small>
    </div>
    {subjects.length === 0 && <p className="muted">Load subjects to begin assigning.</p>}
    {subjects.length > 0 && selectedClassYearId && (
      <div className="list">
        {subjects.map((subject) => {
          const assignment = classSubjects.find((item) => item.subjectId === subject.id);
          return (
            <div key={subject.id} className="line-item">
              <div>
                <strong>{subject.name}</strong>
                <small>{subject.code || "No code"} - {subject.levelType || "Unspecified"}</small>
              </div>
              <div className="grid">
                <label className="chip">
                  <input
                    type="checkbox"
                    checked={Boolean(assignment)}
                    onChange={async () => {
                      if (!authToken || !schoolId || !selectedClassYearId) return;
                      setSaving(true);
                      setStatus("");
                      try {
                        if (assignment) {
                          await graphqlFetch(
                            `mutation DeleteClassSubject($schoolId: ID!, $id: ID!) {
                              deleteClassSubject(schoolId: $schoolId, id: $id)
                            }`,
                            { schoolId, id: assignment.id });
                          setStatus("Subject unassigned.");
                        } else {
                          await graphqlFetch(
                            `mutation CreateClassSubject($input: CreateClassSubjectInput!) {
                              createClassSubject(input: $input) { id }
                            }`,
                            {
                              input: {
                                schoolId,
                                classYearId: selectedClassYearId,
                                subjectId: subject.id,
                                isCompulsory: false
                              }
                            });
                          setStatus("Subject assigned.");
                        }
                        await loadClassSubjects(selectedClassYearId);
                      } catch (err) {
                        setStatus(err instanceof Error ? err.message : "Failed to update assignment.");
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                  />
                  Assigned
                </label>
                <label className="chip">
                  <input
                    type="checkbox"
                    checked={Boolean(assignment?.isCompulsory)}
                    onChange={async () => {
                      if (!authToken || !schoolId || !selectedClassYearId || !assignment) return;
                      setSaving(true);
                      setStatus("");
                      try {
                        await graphqlFetch(
                          `mutation UpdateClassSubject($input: UpdateClassSubjectInput!) {
                            updateClassSubject(input: $input) { id isCompulsory }
                          }`,
                          {
                            input: {
                              id: assignment.id,
                              schoolId,
                              classYearId: selectedClassYearId,
                              subjectId: subject.id,
                              isCompulsory: !assignment.isCompulsory
                            }
                          });
                        setStatus("Compulsory flag updated.");
                        await loadClassSubjects(selectedClassYearId);
                      } catch (err) {
                        setStatus(err instanceof Error ? err.message : "Failed to update compulsory flag.");
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving || !assignment}
                  />
                  Compulsory
                </label>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>

        <div className="card fade-up delay-2">
          <h3>Subjects</h3>
          <div className="form-grid">
            <input
              placeholder="Subject name"
              value={subjectName}
              onChange={(event) => setSubjectName(event.target.value)}
            />
            <input
              placeholder="Code (optional)"
              value={subjectCode}
              onChange={(event) => setSubjectCode(event.target.value)}
            />
            <select value={subjectLevel} onChange={(event) => setSubjectLevel(event.target.value)}>
              <option value="PRIMARY">Primary</option>
              <option value="SECONDARY">Secondary</option>
              <option value="BOTH">Both</option>
            </select>
            <div className="grid">
              <button
                className="button"
                onClick={async () => {
                  if (!authToken || !schoolId || !subjectName.trim()) {
                    setStatus("Subject name is required.");
                    return;
                  }
                  setSaving(true);
                  setStatus("");
                  try {
                    const data = await graphqlFetch(
                      `mutation CreateSubject($input: CreateSubjectInput!) {
                        createSubject(input: $input) { id name }
                      }`,
                      {
                        input: {
                          schoolId,
                          name: subjectName.trim(),
                          code: subjectCode.trim() || null,
                          levelType: subjectLevel || null
                        }
                      });
                    setStatus(`Subject created: ${data.createSubject?.id || "ok"}.`);
                    resetSubjectForm();
                    await loadSubjects();
                  } catch (err) {
                    setStatus(err instanceof Error ? err.message : "Failed to create subject.");
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving || !schoolId}
              >
                Create subject
              </button>
              <button
                className="button secondary"
                onClick={async () => {
                  if (!authToken || !schoolId || !editSubjectId || !subjectName.trim()) {
                    setStatus("Select a subject to update and provide a name.");
                    return;
                  }
                  setSaving(true);
                  setStatus("");
                  try {
                    await graphqlFetch(
                      `mutation UpdateSubject($input: UpdateSubjectInput!) {
                        updateSubject(input: $input) { id name }
                      }`,
                      {
                        input: {
                          id: editSubjectId,
                          schoolId,
                          name: subjectName.trim(),
                          code: subjectCode.trim() || null,
                          levelType: subjectLevel || null
                        }
                      });
                    setStatus("Subject updated.");
                    resetSubjectForm();
                    await loadSubjects();
                  } catch (err) {
                    setStatus(err instanceof Error ? err.message : "Failed to update subject.");
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving || !schoolId || !editSubjectId}
              >
                Update subject
              </button>
              <button
                className="button ghost"
                onClick={resetSubjectForm}
                disabled={saving && !!editSubjectId}
              >
                Clear
              </button>
            </div>
            {editSubjectId && <p className="muted">Editing subject: {editSubjectId}</p>}
          </div>
          {subjects.length === 0 && <p>No subjects yet.</p>}
          {subjects.length > 0 && (
            <div className="list">
              {subjects.map((subject) => (
                <div key={subject.id} className="line-item">
                  <div>
                    <strong>{subject.name}</strong>
                    <small>{subject.code || "No code"} - {subject.levelType || "Unspecified"}</small>
                  </div>
                  <div className="grid">
                    <button
                      className="button"
                      type="button"
                      onClick={() => {
                        setEditSubjectId(subject.id);
                        setSubjectName(subject.name);
                        setSubjectCode(subject.code || "");
                        setSubjectLevel(subject.levelType || "BOTH");
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="button ghost"
                      type="button"
                      onClick={async () => {
                        if (!authToken || !schoolId) return;
                        setSaving(true);
                        setStatus("");
                        try {
                          await graphqlFetch(
                            `mutation DeleteSubject($schoolId: ID!, $id: ID!) {
                              deleteSubject(schoolId: $schoolId, id: $id)
                            }`,
                            { schoolId, id: subject.id });
                          setStatus("Subject deleted.");
                          if (editSubjectId === subject.id) {
                            resetSubjectForm();
                          }
                          await loadSubjects();
                        } catch (err) {
                          setStatus(err instanceof Error ? err.message : "Failed to delete subject.");
                        } finally {
                          setSaving(false);
                        }
                      }}
                      disabled={saving}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card fade-up delay-2">
          <h3>Create attendance session</h3>
          <div className="form-grid">
            <input
              type="date"
              placeholder="Session date"
              value={newSessionDate}
              onChange={(event) => setNewSessionDate(event.target.value)}
            />
            <input
              placeholder="Taken by user ID"
              value={newSessionTakenBy}
              onChange={(event) => setNewSessionTakenBy(event.target.value)}
            />
            <button
              className="button"
              onClick={async () => {
                if (!authToken || !schoolId || !classGroupId || !newSessionDate) return;
                setSaving(true);
                setStatus("");
                try {
                  const data = await graphqlFetch(
                    `mutation CreateSession($input: CreateAttendanceSessionInput!) {
                      createAttendanceSession(input: $input) { id date }
                    }`,
                    {
                      input: {
                        schoolId,
                        termId: termId || "term_demo_001",
                        classGroupId,
                        date: newSessionDate,
                        takenByUserId: newSessionTakenBy || "user_demo"
                      }
                    });
                  setNewSessionId(data.createAttendanceSession?.id || null);
                  setAttendanceSessionId(data.createAttendanceSession?.id || attendanceSessionId);
                  setStatus(`Attendance session created: ${data.createAttendanceSession?.id || "ok"}.`);
                  await refreshAfterChange();
                } catch (err) {
                  setStatus(err instanceof Error ? err.message : "Failed to create session.");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving || !schoolId || !classGroupId || !newSessionDate}
            >
              Create session
            </button>
            {newSessionId && <p>Last session ID: {newSessionId}</p>}
          </div>
        </div>

        <div className="card fade-up delay-2">
          <h3>Add attendance entry</h3>
          <div className="form-grid">
            <input
              placeholder="Session ID"
              value={attendanceSessionId}
              onChange={(event) => setAttendanceSessionId(event.target.value)}
            />
            <input
              placeholder="Student ID"
              value={newEntryStudentId}
              onChange={(event) => setNewEntryStudentId(event.target.value)}
            />
            <button
              className="button"
              onClick={async () => {
                if (!authToken || !schoolId || !attendanceSessionId || !newEntryStudentId) return;
                setSaving(true);
                setStatus("");
                try {
                  const data = await graphqlFetch(
                    `mutation CreateEntry($input: CreateAttendanceEntryInput!) {
                      createAttendanceEntry(input: $input) { id status studentId }
                    }`,
                    {
                      input: {
                        schoolId,
                        attendanceSessionId,
                        studentId: newEntryStudentId,
                        status: "PRESENT"
                      }
                    });
                  setStatus(`Attendance entry added: ${data.createAttendanceEntry?.id || "ok"}.`);
                  await refreshAfterChange();
                } catch (err) {
                  setStatus(err instanceof Error ? err.message : "Failed to add attendance entry.");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving || !schoolId || !attendanceSessionId || !newEntryStudentId}
            >
              Add entry
            </button>
          </div>
        </div>

        <div className="card fade-up delay-2">
          <h3>Create assessment</h3>
          <div className="form-grid">
            <input
              placeholder="Assessment title"
              value={newAssessmentTitle}
              onChange={(event) => setNewAssessmentTitle(event.target.value)}
            />
            <button
              className="button"
              onClick={async () => {
                if (!authToken || !schoolId || !classGroupId || !subjectId || !termId) return;
                setSaving(true);
                setStatus("");
                try {
                  const data = await graphqlFetch(
                    `mutation CreateAssessment($input: CreateAssessmentInput!) {
                      createAssessment(input: $input) { id title status }
                    }`,
                    {
                      input: {
                        schoolId,
                        termId: termId || "term_demo_001",
                        classGroupId,
                        subjectId,
                        policyId: "policy_demo_001",
                        title: newAssessmentTitle || "Untitled"
                      }
                    });
                  setNewAssessmentId(data.createAssessment?.id || null);
                  setAssessmentId(data.createAssessment?.id || assessmentId);
                  setStatus(`Assessment created: ${data.createAssessment?.id || "ok"}.`);
                  await refreshAfterChange();
                } catch (err) {
                  setStatus(err instanceof Error ? err.message : "Failed to create assessment.");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving || !schoolId || !classGroupId || !subjectId}
            >
              Create assessment
            </button>
            {newAssessmentId && <p>Last assessment ID: {newAssessmentId}</p>}
          </div>
        </div>

        <div className="card fade-up delay-2">
            <h3>Add score entry</h3>
            <div className="form-grid">
            <input
              placeholder="Assessment ID"
              value={assessmentId}
              onChange={(event) => setAssessmentId(event.target.value)}
            />
            <input
              placeholder="Student ID"
              value={newScoreStudentId}
              onChange={(event) => setNewScoreStudentId(event.target.value)}
            />
            <input
              placeholder="Scores JSON"
              value={newScoreJson}
              onChange={(event) => setNewScoreJson(event.target.value)}
            />
            <input
              placeholder="Grade (optional)"
              value={newScoreGrade}
              onChange={(event) => setNewScoreGrade(event.target.value)}
            />
            <input
              type="number"
              placeholder="Total score"
              value={newScoreTotal}
              onChange={(event) => setNewScoreTotal(Number(event.target.value || 0))}
            />
            <button
              className="button"
              onClick={async () => {
                if (!authToken || !schoolId || !assessmentId || !newScoreStudentId) return;
                setSaving(true);
                setStatus("");
                try {
                  const locked = await refreshAssessmentStatus(assessmentId);
                  if (locked) {
                    setStatus("Assessment is locked; cannot add score.");
                    return;
                  }
                  const data = await graphqlFetch(
                    `mutation CreateScore($input: CreateScoreEntryInput!) {
                      createScoreEntry(input: $input) { id studentId totalScore grade }
                    }`,
                    {
                      input: {
                        schoolId,
                        assessmentId,
                        studentId: newScoreStudentId,
                        scoresJson: newScoreJson,
                        totalScore: newScoreTotal,
                        grade: newScoreGrade || null,
                        enteredByUserId: "user_demo",
                        enteredAt: new Date().toISOString()
                      }
                    });
                  setStatus(`Score entry created: ${data.createScoreEntry?.id || "ok"}.`);
                  await refreshAfterChange();
                } catch (err) {
                  setStatus(err instanceof Error ? err.message : "Failed to create score entry.");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving || !schoolId || !assessmentId || !newScoreStudentId || selectedAssessmentLocked}
            >
              Add score
            </button>
            {selectedAssessmentLocked && <p className="warning">Assessment is locked; score edits are disabled.</p>}
          </div>
        </div>

        <div className="card fade-up delay-2">
          <h3>Lock / unlock assessment</h3>
          <div className="form-grid">
            <input
              placeholder="Assessment ID"
              value={lockAssessmentId}
              onChange={(event) => setLockAssessmentId(event.target.value)}
            />
            <div className="grid">
              <button
                className="button"
                onClick={async () => {
                  if (!authToken || !schoolId || !lockAssessmentId) return;
                  setSaving(true);
                  setStatus("");
                try {
                    const data = await graphqlFetch(
                      `mutation LockAssessment($schoolId: ID!, $id: ID!) {
                        lockAssessment(schoolId: $schoolId, id: $id) { id status }
                      }`,
                      { schoolId, id: lockAssessmentId });
                    setStatus(`Assessment locked: ${data.lockAssessment?.status || "LOCKED"}.`);
                    await refreshAfterChange();
                  } catch (err) {
                    setStatus(err instanceof Error ? err.message : "Failed to lock assessment.");
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving || !schoolId || !lockAssessmentId}
              >
                Lock
              </button>
              <button
                className="button"
                onClick={async () => {
                  if (!authToken || !schoolId || !lockAssessmentId) return;
                  setSaving(true);
                  setStatus("");
                try {
                    const data = await graphqlFetch(
                      `mutation UnlockAssessment($schoolId: ID!, $id: ID!) {
                        unlockAssessment(schoolId: $schoolId, id: $id) { id status }
                      }`,
                      { schoolId, id: lockAssessmentId });
                    setStatus(`Assessment unlocked: ${data.unlockAssessment?.status || "OPEN"}.`);
                    await refreshAfterChange();
                  } catch (err) {
                    setStatus(err instanceof Error ? err.message : "Failed to unlock assessment.");
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving || !schoolId || !lockAssessmentId}
              >
                Unlock
              </button>
            </div>
          </div>

          <div className="card">
            <h3>Update score entry</h3>
            <div className="form-grid">
              <input
                placeholder="Score entry ID"
                value={updateScoreId}
                onChange={(event) => setUpdateScoreId(event.target.value)}
              />
              <input
                placeholder="Assessment ID"
                value={assessmentId}
                onChange={(event) => setAssessmentId(event.target.value)}
              />
              <input
                placeholder="Student ID"
                value={newScoreStudentId}
                onChange={(event) => setNewScoreStudentId(event.target.value)}
              />
              <input
                placeholder="Scores JSON (optional)"
                value={updateScoreJson}
                onChange={(event) => setUpdateScoreJson(event.target.value)}
              />
              <input
                type="number"
                placeholder="Total score (optional)"
                value={updateScoreTotal ?? ""}
                onChange={(event) =>
                  setUpdateScoreTotal(event.target.value === "" ? undefined : Number(event.target.value))
                }
              />
              <input
                placeholder="Grade (optional)"
                value={updateScoreGrade}
                onChange={(event) => setUpdateScoreGrade(event.target.value)}
              />
              <button
              className="button"
              onClick={async () => {
                if (!authToken || !schoolId || !updateScoreId || !assessmentId || !newScoreStudentId) return;
                setSaving(true);
                setStatus("");
                try {
                    const locked = await refreshAssessmentStatus(assessmentId);
                    if (locked) {
                      setStatus("Assessment is locked; cannot update score.");
                      return;
                    }
                    await graphqlFetch(
                      `mutation UpdateScore($input: UpdateScoreEntryInput!) {
                        updateScoreEntry(input: $input) { id studentId totalScore grade }
                      }`,
                      {
                        input: {
                          id: updateScoreId,
                          schoolId,
                          assessmentId,
                          studentId: newScoreStudentId,
                          scoresJson: updateScoreJson || null,
                          totalScore: updateScoreTotal,
                          grade: updateScoreGrade || null
                        }
                      });
                    setStatus("Score entry updated.");
                    await refreshAfterChange();
                  } catch (err) {
                    setStatus(err instanceof Error ? err.message : "Failed to update score entry.");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={
                saving || !schoolId || !updateScoreId || !assessmentId || !newScoreStudentId || selectedAssessmentLocked
              }
            >
              Update score
            </button>
            {selectedAssessmentLocked && <p className="warning">Assessment is locked; edits blocked.</p>}
          </div>
        </div>
        </div>

        <div className="grid fade-up delay-2">
          <div className="card">
            <h3>Scores (grid preview)</h3>
            <div className="form-grid">
              <select
                value={scoreGridAssessmentId}
                onChange={(event) => setScoreGridAssessmentId(event.target.value)}
              >
                <option value="">Select assessment (by class/subject/term filters)</option>
                {assessmentList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title} — {a.status}
                  </option>
                ))}
              </select>
              <input
                placeholder="Assessment ID for grid"
                value={scoreGridAssessmentId}
                onChange={(event) => setScoreGridAssessmentId(event.target.value)}
              />
              <small className="muted">
                Lock status: {selectedAssessmentLocked ? "Locked (read-only)" : "Open (editable)"}
              </small>
              <button
                className="button"
                onClick={loadScoreGrid}
                disabled={loading || !schoolId || !scoreGridAssessmentId}
              >
                Load scores
              </button>
            </div>
            {scoreGridRows.length === 0 && <p>No scores loaded.</p>}
            {scoreGridRows.length > 0 && (
              <div className="list">
                {scoreGridRows.map((row) => (
                  <div key={row.id} className="line-item">
                    <div>
                      <strong>{row.studentId}</strong>
                      <small>{row.id}</small>
                    </div>
                    <div className="grid">
                      <input
                        type="number"
                        placeholder="Total"
                        value={gridUpdates[row.id]?.total ?? (row.totalScore ?? "")}
                        onChange={(event) =>
                          setGridUpdates((prev) => ({
                            ...prev,
                            [row.id]: {
                              ...prev[row.id],
                              total: event.target.value === "" ? undefined : Number(event.target.value)
                            }
                          }))
                        }
                        disabled={selectedAssessmentLocked}
                      />
                      <input
                        placeholder="Grade"
                        value={gridUpdates[row.id]?.grade ?? row.grade ?? ""}
                        onChange={(event) =>
                          setGridUpdates((prev) => ({
                            ...prev,
                            [row.id]: { ...prev[row.id], grade: event.target.value }
                          }))
                        }
                        disabled={selectedAssessmentLocked}
                      />
                      <button
                        className="button"
                        disabled={saving || selectedAssessmentLocked}
                        onClick={async () => {
                          if (!authToken || !schoolId || !scoreGridAssessmentId) return;
                          setSaving(true);
                          setStatus("");
                          try {
                            const locked = await refreshAssessmentStatus(scoreGridAssessmentId);
                            if (locked) {
                              setStatus("Assessment is locked; cannot update score.");
                              return;
                            }
                            await graphqlFetch(
                              `mutation UpdateScore($input: UpdateScoreEntryInput!) {
                                updateScoreEntry(input: $input) { id }
                              }`,
                              {
                                input: {
                                  id: row.id,
                                  schoolId,
                                  assessmentId: scoreGridAssessmentId,
                                  studentId: row.studentId,
                                  totalScore: gridUpdates[row.id]?.total ?? row.totalScore,
                                  grade: gridUpdates[row.id]?.grade ?? row.grade
                                }
                              });
                            setStatus(`Score updated for ${row.studentId}.`);
                            await loadScoreGrid();
                          } catch (err) {
                            setStatus(err instanceof Error ? err.message : "Failed to update score.");
                          } finally {
                            setSaving(false);
                          }
                        }}
                      >
                        Save
                      </button>
                    </div>
                    <div>
                      Current: {row.totalScore ?? "-"} {row.grade ? `(${row.grade})` : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h3>Attendance sessions</h3>
            {sessions.length === 0 && <p>No sessions.</p>}
            {sessions.map((s) => (
              <div key={s.id} className="line-item">
                <div>
                  <strong>{s.id}</strong>
                  <small>{s.classGroupId}</small>
                </div>
                <div>{s.date}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3>Attendance entries</h3>
            {entries.length === 0 && <p>No entries.</p>}
            {entries.map((e) => (
              <div key={e.id} className="line-item">
                <div>
                  <strong>{e.studentId}</strong>
                  <small>{e.id}</small>
                </div>
                <span className="badge">{e.status}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <h3>Assessment policies</h3>
            {policies.length === 0 && <p>No policies.</p>}
            {policies.map((p) => (
              <div key={p.id} className="line-item">
                <div>
                  <strong>{p.name}</strong>
                  <small>{p.id}</small>
                </div>
                <span className="badge">{p.isActive ? "Active" : "Inactive"}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <h3>Assessments</h3>
            {assessments.length === 0 && <p>No assessments.</p>}
            {assessments.map((a) => (
              <div key={a.id} className="line-item">
                <div>
                  <strong>{a.title}</strong>
                  <small>{a.id}</small>
                </div>
                <div className="grid">
                  <span className="badge">{a.status}</span>
                  <button
                    className="button"
                    type="button"
                    onClick={() => {
                      setScoreGridAssessmentId(a.id);
                      setAssessmentId(a.id);
                    }}
                  >
                    Use for grid
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3>Scores</h3>
            {scores.length === 0 && <p>No scores.</p>}
            {scores.map((s) => (
              <div key={s.id} className="line-item">
                <div>
                  <strong>{s.studentId}</strong>
                  <small>{s.id}</small>
                </div>
                <div>{s.totalScore ?? "-"} {s.grade ? `(${s.grade})` : ""}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3>Feature flags</h3>
            {features.length === 0 && <p>No feature flags.</p>}
            {features.map((f) => (
              <div key={f.id} className="line-item">
                <div>
                  <strong>{f.code}</strong>
                  <small>{f.id}</small>
                </div>
                <span className="badge">{f.isEnabled ? "On" : "Off"}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

