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
type AcademicSession = {
  id: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  status?: string | null;
};
type Term = {
  id: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  status?: string | null;
};
type ClassGroup = {
  id: string;
  displayName: string;
  classYearId: string;
};

type WizardStepStatus = "not_started" | "in_progress" | "completed";

type FeeWizardStep = {
  id: "fee-items" | "build-schedule" | "preview" | "generate";
  label: string;
  description: string;
};

const STATUS_LABELS: Record<WizardStepStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed"
};

const StatusPill = ({ status }: { status: WizardStepStatus }) => (
  <span className={`status-pill status-${status}`}>{STATUS_LABELS[status]}</span>
);

const FEE_WIZARD_STEPS: FeeWizardStep[] = [
  {
    id: "fee-items",
    label: "Create fee items",
    description: "Set up tuition, levies, and optional items."
  },
  {
    id: "build-schedule",
    label: "Build schedule",
    description: "Pick term + class year, then add line items."
  },
  {
    id: "preview",
    label: "Preview",
    description: "Review the parent invoice breakdown."
  },
  {
    id: "generate",
    label: "Generate invoices",
    description: "Create invoices for a class group."
  }
];

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
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
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
  const [activeStepId, setActiveStepId] = useState<FeeWizardStep["id"]>(FEE_WIZARD_STEPS[0].id);
  const [stepsDrawerOpen, setStepsDrawerOpen] = useState(false);
  const [previewConfirmed, setPreviewConfirmed] = useState(false);
  const [hasGeneratedInvoices, setHasGeneratedInvoices] = useState(false);

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
  const feeItemById = useMemo(() => new Map(feeItems.map((item) => [item.id, item])), [feeItems]);
  const previewLines = useMemo(() => {
    const sortedLines = [...lines].sort((a, b) => a.sortOrder - b.sortOrder);
    return sortedLines.map((line) => {
      const item = feeItemById.get(line.feeItemId);
      const isOptional = line.isOptionalOverride ?? item?.isOptional ?? false;
      return {
        id: line.id,
        name: item?.name || line.feeItemId,
        category: item?.category || "OTHER",
        amount: Number(line.amount) || 0,
        dueDate: line.dueDate,
        isOptional
      };
    });
  }, [lines, feeItemById]);
  const requiredLines = previewLines.filter((line) => !line.isOptional);
  const optionalLines = previewLines.filter((line) => line.isOptional);
  const requiredTotal = requiredLines.reduce((sum, line) => sum + line.amount, 0);
  const optionalTotal = optionalLines.reduce((sum, line) => sum + line.amount, 0);
  const grandTotal = requiredTotal + optionalTotal;
  const optionalItemCount = feeItems.filter((item) => item.isOptional).length;
  const requiredItemCount = feeItems.length - optionalItemCount;
  const selectedSchedule = schedules.find((schedule) => schedule.id === scheduleId);
  const displayCurrency = selectedSchedule?.currency || currency || "NGN";
  const selectedClassYear = classYears.find((year) => year.id === classYearId);
  const classYearLabel = selectedClassYear?.name || classYearId || "Not set";
  const selectedSession = sessions.find((session) => session.id === sessionId);
  const selectedTerm = terms.find((term) => term.id === termId);
  const sessionLabel = selectedSession?.name || sessionId || "Not set";
  const termLabel = selectedTerm?.name || termId || "Not set";
  const selectedClassGroup = classGroups.find((group) => group.id === classGroupId);
  const classGroupLabel = selectedClassGroup?.displayName || classGroupId || "Not set";
  const availableClassGroups = useMemo(() => {
    if (!classYearId) return [];
    return classGroups.filter((group) => group.classYearId === classYearId);
  }, [classGroups, classYearId]);
  const scheduleReady = Boolean(scheduleId && lines.length > 0);
  const stepIndex = Math.max(0, FEE_WIZARD_STEPS.findIndex((step) => step.id === activeStepId));
  const progressPercent = Math.round(((stepIndex + 1) / FEE_WIZARD_STEPS.length) * 100);
  const stepCompletion: Record<FeeWizardStep["id"], boolean> = {
    "fee-items": feeItems.length > 0,
    "build-schedule": scheduleReady,
    preview: previewConfirmed,
    generate: hasGeneratedInvoices
  };
  const isLastStep = stepIndex === FEE_WIZARD_STEPS.length - 1;
  const canContinue = (() => {
    if (activeStepId === "fee-items") return feeItems.length > 0;
    if (activeStepId === "build-schedule") return scheduleReady;
    if (activeStepId === "preview") return previewConfirmed;
    return false;
  })();
  const canGenerate = Boolean(scheduleReady && previewConfirmed && classGroupId && termId && sessionId);
  const statusTone = useMemo(() => {
    const normalized = status.toLowerCase();
    if (normalized.includes("failed") || normalized.includes("error")) return "error";
    if (normalized.includes("created") || normalized.includes("generated") || normalized.includes("loaded")) {
      return "success";
    }
    return "info";
  }, [status]);
  const getStepStatus = (stepId: FeeWizardStep["id"]): WizardStepStatus => {
    if (stepCompletion[stepId]) return "completed";
    if (stepId === activeStepId) return "in_progress";
    return "not_started";
  };
  const goNext = () => {
    if (isLastStep) return;
    const nextStep = FEE_WIZARD_STEPS[stepIndex + 1];
    if (nextStep) setActiveStepId(nextStep.id);
  };
  const goBack = () => {
    if (stepIndex <= 0) return;
    const prevStep = FEE_WIZARD_STEPS[stepIndex - 1];
    if (prevStep) setActiveStepId(prevStep.id);
  };

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

  const loadAcademicStructure = async () => {
    if (!authToken || !schoolId) return;
    setLoading(true);
    setStatus("");
    try {
      const data = await graphqlFetch(
        `query FeeWizardStructure($schoolId: ID!, $sessionLimit: Int, $classYearLimit: Int, $classGroupLimit: Int) {
          sessionsBySchool(schoolId: $schoolId, limit: $sessionLimit) {
            id
            name
            startDate
            endDate
            status
          }
          classYearsBySchool(schoolId: $schoolId, limit: $classYearLimit) { id name }
          classGroupsBySchool(schoolId: $schoolId, limit: $classGroupLimit) {
            id
            displayName
            classYearId
          }
        }`,
        { schoolId, sessionLimit: 50, classYearLimit: 100, classGroupLimit: 300 }
      );
      const sessionList = data.sessionsBySchool || [];
      const sortedSessions = sessionList
        .slice()
        .sort((a: AcademicSession, b: AcademicSession) =>
          String(a.startDate || "").localeCompare(String(b.startDate || ""))
        );
      setSessions(sortedSessions);
      setClassYears(data.classYearsBySchool || []);
      const groupList = data.classGroupsBySchool || [];
      const sortedGroups = groupList
        .slice()
        .sort((a: ClassGroup, b: ClassGroup) => a.displayName.localeCompare(b.displayName));
      setClassGroups(sortedGroups);
      if (!sessionId && sortedSessions.length) {
        setSessionId(sortedSessions[sortedSessions.length - 1].id);
      }
      setStatus("Academic structure loaded.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load academic structure.");
    } finally {
      setLoading(false);
    }
  };

  const loadTerms = async (selectedSessionId: string) => {
    if (!authToken || !selectedSessionId) return;
    setLoading(true);
    setStatus("");
    try {
      const data = await graphqlFetch(
        `query TermsBySession($sessionId: ID!, $limit: Int) {
          termsBySession(sessionId: $sessionId, limit: $limit) {
            id
            name
            startDate
            endDate
            status
          }
        }`,
        { sessionId: selectedSessionId, limit: 20 }
      );
      const termList = data.termsBySession || [];
      const sortedTerms = termList
        .slice()
        .sort((a: Term, b: Term) => String(a.startDate || "").localeCompare(String(b.startDate || "")));
      setTerms(sortedTerms);
      if (!termId && sortedTerms.length) {
        setTermId(sortedTerms[sortedTerms.length - 1].id);
      }
      setStatus("Terms loaded.");
    } catch (err) {
      setTerms([]);
      setStatus(err instanceof Error ? err.message : "Failed to load terms.");
    } finally {
      setLoading(false);
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
    if (!previewConfirmed) {
      setStatus("Confirm the preview before generating invoices.");
      return;
    }
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
      setHasGeneratedInvoices(true);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to generate invoices.");
    } finally {
      setGeneratingInvoices(false);
    }
  };

  useEffect(() => {
    if (authToken && schoolId) {
      loadFeeItems();
      loadAcademicStructure();
    }
  }, [authToken, schoolId]);

  useEffect(() => {
    if (!sessionId) {
      setTerms([]);
      setTermId("");
      return;
    }
    setTerms([]);
    setTermId("");
    loadTerms(sessionId);
  }, [sessionId]);

  useEffect(() => {
    if (!classYearId && classGroupId) {
      setClassGroupId("");
      return;
    }
    if (!classGroupId) return;
    const stillValid = availableClassGroups.some((group) => group.id === classGroupId);
    if (!stillValid) {
      setClassGroupId("");
    }
  }, [availableClassGroups, classGroupId, classYearId]);

  useEffect(() => {
    setPreviewConfirmed(false);
  }, [scheduleId, lines.length]);

  useEffect(() => {
    setHasGeneratedInvoices(false);
  }, [scheduleId, classGroupId, termId, sessionId]);

  return (
    <main className="page">
      <section className="shell wizard-page">
        <div className="wizard-header modern-header">
          <div className="wizard-title-block">
            <span className="chip">Admin</span>
            <h1>Fees setup</h1>
            <p className="muted">Create fee items, build schedules, preview, and generate invoices.</p>
            <div className="wizard-meta">
              <span className="badge">{feeItems.length} items</span>
              {scheduleReady && <span className="badge">Schedule ready</span>}
              {previewConfirmed && <span className="badge">Preview confirmed</span>}
              {hasGeneratedInvoices && <span className="badge">Invoices generated</span>}
            </div>
            {status && <div className={`inline-status ${statusTone}`}>{status}</div>}
          </div>
          <div className="wizard-header-actions">
            <button className="ghost-button mobile-only" type="button" onClick={() => setStepsDrawerOpen(true)}>
              Steps
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                loadFeeItems();
                loadAcademicStructure();
                if (sessionId) loadTerms(sessionId);
                if (termId && classYearId) loadSchedules();
                if (scheduleId) loadScheduleLines(scheduleId);
              }}
              disabled={loading || !schoolId}
            >
              {loading ? "Refreshing..." : "Refresh data"}
            </button>
          </div>
        </div>

        <div className="wizard-mobile-progress">
          <span>
            Step {stepIndex + 1} of {FEE_WIZARD_STEPS.length}
          </span>
          <div className="progress-bar">
            <span style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className={`wizard-shell ${stepsDrawerOpen ? "steps-open" : ""}`}>
          <aside className="wizard-stepper">
            <div className="wizard-stepper-header">
              <strong>Fees steps</strong>
              <button className="icon-button mobile-only" type="button" onClick={() => setStepsDrawerOpen(false)}>
                X
              </button>
            </div>
            {FEE_WIZARD_STEPS.map((step, index) => {
              const isActive = step.id === activeStepId;
              const stepStatus = getStepStatus(step.id);
              return (
                <button
                  key={step.id}
                  type="button"
                  className={`wizard-step ${isActive ? "active" : ""}`}
                  style={{ textAlign: "left", font: "inherit" }}
                  onClick={() => {
                    setActiveStepId(step.id);
                    setStepsDrawerOpen(false);
                  }}
                >
                  <div className="wizard-step-title">
                    <span className="wizard-step-index">{index + 1}</span>
                    <div>
                      <strong>{step.label}</strong>
                      <small className="muted">{step.description}</small>
                    </div>
                  </div>
                  <StatusPill status={stepStatus} />
                </button>
              );
            })}
          </aside>

          <section className="wizard-content">
            {activeStepId === "fee-items" && (
              <div className="card">
                <div className="wizard-card-header">
                  <div>
                    <h3>Step 1: Create fee items</h3>
                    <p className="muted">Set up tuition, levies, and optional items first.</p>
                  </div>
                  <span className="badge">{feeItems.length} items</span>
                </div>
                <div className="wizard-note">
                  Start with required items like tuition or levies. Optional items can be toggled per parent later.
                </div>
                <div className="wizard-two-col">
                  <div className="wizard-column">
                    <div className="panel">
                      <h4>New fee item</h4>
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
                        <button className="button" type="button" onClick={createFeeItem} disabled={saving || !feeItemName}>
                          Create fee item
                        </button>
                      </div>
                    </div>
                    <div className="panel">
                      <div className="panel-header">
                        <div>
                          <h4>Fee items</h4>
                          <p className="muted">All items available for schedules.</p>
                        </div>
                        <button
                          className="ghost-button"
                          type="button"
                          onClick={loadFeeItems}
                          disabled={loading || !schoolId}
                        >
                          Refresh
                        </button>
                      </div>
                      <div className="list">
                        {feeItems.length === 0 && <p>No fee items yet.</p>}
                        {feeItems.map((item) => (
                          <div key={item.id} className="line-item">
                            <div>
                              <strong>{item.name}</strong>
                              <small>{item.category}</small>
                              <small>{item.description || "No description"}</small>
                            </div>
                            <div className="line-item-actions">
                              <span className="badge">{item.isOptional ? "Optional" : "Required"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="wizard-column">
                    <div className="panel">
                      <h4>School context</h4>
                      <div className="form-grid">
                        <input
                          placeholder="School ID"
                          value={schoolIdInput}
                          onChange={(event) => setSchoolIdInput(event.target.value)}
                        />
                      </div>
                      <small className="muted">Used to save fee items to the right school.</small>
                    </div>
                    <div className="panel">
                      <h4>Item summary</h4>
                      <div className="wizard-summary-grid">
                        <div className="wizard-summary-item">
                          <strong>Total items</strong>
                          <span>{feeItems.length}</span>
                        </div>
                        <div className="wizard-summary-item">
                          <strong>Required items</strong>
                          <span>{requiredItemCount}</span>
                        </div>
                        <div className="wizard-summary-item">
                          <strong>Optional items</strong>
                          <span>{optionalItemCount}</span>
                        </div>
                      </div>
                      {feeItems.length === 0 && <p className="muted">Add at least one fee item to continue.</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeStepId === "build-schedule" && (
              <div className="card">
                <div className="wizard-card-header">
                  <div>
                    <h3>Step 2: Build schedule</h3>
                    <p className="muted">Pick term + class year, then add line items.</p>
                  </div>
                  {scheduleId && <span className="badge">{selectedSchedule?.name || "Schedule selected"}</span>}
                </div>
                <div className="wizard-note">
                  Load the term schedules, create one if needed, and add fee lines with due dates.
                </div>
                <div className="wizard-two-col">
                  <div className="wizard-column">
                    <div className="panel">
                      <h4>Schedule context</h4>
                      <div className="form-grid">
                        <input
                          placeholder="School ID"
                          value={schoolIdInput}
                          onChange={(event) => setSchoolIdInput(event.target.value)}
                        />
                        <select value={sessionId} onChange={(event) => setSessionId(event.target.value)}>
                          <option value="">Select session</option>
                          {sessions.map((session) => (
                            <option key={session.id} value={session.id}>
                              {session.name || session.id}
                            </option>
                          ))}
                        </select>
                        {!sessions.length && (
                          <p className="muted">No sessions found. Add sessions in Academic Structure first.</p>
                        )}
                        <select
                          value={termId}
                          onChange={(event) => setTermId(event.target.value)}
                          disabled={!sessionId}
                        >
                          <option value="">Select term</option>
                          {terms.map((term) => (
                            <option key={term.id} value={term.id}>
                              {term.name || term.id}
                            </option>
                          ))}
                        </select>
                        {sessionId && !terms.length && (
                          <p className="muted">No terms found for this session.</p>
                        )}
                        <select value={classYearId} onChange={(event) => setClassYearId(event.target.value)}>
                          <option value="">Select class year</option>
                          {classYears.map((year) => (
                            <option key={year.id} value={year.id}>
                              {year.name}
                            </option>
                          ))}
                        </select>
                        <button
                          className="button secondary"
                          type="button"
                          onClick={loadSchedules}
                          disabled={loading || !termId || !classYearId}
                        >
                          {loading ? "Loading..." : "Load schedules"}
                        </button>
                      </div>
                    </div>
                    <div className="panel">
                      <h4>Create schedule</h4>
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
                          type="button"
                          onClick={createSchedule}
                          disabled={saving || !termId || !classYearId || !scheduleName}
                        >
                          Create schedule
                        </button>
                      </div>
                    </div>
                    <div className="panel">
                      <div className="panel-header">
                        <div>
                          <h4>Schedules</h4>
                          <p className="muted">Select a schedule to edit lines.</p>
                        </div>
                      </div>
                      <div className="list">
                        {schedules.length === 0 && <p>No schedules loaded.</p>}
                        {schedules.map((schedule) => (
                          <div key={schedule.id} className="line-item">
                            <div>
                              <strong>{schedule.name}</strong>
                              <small>{schedule.id}</small>
                            </div>
                            <div className="line-item-actions">
                              <button
                                className="button secondary"
                                type="button"
                                onClick={() => {
                                  setScheduleId(schedule.id);
                                  loadScheduleLines(schedule.id);
                                }}
                              >
                                Edit lines
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="wizard-column">
                    <div className="panel">
                      <div className="panel-header">
                        <div>
                          <h4>Schedule lines</h4>
                          <p className="muted">Add each fee line with due dates.</p>
                        </div>
                        {selectedSchedule && <span className="badge">{selectedSchedule.name}</span>}
                      </div>
                      {!scheduleId && <p className="muted">Select a schedule to add lines.</p>}
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
                          type="button"
                          onClick={createLine}
                          disabled={saving || !scheduleId || !lineFeeItemId || !lineAmountOk || !lineDueDateOk}
                        >
                          Add line
                        </button>
                      </div>
                      <div className="list" style={{ marginTop: 16 }}>
                        {previewLines.length === 0 && <p>No lines loaded.</p>}
                        {previewLines.length > 0 && (
                          <div className="line-item">
                            <div>
                              <strong>Schedule total</strong>
                              <small>{previewLines.length} line(s)</small>
                            </div>
                            <span className="badge">
                              {displayCurrency} {scheduleTotal.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {previewLines.map((line) => (
                          <div key={line.id} className={`line-item ${line.isOptional ? "optional" : ""}`}>
                            <div>
                              <strong>{line.name}</strong>
                              <small>
                                {line.category} · {line.dueDate || "No due date"}
                              </small>
                            </div>
                            <div className="line-item-actions">
                              <span className="badge">{line.isOptional ? "Optional" : "Required"}</span>
                              <span className="badge">
                                {displayCurrency} {line.amount.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeStepId === "preview" && (
              <div className="card">
                <div className="wizard-card-header">
                  <div>
                    <h3>Step 3: Preview</h3>
                    <p className="muted">Review the parent-facing fee breakdown.</p>
                  </div>
                  <span className="badge">{displayCurrency}</span>
                </div>
                <div className="wizard-note">This preview should match the invoice parents will see.</div>
                {previewLines.length === 0 ? (
                  <div className="panel">
                    <p className="muted">Add schedule lines before previewing.</p>
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => setActiveStepId("build-schedule")}
                    >
                      Build schedule
                    </button>
                  </div>
                ) : (
                  <div className="wizard-two-col">
                    <div className="wizard-column">
                      <div className="panel">
                        <h4>Required items</h4>
                        <div className="list">
                          {requiredLines.length === 0 && <p>No required items.</p>}
                          {requiredLines.map((line) => (
                            <div key={line.id} className="line-item">
                              <div>
                                <strong>{line.name}</strong>
                                <small>{line.dueDate || "No due date"}</small>
                              </div>
                              <span className="badge">
                                {displayCurrency} {line.amount.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="preview-total">
                          <span>Required total</span>
                          <span>
                            {displayCurrency} {requiredTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="panel">
                        <h4>Optional items</h4>
                        <div className="list">
                          {optionalLines.length === 0 && <p>No optional items.</p>}
                          {optionalLines.map((line) => (
                            <div key={line.id} className="line-item optional">
                              <div>
                                <strong>{line.name}</strong>
                                <small>{line.dueDate || "No due date"}</small>
                              </div>
                              <span className="badge">
                                {displayCurrency} {line.amount.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="preview-total">
                          <span>Optional total</span>
                          <span>
                            {displayCurrency} {optionalTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="wizard-column">
                      <div className="panel">
                        <h4>Summary</h4>
                        <div className="wizard-summary-grid">
                          <div className="wizard-summary-item">
                            <strong>Required</strong>
                            <span>
                              {displayCurrency} {requiredTotal.toLocaleString()}
                            </span>
                          </div>
                          <div className="wizard-summary-item">
                            <strong>Optional</strong>
                            <span>
                              {displayCurrency} {optionalTotal.toLocaleString()}
                            </span>
                          </div>
                          <div className="wizard-summary-item">
                            <strong>Grand total</strong>
                            <span>
                              {displayCurrency} {grandTotal.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <label className="line-item" style={{ alignItems: "center", marginTop: 12 }}>
                          <span>Preview confirmed</span>
                          <input
                            type="checkbox"
                            checked={previewConfirmed}
                            onChange={(event) => setPreviewConfirmed(event.target.checked)}
                          />
                        </label>
                        {!previewConfirmed && (
                          <p className="muted">Confirm the preview before generating invoices.</p>
                        )}
                      </div>
                      <div className="panel">
                        <h4>Schedule details</h4>
                        <div className="wizard-summary-grid">
                          <div className="wizard-summary-item">
                            <strong>Schedule</strong>
                            <span>{selectedSchedule?.name || "Not selected"}</span>
                          </div>
                          <div className="wizard-summary-item">
                            <strong>Term</strong>
                            <span>{termLabel}</span>
                          </div>
                          <div className="wizard-summary-item">
                            <strong>Class year</strong>
                            <span>{classYearLabel}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeStepId === "generate" && (
              <div className="card">
                <div className="wizard-card-header">
                  <div>
                    <h3>Step 4: Generate invoices</h3>
                    <p className="muted">Create invoices for a class group.</p>
                  </div>
                  <span className="badge">{displayCurrency}</span>
                </div>
                <div className="wizard-note">Generate invoices once the preview is confirmed.</div>
                <div className="wizard-two-col">
                  <div className="wizard-column">
                    <div className="panel">
                      <h4>Invoice batch</h4>
                      <div className="form-grid">
                        {!classYearId ? (
                          <p className="muted">Select a class year to load class groups.</p>
                        ) : (
                          <>
                            <select value={classGroupId} onChange={(event) => setClassGroupId(event.target.value)}>
                              <option value="">Select class group</option>
                              {availableClassGroups.map((group) => (
                                <option key={group.id} value={group.id}>
                                  {group.displayName}
                                </option>
                              ))}
                            </select>
                            {!availableClassGroups.length && (
                              <p className="muted">No class groups found for this class year.</p>
                            )}
                          </>
                        )}
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
                          type="button"
                          onClick={generateInvoicesForClass}
                          disabled={generatingInvoices || !canGenerate}
                        >
                          {generatingInvoices ? "Generating..." : "Generate invoices"}
                        </button>
                      </div>
                      {enrollmentCount > 0 && (
                        <small className="muted">Invoices created: {enrollmentCount}</small>
                      )}
                      {!previewConfirmed && <p className="muted">Confirm the preview before generating.</p>}
                      {!scheduleReady && <p className="muted">Build a schedule with line items first.</p>}
                    </div>
                  </div>
                  <div className="wizard-column">
                    <div className="panel">
                      <h4>Generation context</h4>
                      <div className="wizard-summary-grid">
                        <div className="wizard-summary-item">
                          <strong>Schedule</strong>
                          <span>{selectedSchedule?.name || "Not selected"}</span>
                        </div>
                        <div className="wizard-summary-item">
                          <strong>Session</strong>
                          <span>{sessionLabel}</span>
                        </div>
                        <div className="wizard-summary-item">
                          <strong>Term</strong>
                          <span>{termLabel}</span>
                        </div>
                        <div className="wizard-summary-item">
                          <strong>Session</strong>
                          <span>{sessionLabel}</span>
                        </div>
                        <div className="wizard-summary-item">
                          <strong>Class year</strong>
                          <span>{classYearLabel}</span>
                        </div>
                        <div className="wizard-summary-item">
                          <strong>Class group</strong>
                          <span>{classGroupLabel}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="wizard-actions">
              <div className="wizard-actions-left">
                <button className="button secondary" type="button" onClick={goBack} disabled={stepIndex === 0}>
                  Back
                </button>
              </div>
              <div className="wizard-actions-right">
                {!isLastStep && (
                  <button className="button" type="button" onClick={goNext} disabled={!canContinue}>
                    Save &amp; Continue
                  </button>
                )}
                {isLastStep && (
                  <a className="button secondary" href="/admin/invoices">
                    View invoices
                  </a>
                )}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
