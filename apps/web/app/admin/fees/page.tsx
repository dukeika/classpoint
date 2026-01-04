"use client";

import { useEffect, useMemo, useState } from "react";
import { graphqlFetch } from "../../components/graphql";
import { useStaffAuth } from "../../components/staff-auth";

type FeeItem = {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  isOptional: boolean;
  isActive: boolean;
};

type FeeSchedule = {
  id: string;
  name: string;
  termId: string;
  classYearId: string;
  classGroupId?: string | null;
  currency: string;
  isActive: boolean;
};

type FeeScheduleLine = {
  id: string;
  feeItemId: string;
  amount: number;
  isOptionalOverride?: boolean | null;
  dueDate?: string | null;
  sortOrder: number;
};

type ClassYear = { id: string; name: string };

export default function FeesPage() {
  const { token: authToken, schoolId: sessionSchoolId } = useStaffAuth();
  const [schoolIdInput, setSchoolIdInput] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);
  const [feeItemName, setFeeItemName] = useState("");
  const [feeItemDescription, setFeeItemDescription] = useState("");
  const [feeItemCategory, setFeeItemCategory] = useState("TUITION");
  const [feeItemOptional, setFeeItemOptional] = useState(false);

  const [classYears, setClassYears] = useState<ClassYear[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");
  const [classYearId, setClassYearId] = useState("");
  const [scheduleName, setScheduleName] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [scheduleId, setScheduleId] = useState("");
  const [schedules, setSchedules] = useState<FeeSchedule[]>([]);
  const [lines, setLines] = useState<FeeScheduleLine[]>([]);
  const [classGroupId, setClassGroupId] = useState("");
  const [enrollmentCount, setEnrollmentCount] = useState(0);
  const [generatingInvoices, setGeneratingInvoices] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  const [lineFeeItemId, setLineFeeItemId] = useState("");
  const [lineAmount, setLineAmount] = useState(0);
  const [lineOptionalOverride, setLineOptionalOverride] = useState(false);
  const [lineDueDate, setLineDueDate] = useState("");
  const [lineSortOrder, setLineSortOrder] = useState(1);

  const lineAmountOk = lineAmount > 0;
  const lineDueDateOk = Boolean(lineDueDate);
  const scheduleTotal = lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);

  useEffect(() => {
    if (sessionSchoolId) {
      setSchoolIdInput((prev) => (prev ? prev : sessionSchoolId));
    }
  }, [sessionSchoolId]);

  const schoolId = useMemo(() => schoolIdInput.trim(), [schoolIdInput]);

  const loadFeeItems = async () => {
    if (!authToken || !schoolId) return;
    setLoading(true);
    setStatus("");
    try {
      const data = await graphqlFetch(
        `query FeeItemsBySchool($schoolId: ID!, $limit: Int) {
          feeItemsBySchool(schoolId: $schoolId, limit: $limit) {
            id
            name
            description
            category
            isOptional
            isActive
          }
        }`,
        { schoolId, limit: 100 });
      setFeeItems(data.feeItemsBySchool || []);
      setStatus("Fee items loaded.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load fee items.");
    } finally {
      setLoading(false);
    }
  };

  const createFeeItem = async () => {
    if (!authToken || !schoolId || !feeItemName) return;
    setSaving(true);
    setStatus("");
    try {
      await graphqlFetch(
        `mutation CreateFeeItem($input: CreateFeeItemInput!) {
          createFeeItem(input: $input) { id }
        }`,
        {
          input: {
            schoolId,
            name: feeItemName,
            description: feeItemDescription || null,
            category: feeItemCategory,
            isOptional: feeItemOptional
          }
        });
      setFeeItemName("");
      setFeeItemDescription("");
      setFeeItemOptional(false);
      setStatus("Fee item created.");
      await loadFeeItems();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to create fee item.");
    } finally {
      setSaving(false);
    }
  };

  const loadClassYears = async () => {
    if (!authToken || !schoolId) return;
    try {
      const data = await graphqlFetch(
        `query ClassYearsBySchool($schoolId: ID!, $limit: Int) {
          classYearsBySchool(schoolId: $schoolId, limit: $limit) { id name }
        }`,
        { schoolId, limit: 100 });
      setClassYears(data.classYearsBySchool || []);
    } catch (_err) {
      // Optional for fees setup.
    }
  };

  const loadSchedules = async () => {
    if (!authToken || !termId || !classYearId) return;
    setLoading(true);
    setStatus("");
    try {
      const data = await graphqlFetch(
        `query FeeSchedulesByTerm($termId: ID!, $classYearId: ID!, $limit: Int) {
          feeSchedulesByTerm(termId: $termId, classYearId: $classYearId, limit: $limit) {
            id
            name
            termId
            classYearId
            classGroupId
            currency
            isActive
          }
        }`,
        { termId, classYearId, limit: 20 });
      setSchedules(data.feeSchedulesByTerm || []);
      setStatus("Schedules loaded.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load schedules.");
    } finally {
      setLoading(false);
    }
  };

  const loadScheduleLines = async (id: string) => {
    if (!authToken || !id) return;
    setLoading(true);
    setStatus("");
    try {
      const data = await graphqlFetch(
        `query FeeScheduleLines($feeScheduleId: ID!, $limit: Int) {
          feeScheduleLinesBySchedule(feeScheduleId: $feeScheduleId, limit: $limit) {
            id
            feeItemId
            amount
            isOptionalOverride
            dueDate
            sortOrder
          }
        }`,
        { feeScheduleId: id, limit: 200 });
      setLines(data.feeScheduleLinesBySchedule || []);
      setStatus("Schedule lines loaded.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load schedule lines.");
    } finally {
      setLoading(false);
    }
  };

  const createSchedule = async () => {
    if (!authToken || !schoolId || !sessionId || !termId || !classYearId || !scheduleName) return;
    setSaving(true);
    setStatus("");
    try {
      const data = await graphqlFetch(
        `mutation CreateSchedule($input: CreateFeeScheduleInput!) {
          createFeeSchedule(input: $input) { id }
        }`,
        {
          input: {
            schoolId,
            sessionId,
            termId,
            classYearId,
            name: scheduleName,
            currency,
            isActive: true
          }
        });
      const createdId = data.createFeeSchedule?.id;
      if (createdId) {
        setScheduleId(createdId);
        await loadScheduleLines(createdId);
      }
      await loadSchedules();
      setStatus("Schedule created.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to create schedule.");
    } finally {
      setSaving(false);
    }
  };

  const createLine = async () => {
    if (!authToken || !schoolId || !scheduleId || !lineFeeItemId) return;
    setSaving(true);
    setStatus("");
    try {
      await graphqlFetch(
        `mutation CreateFeeScheduleLine($input: CreateFeeScheduleLineInput!) {
          createFeeScheduleLine(input: $input) { id }
        }`,
        {
          input: {
            schoolId,
            feeScheduleId: scheduleId,
            feeItemId: lineFeeItemId,
            amount: lineAmount,
            isOptionalOverride: lineOptionalOverride,
            dueDate: lineDueDate || null,
            sortOrder: lineSortOrder
          }
        });
      setStatus("Line created.");
      await loadScheduleLines(scheduleId);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to create line.");
    } finally {
      setSaving(false);
    }
  };

  const generateInvoicesForClass = async () => {
    if (!authToken || !schoolId || !termId || !classGroupId || !sessionId || !scheduleId) return;
    if (!window.confirm("Generate invoices for this class group?")) return;
    setGeneratingInvoices(true);
    setStatus("");
    try {
      const result = await graphqlFetch(
        `mutation GenerateClassInvoices($input: GenerateClassInvoicesInput!) {
          generateClassInvoices(input: $input) {
            createdCount
            invoiceIds
            skippedCount
          }
        }`,
        {
          input: {
            schoolId,
            sessionId,
            termId,
            classGroupId,
            feeScheduleId: scheduleId,
            skipDuplicates
          }
        });
      const createdCount = result.generateClassInvoices?.createdCount || 0;
      const skippedCount = result.generateClassInvoices?.skippedCount || 0;
      setEnrollmentCount(createdCount);
      setStatus(
        skippedCount > 0
          ? `Generated ${createdCount} invoices. Skipped ${skippedCount} duplicates.`
          : `Generated ${createdCount} invoices for class group.`
      );
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to generate invoices.");
    } finally {
      setGeneratingInvoices(false);
    }
  };

  useEffect(() => {
    if (authToken && schoolId) {
      loadFeeItems();
      loadClassYears();
    }
  }, [authToken, schoolId]);

  return (
    <main className="page">
      <section className="shell">
        <div className="hero fade-up">
          <div>
            <span className="chip">Admin</span>
            <h1>Fees setup</h1>
            <p>Manage fee items and term schedules.</p>
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
              placeholder="Session ID"
              value={sessionId}
              onChange={(event) => setSessionId(event.target.value)}
            />
            <input placeholder="Term ID" value={termId} onChange={(event) => setTermId(event.target.value)} />
            <input
              placeholder="Class group ID"
              value={classGroupId}
              onChange={(event) => setClassGroupId(event.target.value)}
            />
            <select value={classYearId} onChange={(event) => setClassYearId(event.target.value)}>
              <option value="">Select class year</option>
              {classYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </select>
            <button className="button" onClick={loadSchedules} disabled={loading || !termId || !classYearId}>
              Load schedules
            </button>
            {status && <p>{status}</p>}
          </div>
        </div>

        <div className="grid fade-up delay-2">
          <div className="card">
            <h3>Fee items</h3>
            <div className="form-grid">
              <input
                placeholder="Item name"
                value={feeItemName}
                onChange={(event) => setFeeItemName(event.target.value)}
              />
              <input
                placeholder="Description (optional)"
                value={feeItemDescription}
                onChange={(event) => setFeeItemDescription(event.target.value)}
              />
              <select value={feeItemCategory} onChange={(event) => setFeeItemCategory(event.target.value)}>
                <option value="TUITION">TUITION</option>
                <option value="LEVY">LEVY</option>
                <option value="UNIFORM">UNIFORM</option>
                <option value="BOOKS">BOOKS</option>
                <option value="TRANSPORT">TRANSPORT</option>
                <option value="LUNCH">LUNCH</option>
                <option value="EXAM">EXAM</option>
                <option value="OTHER">OTHER</option>
              </select>
              <label className="line-item" style={{ alignItems: "center" }}>
                <span>Optional</span>
                <input
                  type="checkbox"
                  checked={feeItemOptional}
                  onChange={(event) => setFeeItemOptional(event.target.checked)}
                />
              </label>
              <button className="button" onClick={createFeeItem} disabled={saving || !feeItemName}>
                Create fee item
              </button>
            </div>
            <div className="list" style={{ marginTop: 16 }}>
              {feeItems.length === 0 && <p>No fee items.</p>}
              {feeItems.map((item) => (
                <div key={item.id} className="line-item">
                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.category}</small>
                    <small>{item.description || "No description"}</small>
                  </div>
                  <span className="badge">{item.isOptional ? "Optional" : "Required"}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3>Fee schedules</h3>
            <div className="form-grid">
              <input
                placeholder="Schedule name"
                value={scheduleName}
                onChange={(event) => setScheduleName(event.target.value)}
              />
              {!scheduleName && <p className="muted">Add a schedule name before saving.</p>}
              <input
                placeholder="Currency"
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
              />
              <button
                className="button"
                onClick={createSchedule}
                disabled={saving || !termId || !classYearId || !scheduleName}
              >
                Create schedule
              </button>
            </div>
            <div className="list" style={{ marginTop: 16 }}>
              {schedules.length === 0 && <p>No schedules loaded.</p>}
              {schedules.map((schedule) => (
                <div key={schedule.id} className="line-item">
                  <div>
                    <strong>{schedule.name}</strong>
                    <small>{schedule.id}</small>
                  </div>
                  <button
                    className="button"
                    type="button"
                    onClick={() => {
                      setScheduleId(schedule.id);
                      loadScheduleLines(schedule.id);
                    }}
                  >
                    Edit lines
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3>Schedule lines</h3>
            <div className="form-grid">
              <select value={lineFeeItemId} onChange={(event) => setLineFeeItemId(event.target.value)}>
                <option value="">Select fee item</option>
                {feeItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Amount"
                value={lineAmount}
                onChange={(event) => setLineAmount(Number(event.target.value || 0))}
              />
              {!lineAmountOk && <p className="muted">Amount must be greater than 0.</p>}
              <input
                type="number"
                placeholder="Sort order"
                value={lineSortOrder}
                onChange={(event) => setLineSortOrder(Number(event.target.value || 0))}
              />
              <input
                type="date"
                placeholder="Due date"
                value={lineDueDate}
                onChange={(event) => setLineDueDate(event.target.value)}
              />
              {!lineDueDateOk && <p className="muted">Add a due date for this schedule line.</p>}
              <label className="line-item" style={{ alignItems: "center" }}>
                <span>Optional override</span>
                <input
                  type="checkbox"
                  checked={lineOptionalOverride}
                  onChange={(event) => setLineOptionalOverride(event.target.checked)}
                />
              </label>
              <button
                className="button"
                onClick={createLine}
                disabled={saving || !scheduleId || !lineFeeItemId || !lineAmountOk || !lineDueDateOk}
              >
                Add line
              </button>
            </div>
            <div className="list" style={{ marginTop: 16 }}>
              {lines.length === 0 && <p>No lines loaded.</p>}
              {lines.length > 0 && (
                <div className="line-item">
                  <div>
                    <strong>Schedule total</strong>
                    <small>{lines.length} line(s)</small>
                  </div>
                  <span className="badge">{scheduleTotal.toLocaleString()}</span>
                </div>
              )}
              {lines.map((line) => (
                <div key={line.id} className="line-item">
                  <div>
                    <strong>{line.feeItemId}</strong>
                    <small>{line.dueDate || "No due date"}</small>
                  </div>
                  <span className="badge">{line.amount}</span>
                </div>
              ))}
            </div>
            <div className="form-grid" style={{ marginTop: 16 }}>
              <label className="line-item" style={{ alignItems: "center" }}>
                <span>Skip duplicates</span>
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(event) => setSkipDuplicates(event.target.checked)}
                />
              </label>
              <button
                className="button"
                onClick={generateInvoicesForClass}
                disabled={generatingInvoices || !scheduleId || !classGroupId || !termId || !sessionId}
              >
                {generatingInvoices ? "Generating..." : "Generate class invoices"}
              </button>
              {enrollmentCount > 0 && <small>Enrollments found: {enrollmentCount}</small>}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

