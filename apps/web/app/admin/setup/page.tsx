"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { decodeSchoolId } from "../../components/auth-utils";
import { graphqlFetch } from "../../components/graphql";
import { useStaffAuth } from "../../components/staff-auth";

const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "classpoint.ng";

const buildSchoolBaseUrl = (slug: string, path = "") => {
  if (!slug) return "";
  if (typeof window === "undefined") {
    return `https://${slug}.${rootDomain}${path}`;
  }
  const host = window.location.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) {
    return `http://${slug}.localhost${path}`;
  }
  return `https://${slug}.${rootDomain}${path}`;
};

type AcademicSession = { id: string; name: string; startDate: string; endDate: string; status: string };
type Term = { id: string; name: string; startDate: string; endDate: string; status: string; sessionId: string };
type Level = { id: string; name: string; type: string; sortOrder: number };
type ClassYear = { id: string; name: string; sortOrder: number; levelId: string };
type ClassArm = { id: string; name: string };
type ClassGroup = { id: string; displayName: string; classYearId: string; classArmId?: string | null };
type ImportJob = {
  id: string;
  status: string;
  processedLines?: number | null;
  created?: number | null;
  updated?: number | null;
  skipped?: number | null;
  errors?: number | null;
  errorReportKey?: string | null;
  createdAt?: string | null;
  processedAt?: string | null;
};

type User = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  userType?: string | null;
  status?: string | null;
};

type FeeItem = {
  id: string;
  name: string;
  category: string;
  isOptional: boolean;
  isActive: boolean;
};

type FeeSchedule = {
  id: string;
  name: string;
  termId: string;
  classYearId: string;
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

type SchoolProfile = {
  id: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  logoUrl?: string | null;
  themeJson?: string | null;
};

type SetupStatePayload = {
  version?: number;
  branding?: {
    brandName?: string;
    brandAddress?: string;
    brandCity?: string;
    brandState?: string;
    brandEmail?: string;
    brandPhone?: string;
    brandLogo?: string;
    brandPrimary?: string;
    brandAccent?: string;
  };
  payments?: {
    manualPaymentsEnabled?: boolean;
    paymentProvider?: string;
    paymentsSaved?: boolean;
    lastSavedPaymentsAt?: string | null;
  };
  communications?: {
    smsSenderName?: string;
    smsChannel?: string;
    smsTemplateInvoice?: string;
    smsTemplateReceipt?: string;
    commsSaved?: boolean;
    lastSavedCommsAt?: string | null;
  };
  fees?: {
    scheduleTermId?: string;
    scheduleClassYearId?: string;
    selectedScheduleId?: string;
  };
  staff?: {
    inviteStatusMap?: Record<string, { sentAt: string; channel: string }>;
    staffRoleMap?: Record<string, string>;
    teacherAssignments?: Record<string, { classGroups: string[]; subjects: string[] }>;
  };
  checklist?: {
    checkInvites?: boolean;
    checkFees?: boolean;
    checkFirstInvoice?: boolean;
    pilotReady?: boolean;
    pilotNotes?: string;
    checklistOpenMap?: Record<string, boolean>;
  };
  import?: {
    importStep?: string;
    importReviewTab?: string;
    importProceedWithValidOnly?: boolean;
    importErrorAcknowledged?: Record<string, boolean>;
    importHasHeaders?: boolean;
    importFieldMap?: Record<string, string>;
  };
  ui?: {
    academicTab?: string;
    academicWizardCompleted?: boolean;
    skippedSteps?: Record<string, boolean>;
    stepsDrawerOpen?: boolean;
    teacherFormOpen?: boolean;
  };
};

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const normalizePhone = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const cleaned = trimmed.replace(/[^\d+]/g, "");
  if (!cleaned.startsWith("+")) return "";
  const digits = cleaned.slice(1).replace(/\D/g, "");
  return `+${digits}`;
};

const isValidPhone = (value: string) => /^\+[1-9]\d{7,14}$/.test(normalizePhone(value));
const normalizeImportPhone = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const sciMatch = trimmed.match(/^[0-9.]+e[+-]?\d+$/i);
  if (sciMatch) {
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) return Math.round(numeric).toString();
  }
  return trimmed.replace(/\s+/g, "");
};
const isLikelyImportPhone = (value: string) => {
  const normalized = normalizeImportPhone(value).replace(/^\+/, "");
  return /^\d{8,15}$/.test(normalized);
};

const parseList = (value: string) =>
  value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const parseCsvText = (text: string) => {
  const rows: string[][] = [];
  let current: string[] = [];
  let cell = "";
  let inQuotes = false;
  const normalized = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i];
    const next = normalized[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      current.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      current.push(cell);
      if (current.some((value) => value.trim().length > 0)) {
        rows.push(current);
      }
      current = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell.length || current.length) {
    current.push(cell);
    if (current.some((value) => value.trim().length > 0)) {
      rows.push(current);
    }
  }
  return rows;
};

const buildSessionName = (startYear: number) => `${startYear}/${startYear + 1}`;

const defaultPrimaryYears = (label: string) => Array.from({ length: 6 }, (_, i) => `${label} ${i + 1}`);
const defaultSecondaryYears = () => ["JSS1", "JSS2", "JSS3", "SSS1", "SSS2", "SSS3"];
const defaultNurseryYears = () => ["Nursery 1", "Nursery 2", "KG 1", "KG 2"];

const computeTermRanges = (startDate: string, endDate: string, termCount: number) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf()) || start > end || termCount < 1) {
    return [];
  }
  const dayMs = 24 * 60 * 60 * 1000;
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / dayMs) + 1);
  const termLength = Math.floor(totalDays / termCount);
  const ranges = [];
  for (let i = 0; i < termCount; i += 1) {
    const termStart = new Date(start.getTime() + termLength * i * dayMs);
    const termEnd =
      i === termCount - 1 ? end : new Date(start.getTime() + (termLength * (i + 1) - 1) * dayMs);
    ranges.push({
      start: termStart.toISOString().slice(0, 10),
      end: termEnd.toISOString().slice(0, 10)
    });
  }
  return ranges;
};
const isValidUrl = (value: string) =>
  /^https?:\/\/\S+/i.test(value) || /^data:image\/[a-zA-Z]+;base64,/.test(value);
const csvTemplateHeaders =
  "admissionNo,firstName,lastName,parentPhone,parentEmail,parentName,classGroup,classYear,classArm,term,session";
const csvSampleRow =
  "A1001,John,Doe,+2348012345678,parent@example.com,Mr Doe,Primary 1A,Primary 1,A,1st Term,2025/2026";
const csvHeaderList = [
  "admissionNo",
  "firstName",
  "lastName",
  "parentPhone",
  "parentEmail",
  "parentName",
  "classGroup",
  "classYear",
  "classArm",
  "term",
  "session",
  "classGroupId",
  "classYearId",
  "classArmId",
  "termId",
  "sessionId"
];
const csvPreviewColumns = [
  "admissionNo",
  "firstName",
  "lastName",
  "parentName",
  "parentPhone",
  "parentEmail",
  "classGroup",
  "classYear",
  "classArm",
  "term",
  "session"
];
const importFieldDefinitions = [
  { key: "admissionNo", label: "Admission number", required: true },
  { key: "firstName", label: "First name", required: true },
  { key: "lastName", label: "Last name", required: true },
  { key: "parentPhone", label: "Parent phone", required: true },
  { key: "parentEmail", label: "Parent email" },
  { key: "parentName", label: "Parent name" },
  { key: "classGroup", label: "Class group (e.g., Primary 1A)", group: "classPlacement" },
  { key: "classYear", label: "Class year (e.g., Primary 1)", group: "classPlacement" },
  { key: "classArm", label: "Class arm (e.g., A)", group: "classPlacement" },
  { key: "term", label: "Term (e.g., 1st Term)", group: "termSession" },
  { key: "session", label: "Session (e.g., 2025/2026)", group: "termSession" },
  { key: "classGroupId", label: "Class group ID", advanced: true, group: "classPlacement" },
  { key: "classYearId", label: "Class year ID", advanced: true, group: "classPlacement" },
  { key: "classArmId", label: "Class arm ID", advanced: true, group: "classPlacement" },
  { key: "termId", label: "Term ID", advanced: true, group: "termSession" },
  { key: "sessionId", label: "Session ID", advanced: true, group: "termSession" }
];
const requiredImportFields = importFieldDefinitions.filter((field) => field.required).map((field) => field.key);

const getErrorReportFilename = (job: ImportJob) => {
  if (!job.errorReportKey) return "import-errors.csv";
  const tail = job.errorReportKey.split("/").pop();
  return tail && tail.trim().length > 0 ? tail : "import-errors.csv";
};

const normalizeHeaderKey = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
const buildImportFieldMap = (headers: string[]) => {
  const normalizedHeaders = new Map<string, string>();
  headers.forEach((header) => {
    normalizedHeaders.set(normalizeHeaderKey(header), header);
  });
  const aliases: Record<string, string[]> = {
    admissionNo: ["admissionno", "admissionnumber", "admission"],
    firstName: ["firstname", "first"],
    lastName: ["lastname", "last", "surname"],
    parentPhone: ["parentphone", "phone", "guardianphone", "primaryphone"],
    parentEmail: ["parentemail", "email", "guardianemail"],
    parentName: ["parentname", "guardianname"],
    classGroup: ["classgroup", "class", "classgroupname"],
    classYear: ["classyear", "year", "grade"],
    classArm: ["classarm", "arm", "stream"],
    term: ["term", "semester"],
    session: ["session", "academicsession"]
  };
  const mapping: Record<string, string> = {};
  csvHeaderList.forEach((fieldKey) => {
    const candidates = [normalizeHeaderKey(fieldKey), ...(aliases[fieldKey] || [])];
    const match = candidates.map((candidate) => normalizedHeaders.get(candidate)).find(Boolean);
    if (match) mapping[fieldKey] = match;
  });
  return mapping;
};

type SetupWizardProps = {
  initialSectionId?: string;
  initialSubStep?: string;
};

type SetupStepStatus = "not_started" | "in_progress" | "completed" | "skipped";

const STEP_STATUS_LABELS: Record<SetupStepStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  skipped: "Optional"
};

const StatusPill = ({ status }: { status: SetupStepStatus }) => (
  <span className={`status-pill status-${status}`}>{STEP_STATUS_LABELS[status]}</span>
);

export function SetupWizard({ initialSectionId, initialSubStep }: SetupWizardProps) {
  const { token } = useStaffAuth();
  const schoolId = decodeSchoolId(token);
  const [schoolSlug, setSchoolSlug] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [setupStateId, setSetupStateId] = useState<string | null>(null);
  const [setupStateLoaded, setSetupStateLoaded] = useState(false);
  const [setupStateSaving, setSetupStateSaving] = useState(false);
  const [setupStateSnapshot, setSetupStateSnapshot] = useState("");
  const [brandingStatus, setBrandingStatus] = useState("");

  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [classYears, setClassYears] = useState<ClassYear[]>([]);
  const [classArms, setClassArms] = useState<ClassArm[]>([]);
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [generatedLevels, setGeneratedLevels] = useState<Level[]>([]);
  const [generatedClassYears, setGeneratedClassYears] = useState<ClassYear[]>([]);
  const [generatedClassGroups, setGeneratedClassGroups] = useState<ClassGroup[]>([]);

  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);
  const [feeSchedules, setFeeSchedules] = useState<FeeSchedule[]>([]);
  const [feeLines, setFeeLines] = useState<FeeScheduleLine[]>([]);
  const [feeItemName, setFeeItemName] = useState("");
  const [feeItemCategory, setFeeItemCategory] = useState("TUITION");
  const [feeItemOptional, setFeeItemOptional] = useState(false);
  const [feeItemActive, setFeeItemActive] = useState(true);
  const [scheduleTermId, setScheduleTermId] = useState("");
  const [scheduleClassYearId, setScheduleClassYearId] = useState("");
  const [scheduleName, setScheduleName] = useState("");
  const [scheduleCurrency, setScheduleCurrency] = useState("NGN");
  const [scheduleActive, setScheduleActive] = useState(true);
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [feesYearsRefreshed, setFeesYearsRefreshed] = useState(false);
  const [feeClassYears, setFeeClassYears] = useState<ClassYear[]>([]);
  const [lineFeeItemId, setLineFeeItemId] = useState("");
  const [lineAmount, setLineAmount] = useState("");
  const [lineOptionalOverride, setLineOptionalOverride] = useState(false);
  const [lineDueDate, setLineDueDate] = useState("");
  const [lineSortOrder, setLineSortOrder] = useState(1);
  const [academicTab, setAcademicTab] = useState("sessions");
  const [academicPrimaryEnabled, setAcademicPrimaryEnabled] = useState(true);
  const [academicSecondaryEnabled, setAcademicSecondaryEnabled] = useState(true);
  const [academicArmsEnabled, setAcademicArmsEnabled] = useState(true);
  const [academicWizardStep, setAcademicWizardStep] = useState(1);
  const [academicSchoolType, setAcademicSchoolType] = useState("primary-secondary");
  const [academicPrimaryLabel, setAcademicPrimaryLabel] = useState("Primary");
  const [academicSecondaryLabel, setAcademicSecondaryLabel] = useState("Secondary");
  const [academicIncludeNursery, setAcademicIncludeNursery] = useState(false);
  const [academicIncludePrimary, setAcademicIncludePrimary] = useState(true);
  const [academicIncludeSecondary, setAcademicIncludeSecondary] = useState(true);
  const [academicECCDEEnabled, setAcademicECCDEEnabled] = useState(true);
  const [academicCustomLevelName, setAcademicCustomLevelName] = useState("");
  const [academicShowAdvanced, setAcademicShowAdvanced] = useState(false);
  const [academicManualOpen, setAcademicManualOpen] = useState(false);
  const [showNurseryYearsEditor, setShowNurseryYearsEditor] = useState(false);
  const [showPrimaryYearsEditor, setShowPrimaryYearsEditor] = useState(false);
  const [showSecondaryYearsEditor, setShowSecondaryYearsEditor] = useState(false);
  const [academicWizardCompleted, setAcademicWizardCompleted] = useState(false);
  const [primaryYearsText, setPrimaryYearsText] = useState(defaultPrimaryYears("Primary").join("\n"));
  const [secondaryYearsText, setSecondaryYearsText] = useState(defaultSecondaryYears().join("\n"));
  const [nurseryYearsText, setNurseryYearsText] = useState(defaultNurseryYears().join("\n"));
  const [primaryYearsEdited, setPrimaryYearsEdited] = useState(false);
  const [secondaryYearsEdited, setSecondaryYearsEdited] = useState(false);
  const [nurseryYearsEdited, setNurseryYearsEdited] = useState(false);
  const [wizardSessionStartYear, setWizardSessionStartYear] = useState(new Date().getFullYear());
  const [wizardSessionName, setWizardSessionName] = useState(buildSessionName(new Date().getFullYear()));
  const [wizardSessionDatesLocked, setWizardSessionDatesLocked] = useState(true);
  const [wizardSessionStartDate, setWizardSessionStartDate] = useState(
    `${new Date().getFullYear()}-09-01`
  );
  const [wizardSessionEndDate, setWizardSessionEndDate] = useState(
    `${new Date().getFullYear() + 1}-07-31`
  );
  const [wizardTermCount, setWizardTermCount] = useState(3);
  const [wizardTermNames, setWizardTermNames] = useState(["1st Term", "2nd Term", "3rd Term"]);
  const [wizardTermNamesEdited, setWizardTermNamesEdited] = useState(false);
  const [wizardTermDatesEnabled, setWizardTermDatesEnabled] = useState(false);
  const [wizardTermDates, setWizardTermDates] = useState<{ start: string; end: string }[]>(
    computeTermRanges(`${new Date().getFullYear()}-09-01`, `${new Date().getFullYear() + 1}-07-31`, 3)
  );
  const [wizardArmsEnabled, setWizardArmsEnabled] = useState(false);
  const [wizardArmsMode, setWizardArmsMode] = useState<"letters" | "names" | "custom">("letters");
  const [wizardArmsText, setWizardArmsText] = useState("A, B, C");
  const [wizardArmsPattern, setWizardArmsPattern] = useState("{year}{arm}");
  const [wizardStreamsEnabled, setWizardStreamsEnabled] = useState(false);
  const [wizardStreamsText, setWizardStreamsText] = useState("Science, Arts, Commercial");
  const [wizardSubjectsLater, setWizardSubjectsLater] = useState(true);
  const [wizardPrimaryDefaultSubjects, setWizardPrimaryDefaultSubjects] = useState(true);
  const [wizardSecondaryDefaultSubjects, setWizardSecondaryDefaultSubjects] = useState(true);
  const [wizardPrimarySubjectsText, setWizardPrimarySubjectsText] = useState(
    "English Language, Mathematics, Basic Science, Social Studies, Civic Education"
  );
  const [wizardSecondarySubjectsText, setWizardSecondarySubjectsText] = useState(
    "English Language, Mathematics, Biology, Chemistry, Physics, Civic Education"
  );
  const [wizardMidtermBreakEnabled, setWizardMidtermBreakEnabled] = useState(false);
  const [wizardAssessmentPreset, setWizardAssessmentPreset] = useState("40/60");
  const [checklistOpenMap, setChecklistOpenMap] = useState<Record<string, boolean>>({});
  const [stepsDrawerOpen, setStepsDrawerOpen] = useState(false);
  const [importStep, setImportStep] = useState(initialSubStep || "upload");
  const [importReviewTab, setImportReviewTab] = useState("errors");
  const [importProceedWithValidOnly, setImportProceedWithValidOnly] = useState(false);
  const [skippedSteps, setSkippedSteps] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!initialSectionId) return;
    const target = document.getElementById(initialSectionId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [initialSectionId]);

  useEffect(() => {
    const defaults: Record<string, { nursery: boolean; primary: boolean; secondary: boolean }> = {
      "primary-only": { nursery: false, primary: true, secondary: false },
      "secondary-only": { nursery: false, primary: false, secondary: true },
      "primary-secondary": { nursery: false, primary: true, secondary: true },
      "nursery-primary": { nursery: true, primary: true, secondary: false },
      "nursery-primary-secondary": { nursery: true, primary: true, secondary: true }
    };
    const next = defaults[academicSchoolType] || defaults["primary-secondary"];
    setAcademicIncludeNursery(next.nursery);
    setAcademicIncludePrimary(next.primary);
    setAcademicIncludeSecondary(next.secondary);
    if (!primaryYearsEdited) {
      setPrimaryYearsText(defaultPrimaryYears(academicPrimaryLabel).join("\n"));
    }
    if (!secondaryYearsEdited) {
      setSecondaryYearsText(defaultSecondaryYears().join("\n"));
    }
    if (!nurseryYearsEdited) {
      setNurseryYearsText(defaultNurseryYears().join("\n"));
    }
  }, [academicSchoolType, academicPrimaryLabel, primaryYearsEdited, secondaryYearsEdited, nurseryYearsEdited]);

  useEffect(() => {
    setWizardSessionName(buildSessionName(wizardSessionStartYear));
    if (wizardSessionDatesLocked) {
      setWizardSessionStartDate(`${wizardSessionStartYear}-09-01`);
      setWizardSessionEndDate(`${wizardSessionStartYear + 1}-07-31`);
    }
  }, [wizardSessionStartYear, wizardSessionDatesLocked]);

  useEffect(() => {
    if (wizardTermNamesEdited) return;
    if (wizardTermCount === 2) {
      setWizardTermNames(["1st Term", "2nd Term"]);
    } else {
      setWizardTermNames(["1st Term", "2nd Term", "3rd Term"]);
    }
  }, [wizardTermCount, wizardTermNamesEdited]);

  useEffect(() => {
    const ranges = computeTermRanges(wizardSessionStartDate, wizardSessionEndDate, wizardTermCount);
    if (!ranges.length) return;
    if (!wizardTermDatesEnabled || wizardTermDates.length !== wizardTermCount) {
      setWizardTermDates(ranges);
    }
  }, [wizardTermDatesEnabled, wizardSessionStartDate, wizardSessionEndDate, wizardTermCount]);

  useEffect(() => {
    if (wizardArmsMode === "letters") {
      setWizardArmsText("A, B, C");
      setWizardArmsPattern("{year}{arm}");
    }
    if (wizardArmsMode === "names") {
      setWizardArmsText("Blue, Gold, Green");
      setWizardArmsPattern("{year} {arm}");
    }
  }, [wizardArmsMode]);

  const [sessionName, setSessionName] = useState("2025/2026");
  const [sessionStart, setSessionStart] = useState("");
  const [sessionEnd, setSessionEnd] = useState("");
  const [sessionStatus, setSessionStatus] = useState("ACTIVE");

  const [termSessionId, setTermSessionId] = useState("");
  const [termName, setTermName] = useState("1st Term");
  const [termStart, setTermStart] = useState("");
  const [termEnd, setTermEnd] = useState("");
  const [termStatus, setTermStatus] = useState("ACTIVE");

  const [levelType, setLevelType] = useState("PRIMARY");
  const [levelName, setLevelName] = useState("Primary");
  const [levelSort, setLevelSort] = useState(1);

  const [classYearLevelId, setClassYearLevelId] = useState("");
  const [classYearName, setClassYearName] = useState("Primary 1");
  const [classYearSort, setClassYearSort] = useState(1);

  const [classArmName, setClassArmName] = useState("A");

  const [classGroupYearId, setClassGroupYearId] = useState("");
  const [classGroupArmId, setClassGroupArmId] = useState("");
  const [classGroupDisplayName, setClassGroupDisplayName] = useState("Primary 1A");

  const [importFile, setImportFile] = useState<File | null>(null);
  const [importHasHeaders, setImportHasHeaders] = useState(true);
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importPreviewRows, setImportPreviewRows] = useState<Record<string, string>[]>([]);
  const [importPreviewIssues, setImportPreviewIssues] = useState<string[]>([]);
  const [importPreviewDuplicates, setImportPreviewDuplicates] = useState<string[]>([]);
  const [importPreviewSummary, setImportPreviewSummary] = useState({
    total: 0,
    missingHeaders: 0,
    errors: 0,
    duplicateAdmissions: 0,
    duplicateParentContacts: 0
  });
  const [importFieldMap, setImportFieldMap] = useState<Record<string, string>>({});
  const [importPreviewLoading, setImportPreviewLoading] = useState(false);
  const [importErrorAcknowledged, setImportErrorAcknowledged] = useState<Record<string, boolean>>({});
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [showAdvancedImportFields, setShowAdvancedImportFields] = useState(false);
  const importPreviewRequestId = useRef(0);
  const importFileOk = !importFile || importFile.name.toLowerCase().endsWith(".csv");
  const [uploading, setUploading] = useState(false);
  const [downloadingJobId, setDownloadingJobId] = useState<string | null>(null);
  const [staffStatusNote, setStaffStatusNote] = useState("");
  const [inviteStatusMap, setInviteStatusMap] = useState<Record<string, { sentAt: string; channel: string }>>({});
  const [staffRoleMap, setStaffRoleMap] = useState<Record<string, string>>({});
  const [teacherAssignments, setTeacherAssignments] = useState<
    Record<string, { classGroups: string[]; subjects: string[] }>
  >({});
  const [bursarName, setBursarName] = useState("");
  const [bursarEmail, setBursarEmail] = useState("");
  const [bursarPhone, setBursarPhone] = useState("");
  const [teacherFormOpen, setTeacherFormOpen] = useState(false);
  const [teacherName, setTeacherName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherPhone, setTeacherPhone] = useState("");
  const [teacherClassGroupIds, setTeacherClassGroupIds] = useState<string[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState("");
  const [staffUserType] = useState("STAFF");
  const [staffList, setStaffList] = useState<User[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [checkInvites, setCheckInvites] = useState(false);
  const [checkFees, setCheckFees] = useState(false);
  const [checkFirstInvoice, setCheckFirstInvoice] = useState(false);

  const [profileId, setProfileId] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandAddress, setBrandAddress] = useState("");
  const [brandCity, setBrandCity] = useState("");
  const [brandState, setBrandState] = useState("");
  const [brandEmail, setBrandEmail] = useState("");
  const [brandPhone, setBrandPhone] = useState("");
  const [brandLogo, setBrandLogo] = useState("");
  const [brandLogoLink, setBrandLogoLink] = useState("");
  const [brandPrimary, setBrandPrimary] = useState("#2e6b5a");
  const [brandAccent, setBrandAccent] = useState("#b9772f");

  const [manualPaymentsEnabled, setManualPaymentsEnabled] = useState(true);
  const [paymentProvider, setPaymentProvider] = useState("PAYSTACK");
  const [paymentStatusNote, setPaymentStatusNote] = useState("");
  const [smsSenderName, setSmsSenderName] = useState("ClassPoint");
  const [smsChannel, setSmsChannel] = useState("SMS");
  const [smsTemplateInvoice, setSmsTemplateInvoice] = useState(
    "Hi {{parentName}}, your invoice for {{studentName}} is ready. Amount due: {{amountDue}} by {{dueDate}}."
  );
  const [smsTemplateReceipt, setSmsTemplateReceipt] = useState(
    "Hi {{parentName}}, we received {{amount}} {{currency}}. Receipt: {{receiptNo}}."
  );
  const [smsStatusNote, setSmsStatusNote] = useState("");
  const [feesStatusNote, setFeesStatusNote] = useState("");
  const [paymentsSaved, setPaymentsSaved] = useState(false);
  const [commsSaved, setCommsSaved] = useState(false);
  const [lastSavedBrandingAt, setLastSavedBrandingAt] = useState<string | null>(null);
  const [lastSavedPaymentsAt, setLastSavedPaymentsAt] = useState<string | null>(null);
  const [lastSavedCommsAt, setLastSavedCommsAt] = useState<string | null>(null);
  const [brandingDirty, setBrandingDirty] = useState(false);
  const [paymentsDirty, setPaymentsDirty] = useState(false);
  const [commsDirty, setCommsDirty] = useState(false);
  const [logoLoadError, setLogoLoadError] = useState(false);
  const [pilotReady, setPilotReady] = useState(false);
  const [pilotNotes, setPilotNotes] = useState("");
  const [statusAt, setStatusAt] = useState<string | null>(null);
  const brandEmailOk = !brandEmail || isValidEmail(brandEmail);
  const brandPhoneOk = !brandPhone || isValidPhone(brandPhone);
  const brandLogoOk = !brandLogo || isValidUrl(brandLogo);
  const bursarEmailOk = !bursarEmail || isValidEmail(bursarEmail);
  const bursarPhoneOk = !bursarPhone || isValidPhone(bursarPhone);
  const canInviteBursar = Boolean(
    bursarName && (bursarEmail || bursarPhone) && bursarEmailOk && bursarPhoneOk
  );
  const teacherEmailOk = !teacherEmail || isValidEmail(teacherEmail);
  const teacherPhoneOk = !teacherPhone || isValidPhone(teacherPhone);
  const canInviteTeacher = Boolean(
    teacherName && (teacherEmail || teacherPhone) && teacherEmailOk && teacherPhoneOk
  );
  const {
    hasRequiredMappings,
    classPlacementMapped,
    missingImportMappings,
    mappingsReady
  } = useMemo(() => {
    const requiredMapped = requiredImportFields.every((field) => Boolean(importFieldMap[field]));
    const hasClassGroupMapping = Boolean(importFieldMap.classGroup || importFieldMap.classGroupId);
    const hasClassYearMapping = Boolean(importFieldMap.classYear || importFieldMap.classYearId);
    const hasClassArmMapping = Boolean(importFieldMap.classArm || importFieldMap.classArmId);
    const classPlacementOk = hasClassGroupMapping || (hasClassYearMapping && hasClassArmMapping);
    const missingMappings = [
      ...requiredImportFields.filter((field) => !importFieldMap[field]),
      ...(classPlacementOk ? [] : ["classGroup or classYear + classArm"])
    ];
    return {
      hasRequiredMappings: requiredMapped,
      classPlacementMapped: classPlacementOk,
      missingImportMappings: missingMappings,
      mappingsReady: requiredMapped && classPlacementOk
    };
  }, [importFieldMap, requiredImportFields]);
  const importUploadDisabledReason = useMemo(() => {
    const hasClassYears = (classYears.length ? classYears : generatedClassYears).length > 0;
    const structureReady = sessions.length > 0 && terms.length > 0 && hasClassYears;
    if (!token || !schoolId) return "Sign in again to enable uploads.";
    if (!structureReady) return "Create sessions, terms, and class years first.";
    if (!importFile) return "Select a CSV file to continue.";
    if (!importFileOk) return "Choose a .csv file.";
    if (!mappingsReady) return "Map required columns before uploading.";
    if (uploading) return "Uploading...";
    return "";
  }, [
    token,
    schoolId,
    sessions.length,
    terms.length,
    classYears.length,
    generatedClassYears.length,
    importFile,
    importFileOk,
    mappingsReady,
    uploading
  ]);
  const parseAmount = (value: string) => {
    const raw = value.trim();
    if (!raw) return { normalized: "", amount: Number.NaN };
    const cleaned = raw.replace(/[^0-9.,-]/g, "");
    const normalized = cleaned.replace(/,/g, "").replace(/(\..*)\./g, "$1");
    const parsed = Number.parseFloat(normalized);
    if (Number.isFinite(parsed)) {
      return { normalized, amount: parsed };
    }
    const fallback = Number.parseFloat(raw.replace(/[^0-9.-]/g, ""));
    return { normalized, amount: fallback };
  };
  const { normalized: normalizedLineAmount, amount: lineAmountValue } = parseAmount(lineAmount);
  const lineAmountTouched = lineAmount.trim().length > 0;
  const lineAmountOk = lineAmountTouched && Number.isFinite(lineAmountValue) && lineAmountValue > 0;
  const lineSortOk = Number.isFinite(lineSortOrder) && lineSortOrder > 0;
  const selectedSchedule = feeSchedules.find((schedule) => schedule.id === selectedScheduleId);
  const selectedScheduleTermId = selectedSchedule?.termId || scheduleTermId;
  const selectedTerm = terms.find((item) => item.id === selectedScheduleTermId);
  const feeTermStartDisplay = selectedTerm
    ? selectedTerm.startDate <= selectedTerm.endDate
      ? selectedTerm.startDate
      : selectedTerm.endDate
    : "";
  const feeTermEndDisplay = selectedTerm
    ? selectedTerm.startDate <= selectedTerm.endDate
      ? selectedTerm.endDate
      : selectedTerm.startDate
    : "";
  const feeTermStartDate = feeTermStartDisplay ? new Date(feeTermStartDisplay) : null;
  const feeTermEndDate = feeTermEndDisplay ? new Date(feeTermEndDisplay) : null;
  const feeTermDatesValid =
    feeTermStartDate instanceof Date &&
    feeTermEndDate instanceof Date &&
    !Number.isNaN(feeTermStartDate.valueOf()) &&
    !Number.isNaN(feeTermEndDate.valueOf());
  const feeDueDate = lineDueDate ? new Date(lineDueDate) : null;
  const lineDueDateOk =
    !lineDueDate ||
    !feeTermDatesValid ||
    (feeDueDate instanceof Date &&
      !Number.isNaN(feeDueDate.valueOf()) &&
      feeDueDate >= feeTermStartDate &&
      feeDueDate <= feeTermEndDate);
  const availableLevels = levels.length ? levels : generatedLevels;
  const availableClassYears = classYears.length ? classYears : generatedClassYears;
  const availableClassGroups = classGroups.length ? classGroups : generatedClassGroups;
  const feeYears = feeClassYears.length ? feeClassYears : availableClassYears;
  const structureReady = sessions.length > 0 && availableClassGroups.length > 0;
  const importReady = importJobs.length > 0;
  const brandingReady = Boolean(profileId);
  const feesReady = feeItems.length > 0 && feeSchedules.length > 0 && feeLines.length > 0;
  const sessionsReady = sessions.length > 0;
  const termsReady = terms.length > 0;
  const levelsReady = availableLevels.length > 0;
  const classYearsReady = availableClassYears.length > 0;
  const classArmsReady = classArms.length > 0;
  const classGroupsReady = availableClassGroups.length > 0;
  const staffInvitesReady = staffList.length > 0;
  const canCreateSchedule = terms.length > 0 && feeYears.length > 0;
  const canCreateLines = feeSchedules.length > 0 && feeItems.length > 0;
  const lineBlockers = [
    !schoolId ? "Sign in to add fee lines." : null,
    !selectedScheduleId ? "Select a fee schedule." : null,
    !lineFeeItemId ? "Pick a fee item." : null,
    lineAmountTouched && !lineAmountOk ? "Enter an amount greater than 0." : null,
    lineAmountTouched && (!Number.isFinite(lineAmountValue) || lineAmountValue <= 0)
      ? "Enter an amount greater than 0."
      : null,
    !lineSortOk ? "Sort order must be greater than 0." : null,
    !lineDueDateOk ? "Due date must fall within the selected term." : null,
    !canCreateLines ? "Create fee items and schedules first." : null
  ].filter(Boolean) as string[];
  const importStructureReady = sessionsReady && termsReady && classYearsReady;
  const missingPrereqNotes = [
    !sessionsReady ? "Add an academic session to unlock terms and fee schedules." : null,
    !termsReady ? "Create at least one term to build fee schedules." : null,
    !classYearsReady ? "Create class years before defining fee schedules." : null,
    !classGroupsReady ? "Create class groups to complete academic structure." : null,
    !feeItems.length ? "Create fee items to build schedules and invoices." : null
  ].filter(Boolean) as string[];
  const totalFeeAmount = feeLines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);

  useEffect(() => {
    if (availableClassYears.length === 0) return;
    window.localStorage.setItem("cp.setup.classYears", JSON.stringify(availableClassYears));
  }, [availableClassYears]);

  useEffect(() => {
    if (feeClassYears.length > 0) return;
    const stored = window.localStorage.getItem("cp.setup.classYears");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as ClassYear[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setClassYears(parsed);
        setFeeClassYears(parsed);
      }
    } catch (_err) {
      // ignore stored class year errors
    }
  }, [feeClassYears.length]);

  useEffect(() => {
    if (availableClassYears.length === 0) return;
    setFeeClassYears(availableClassYears);
  }, [availableClassYears]);
  const feePreviewLines = feeLines.map((line) => {
    const item = feeItems.find((feeItem) => feeItem.id === line.feeItemId);
    const optional =
      typeof line.isOptionalOverride === "boolean" ? line.isOptionalOverride : Boolean(item?.isOptional);
    return {
      id: line.id,
      name: item?.name || "Fee item",
      amount: Number(line.amount) || 0,
      optional
    };
  });
  const feePreviewRequired = feePreviewLines.filter((line) => !line.optional);
  const feePreviewOptional = feePreviewLines.filter((line) => line.optional);
  const feePreviewTotal = feePreviewLines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
  const scheduleFormDirty = Boolean(
    scheduleTermId || scheduleClassYearId || scheduleName || scheduleCurrency !== "NGN" || !scheduleActive
  );
  const lineFormDirty = Boolean(lineFeeItemId || lineAmount || lineDueDate || lineSortOrder !== 1 || lineOptionalOverride);
  const latestErrorJob = importJobs.reduce<ImportJob | null>((latest, job) => {
    if (!job.errorReportKey) return latest;
    const latestTime = latest?.processedAt || latest?.createdAt || "";
    const jobTime = job.processedAt || job.createdAt || "";
    if (!latest) return job;
    return jobTime > latestTime ? job : latest;
  }, null);
  const latestImportJob = importJobs.reduce<ImportJob | null>((latest, job) => {
    const latestTime = latest?.processedAt || latest?.createdAt || "";
    const jobTime = job.processedAt || job.createdAt || "";
    if (!latest) return job;
    return jobTime > latestTime ? job : latest;
  }, null);
  const setupChecklist = [
    structureReady,
    brandingReady,
    importReady,
    feesReady,
    paymentsSaved,
    commsSaved
  ];
  const setupProgress = Math.round((setupChecklist.filter(Boolean).length / setupChecklist.length) * 100);
  const setupProgressSteps = setupProgress;
  const goLiveReady = structureReady && brandingReady && feesReady && paymentsSaved && commsSaved;
  const goLiveMissing = [
    !structureReady ? "Academic structure incomplete." : null,
    !brandingReady ? "Branding not saved." : null,
    !feesReady ? "Fees setup incomplete." : null,
    !paymentsSaved ? "Payments setup not saved." : null,
    !commsSaved ? "Communications setup not saved." : null
  ].filter(Boolean) as string[];
  const academicMissing = [
    !sessionsReady ? "sessions" : null,
    !termsReady ? "terms" : null,
    !classYearsReady ? "class years" : null,
    !classGroupsReady ? "class groups" : null
  ].filter(Boolean) as string[];
  const academicStepReady = academicMissing.length === 0 || academicWizardCompleted;
  const brandingMissing = [
    !brandName ? "school name" : null,
    !brandLogo ? "logo" : null,
    !brandEmailOk ? "valid contact email" : null,
    !brandPhoneOk ? "valid contact phone" : null,
    !brandLogoOk ? "valid logo" : null
  ].filter(Boolean) as string[];
  const brandingStepReady = brandingMissing.length === 0 && brandingReady;
  const staffMissing = [
    !staffInvitesReady ? "at least one staff invite" : null,
    Object.keys(inviteStatusMap).length === 0 ? "mark one invite as sent" : null
  ].filter(Boolean) as string[];
  const staffStepReady = staffMissing.length === 0;
  const importMissing = [
    !importReady ? "at least one import job" : null,
    latestImportJob && (latestImportJob.errors ?? 0) > 0 ? "resolve import errors" : null
  ].filter(Boolean) as string[];
  const importStepReady = importMissing.length === 0;
  const feeLineAmountsOk = feeLines.every((line) => Number(line.amount) > 0);
  const feeMissing = [
    feeItems.length === 0 ? "fee items" : null,
    feeSchedules.length === 0 ? "fee schedules" : null,
    feeLines.length === 0 ? "schedule lines" : null,
    !feeLineAmountsOk ? "valid schedule line amounts" : null
  ].filter(Boolean) as string[];
  const feeStepReady = feeMissing.length === 0;
  const paymentsMissing = [
    !paymentsSaved ? "saved payments setup" : null,
    !manualPaymentsEnabled ? "enable manual payments" : null,
    !paymentProvider ? "select a payment provider" : null
  ].filter(Boolean) as string[];
  const paymentsStepReady = paymentsMissing.length === 0;
  const commsRequiredVars = {
    invoice: ["{{parentName}}", "{{studentName}}", "{{amountDue}}", "{{dueDate}}"],
    receipt: ["{{parentName}}", "{{amount}}", "{{currency}}", "{{receiptNo}}"]
  };
  const commsMissingVars = [
    ...commsRequiredVars.invoice.filter((variable) => !smsTemplateInvoice.includes(variable)),
    ...commsRequiredVars.receipt.filter((variable) => !smsTemplateReceipt.includes(variable))
  ];
  const commsMissing = [
    !commsSaved ? "saved communications setup" : null,
    !smsSenderName ? "SMS sender name" : null,
    !smsTemplateInvoice ? "invoice template" : null,
    !smsTemplateReceipt ? "receipt template" : null,
    commsMissingVars.length ? `missing template vars: ${commsMissingVars.join(", ")}` : null
  ].filter(Boolean) as string[];
  const commsStepReady = commsMissing.length === 0;

  useEffect(() => {
    if (academicWizardCompleted) return;
    if (sessionsReady && termsReady && classYearsReady && classGroupsReady) {
      setAcademicWizardCompleted(true);
    }
  }, [academicWizardCompleted, sessionsReady, termsReady, classYearsReady, classGroupsReady]);
  const importStepOrder = ["upload", "map", "review", "results"];
  const importStepIndex = Math.max(0, importStepOrder.indexOf(importStep));
  const statusTone = status
    ? /fail|unable|invalid|error/i.test(status)
      ? "error"
      : /saved|created|updated|loaded|copied|downloaded|applied|reset/i.test(status)
      ? "success"
      : "info"
    : "info";

  const wizardPrimaryYears = academicIncludePrimary ? parseList(primaryYearsText) : [];
  const wizardSecondaryYears = academicIncludeSecondary ? parseList(secondaryYearsText) : [];
  const wizardNurseryYears = academicIncludeNursery && academicECCDEEnabled ? parseList(nurseryYearsText) : [];
  const wizardArms = wizardArmsEnabled ? parseList(wizardArmsText) : [];
  const wizardStreams = wizardStreamsEnabled ? parseList(wizardStreamsText) : [];

  const formatWizardGroupName = (yearName: string, armName?: string, streamName?: string) => {
    let name = yearName;
    if (wizardArmsEnabled && armName) {
      if (wizardArmsMode === "custom") {
        const pattern = wizardArmsPattern || "{year}{arm}";
        name = pattern
          .replace("{year}", yearName)
          .replace("{arm}", armName)
          .replace("{stream}", streamName || "");
      } else if (wizardArmsMode === "names") {
        name = `${yearName} ${armName}`;
      } else {
        name = `${yearName}${armName}`;
      }
    }
    if (streamName) {
      if (!(wizardArmsMode === "custom" && wizardArmsPattern.includes("{stream}"))) {
        name = `${name} ${streamName}`;
      }
    }
    return name.trim().replace(/\s+/g, " ");
  };

  const getWizardGroupPreview = (yearName: string) => {
    const isSenior = wizardStreamsEnabled && yearName.toLowerCase().startsWith("ss");
    const streams = isSenior && wizardStreams.length ? wizardStreams : [];
    const arms = wizardArmsEnabled ? (wizardArms.length ? wizardArms : ["A"]) : [""];
    if (streams.length) {
      return streams.flatMap((stream) =>
        arms.map((arm) => formatWizardGroupName(yearName, arm || undefined, stream))
      );
    }
    return arms.map((arm) => formatWizardGroupName(yearName, arm || undefined));
  };

  const wizardGroupPreview = [
    academicIncludeNursery ? { label: "Nursery", years: wizardNurseryYears } : null,
    academicIncludePrimary ? { label: academicPrimaryLabel || "Primary", years: wizardPrimaryYears } : null,
    academicIncludeSecondary ? { label: academicSecondaryLabel || "Secondary", years: wizardSecondaryYears } : null
  ].filter(Boolean) as { label: string; years: string[] }[];

  const stepStatusMap: Record<string, SetupStepStatus> = {
    "setup-branding": skippedSteps["setup-branding"]
      ? "skipped"
      : brandingReady
      ? "completed"
      : brandName || brandLogo || brandEmail || brandPhone
      ? "in_progress"
      : "not_started",
    "setup-academic": skippedSteps["setup-academic"]
      ? "skipped"
      : academicStepReady
      ? "completed"
      : sessionsReady || termsReady || classYearsReady || classGroupsReady
      ? "in_progress"
      : "not_started",
    "setup-staff": skippedSteps["setup-staff"]
      ? "skipped"
      : staffStepReady
      ? "completed"
      : staffInvitesReady
      ? "in_progress"
      : "not_started",
    "setup-import": skippedSteps["setup-import"]
      ? "skipped"
      : importStepReady
      ? "completed"
      : importReady
      ? "in_progress"
      : "not_started",
    "setup-fee-items": skippedSteps["setup-fee-items"]
      ? "skipped"
      : feeStepReady
      ? "completed"
      : feeItems.length || feeSchedules.length
      ? "in_progress"
      : "not_started",
    "setup-payments": skippedSteps["setup-payments"]
      ? "skipped"
      : paymentsStepReady
      ? "completed"
      : paymentsSaved
      ? "in_progress"
      : "not_started",
    "setup-comms": skippedSteps["setup-comms"]
      ? "skipped"
      : commsStepReady
      ? "completed"
      : commsSaved
      ? "in_progress"
      : "not_started",
    "setup-checklist": goLiveReady ? "completed" : "in_progress"
  };

  const stepMeta = [
    {
      stepId: "setup-branding",
      label: "School Profile & Branding",
      description: "Set the school identity, contact details, and portal branding.",
      criteria: "Name, city/state, contact, logo, primary color saved."
    },
    {
      stepId: "setup-academic",
      label: "Academic Structure",
      description: "Create levels, class years, arms, and class groups.",
      criteria: "At least one class year and class groups created."
    },
    {
      stepId: "setup-staff",
      label: "Staff & Roles",
      description: "Invite the bursar and teachers, then assign roles.",
      criteria: "Bursar invited or explicitly skipped."
    },
    {
      stepId: "setup-import",
      label: "Students & Parents Import",
      description: "Upload CSV, validate, and import parent-linked students.",
      criteria: "At least one student imported or explicitly skipped."
    },
    {
      stepId: "setup-fee-items",
      label: "Fees Setup",
      description: "Define fee items, schedules, and preview parent invoices.",
      criteria: "Schedules created and preview confirmed."
    },
    {
      stepId: "setup-payments",
      label: "Payments",
      description: "Pick provider, save configuration, and test workflow.",
      criteria: "Provider saved and test completed or deferred."
    },
    {
      stepId: "setup-comms",
      label: "Communications",
      description: "Configure SMS and templates, then send a test message.",
      criteria: "Provider configured and test sent or deferred."
    },
    {
      stepId: "setup-checklist",
      label: "Go-Live Review",
      description: "Confirm readiness and mark setup complete.",
      criteria: "All required steps completed."
    }
  ];

  const stepOrder = stepMeta.map((step) => step.stepId);
  const stepRouteMap: Record<string, string> = {
    "setup-branding": "/admin/setup/branding",
    "setup-academic": "/admin/setup/academic-structure",
    "setup-staff": "/admin/setup/staff-roles",
    "setup-import": "/admin/setup/import/upload",
    "setup-fee-items": "/admin/setup/fees",
    "setup-payments": "/admin/setup/payments",
    "setup-comms": "/admin/setup/communications",
    "setup-checklist": "/admin/setup/review"
  };
  const importStepRoutes: Record<string, string> = {
    upload: "/admin/setup/import/upload",
    map: "/admin/setup/import/map",
    review: "/admin/setup/import/review",
    results: "/admin/setup/import/results"
  };

  const stepLabelMap: Record<string, string> = stepMeta.reduce((acc, step) => {
    acc[step.stepId] = step.label;
    return acc;
  }, {} as Record<string, string>);

  const stepIndex = initialSectionId ? stepOrder.indexOf(initialSectionId) : -1;
  const prevStepId = stepIndex > 0 ? stepOrder[stepIndex - 1] : null;
  const nextStepId = stepIndex >= 0 && stepIndex < stepOrder.length - 1 ? stepOrder[stepIndex + 1] : null;
  const prevStepHref = prevStepId ? stepRouteMap[prevStepId] : "";
  const nextStepHref = nextStepId ? stepRouteMap[nextStepId] : "";
  const prevStepLabel = prevStepId ? stepLabelMap[prevStepId] : "";
  const nextStepLabel = nextStepId ? stepLabelMap[nextStepId] : "";

  const stepValidationMap: Record<string, { ready: boolean; message: string }> = {
    "setup-branding": {
      ready: brandingStepReady,
      message: brandingMissing.length
        ? `Complete ${brandingMissing.join(", ")} before continuing.`
        : "Branding saved."
    },
    "setup-academic": {
      ready: academicStepReady,
      message: academicMissing.length
        ? `Complete ${academicMissing.join(", ")} before continuing.`
        : "Academic structure complete."
    },
    "setup-staff": {
      ready: staffStepReady,
      message: staffMissing.length
        ? `Complete ${staffMissing.join(", ")} before continuing.`
        : "Staff invites added."
    },
    "setup-import": {
      ready: importStepReady,
      message: importMissing.length
        ? `Complete ${importMissing.join(", ")} before continuing.`
        : "Import completed."
    },
    "setup-fee-items": {
      ready: feeStepReady,
      message: feeMissing.length
        ? `Complete ${feeMissing.join(", ")} before continuing.`
        : "Fees configured."
    },
    "setup-payments": {
      ready: paymentsStepReady,
      message: paymentsMissing.length
        ? `Complete ${paymentsMissing.join(", ")} before continuing.`
        : "Payments setup saved."
    },
    "setup-comms": {
      ready: commsStepReady,
      message: commsMissing.length
        ? `Complete ${commsMissing.join(", ")} before continuing.`
        : "Communications setup saved."
    },
    "setup-checklist": { ready: goLiveReady, message: "Finish setup items to complete go-live checklist." }
  };
  const activeStepValidation =
    initialSectionId && stepValidationMap[initialSectionId]
      ? stepValidationMap[initialSectionId]
      : null;
  const canGoNext = !activeStepValidation || activeStepValidation.ready;
  const activeStepStatus = initialSectionId ? stepStatusMap[initialSectionId] : "not_started";

  const isStepView = Boolean(initialSectionId);
  const isSectionVisible = (sectionId: string) => {
    if (!isStepView || !initialSectionId) return true;
    if (initialSectionId.startsWith("setup-fee") && sectionId.startsWith("setup-fee")) return true;
    return initialSectionId === sectionId;
  };
  const isImportSubStepVisible = (stepId: string) =>
    !isStepView || initialSectionId !== "setup-import" || importStep === stepId;
  const isAcademicStep = isStepView && initialSectionId === "setup-academic";
  const isAcademicTabVisible = (tabId: string) => !isAcademicStep || academicTab === tabId;
  const checklistItems = [
    {
      stepId: "setup-branding",
      title: "Branding setup",
      items: [
        { label: "School name", ok: Boolean(brandName) },
        { label: "Logo", ok: Boolean(brandLogo) && brandLogoOk },
        { label: "Contact email", ok: brandEmailOk && Boolean(brandEmail) },
        { label: "Contact phone", ok: brandPhoneOk && Boolean(brandPhone) },
        { label: "Branding saved", ok: brandingReady }
      ]
    },
    {
      stepId: "setup-academic",
      title: "Academic structure",
      items: [
        { label: "Sessions created", ok: sessionsReady },
        { label: "Terms created", ok: termsReady },
        { label: "Class years created", ok: classYearsReady },
        { label: "Class groups created", ok: classGroupsReady }
      ]
    },
    {
      stepId: "setup-staff",
      title: "Staff invites",
      items: [
        { label: "At least one invite", ok: staffInvitesReady },
        { label: "Invite sent", ok: Object.keys(inviteStatusMap).length > 0 }
      ]
    },
    {
      stepId: "setup-import",
      title: "CSV import",
      items: [
        { label: "Import job created", ok: importReady },
        { label: "Latest import has no errors", ok: !latestImportJob || (latestImportJob.errors ?? 0) === 0 }
      ]
    },
    {
      stepId: "setup-fee-items",
      title: "Fees setup",
      items: [
        { label: "Fee items created", ok: feeItems.length > 0 },
        { label: "Fee schedules created", ok: feeSchedules.length > 0 },
        { label: "Schedule lines added", ok: feeLines.length > 0 },
        { label: "All line amounts valid", ok: feeLineAmountsOk }
      ]
    },
    {
      stepId: "setup-payments",
      title: "Payments setup",
      items: [
        { label: "Manual payments enabled", ok: manualPaymentsEnabled },
        { label: "Provider selected", ok: Boolean(paymentProvider) },
        { label: "Payments setup saved", ok: paymentsSaved }
      ]
    },
    {
      stepId: "setup-comms",
      title: "Communications setup",
      items: [
        { label: "Sender name set", ok: Boolean(smsSenderName) },
        { label: "Invoice template set", ok: Boolean(smsTemplateInvoice) },
        { label: "Receipt template set", ok: Boolean(smsTemplateReceipt) },
        { label: "Required variables included", ok: commsMissingVars.length === 0 },
        { label: "Communications saved", ok: commsSaved }
      ]
    },
    {
      stepId: "setup-checklist",
      title: "Go-live checklist",
      items: [
        { label: "Academic structure ready", ok: structureReady },
        { label: "Branding ready", ok: brandingReady },
        { label: "Fees ready", ok: feesReady },
        { label: "Payments ready", ok: paymentsSaved },
        { label: "Communications ready", ok: commsSaved }
      ]
    }
  ];

  const renderChecklist = (stepId: string, label: string) => {
    const items = checklistItems.find((item) => item.stepId === stepId)?.items;
    if (!items || items.length === 0) return null;
    const isOpen = checklistOpenMap[stepId] ?? isStepView;
    return (
      <div className="list checklist">
        <div className="line-item">
          <div>
            <strong>{label}</strong>
            <small>{isOpen ? "Hide" : "Show"} requirement checks.</small>
          </div>
          <button
            className="ghost-button"
            type="button"
            onClick={() =>
              setChecklistOpenMap((prev) => {
                const next = { ...prev, [stepId]: !(prev[stepId] ?? isStepView) };
                window.localStorage.setItem("cp.setup.checklistOpen", JSON.stringify(next));
                return next;
              })
            }
          >
            {isOpen ? "Hide" : "Show"}
          </button>
        </div>
        {isOpen &&
          items.map((item) => (
            <div key={item.label} className="line-item">
              <span>{item.label}</span>
              <span className="badge">{item.ok ? "Ready" : "Pending"}</span>
            </div>
          ))}
      </div>
    );
  };

  const buildSetupStatePayload = (): SetupStatePayload => ({
    version: 1,
    branding: {
      brandName,
      brandAddress,
      brandCity,
      brandState,
      brandEmail,
      brandPhone,
      brandLogo,
      brandPrimary,
      brandAccent
    },
    payments: {
      manualPaymentsEnabled,
      paymentProvider,
      paymentsSaved,
      lastSavedPaymentsAt
    },
    communications: {
      smsSenderName,
      smsChannel,
      smsTemplateInvoice,
      smsTemplateReceipt,
      commsSaved,
      lastSavedCommsAt
    },
    fees: {
      scheduleTermId,
      scheduleClassYearId,
      selectedScheduleId
    },
    staff: {
      inviteStatusMap,
      staffRoleMap,
      teacherAssignments
    },
    checklist: {
      checkInvites,
      checkFees,
      checkFirstInvoice,
      pilotReady,
      pilotNotes,
      checklistOpenMap
    },
    import: {
      importStep,
      importReviewTab,
      importProceedWithValidOnly,
      importErrorAcknowledged,
      importHasHeaders,
      importFieldMap
    },
    ui: {
      academicTab,
      academicWizardCompleted,
      skippedSteps,
      stepsDrawerOpen,
      teacherFormOpen
    }
  });

  const applySetupStatePayload = (payload: SetupStatePayload) => {
    if (!payload) return;
    if (payload.branding) {
      if (typeof payload.branding.brandName === "string") setBrandName(payload.branding.brandName);
      if (typeof payload.branding.brandAddress === "string") setBrandAddress(payload.branding.brandAddress);
      if (typeof payload.branding.brandCity === "string") setBrandCity(payload.branding.brandCity);
      if (typeof payload.branding.brandState === "string") setBrandState(payload.branding.brandState);
      if (typeof payload.branding.brandEmail === "string") setBrandEmail(payload.branding.brandEmail);
      if (typeof payload.branding.brandPhone === "string") setBrandPhone(payload.branding.brandPhone);
      if (typeof payload.branding.brandLogo === "string") {
        setBrandLogo(payload.branding.brandLogo);
        setLogoLoadError(false);
        if (/^https?:\/\//i.test(payload.branding.brandLogo)) {
          setBrandLogoLink(payload.branding.brandLogo);
        } else {
          setBrandLogoLink("");
        }
      }
      if (typeof payload.branding.brandPrimary === "string") setBrandPrimary(payload.branding.brandPrimary);
      if (typeof payload.branding.brandAccent === "string") setBrandAccent(payload.branding.brandAccent);
    }
    if (payload.payments) {
      if (typeof payload.payments.manualPaymentsEnabled === "boolean") {
        setManualPaymentsEnabled(payload.payments.manualPaymentsEnabled);
      }
      if (typeof payload.payments.paymentProvider === "string") setPaymentProvider(payload.payments.paymentProvider);
      if (typeof payload.payments.paymentsSaved === "boolean") {
        if (!paymentsSaved || payload.payments.paymentsSaved) {
          setPaymentsSaved(payload.payments.paymentsSaved);
        }
      }
      if (payload.payments.lastSavedPaymentsAt !== undefined) {
        setLastSavedPaymentsAt(payload.payments.lastSavedPaymentsAt || null);
      }
    }
    if (payload.communications) {
      if (typeof payload.communications.smsSenderName === "string") setSmsSenderName(payload.communications.smsSenderName);
      if (typeof payload.communications.smsChannel === "string") setSmsChannel(payload.communications.smsChannel);
      if (typeof payload.communications.smsTemplateInvoice === "string") {
        setSmsTemplateInvoice(payload.communications.smsTemplateInvoice);
      }
      if (typeof payload.communications.smsTemplateReceipt === "string") {
        setSmsTemplateReceipt(payload.communications.smsTemplateReceipt);
      }
      if (typeof payload.communications.commsSaved === "boolean") {
        if (!commsSaved || payload.communications.commsSaved) {
          setCommsSaved(payload.communications.commsSaved);
        }
      }
      if (payload.communications.lastSavedCommsAt !== undefined) {
        setLastSavedCommsAt(payload.communications.lastSavedCommsAt || null);
      }
    }
    if (payload.fees) {
      if (typeof payload.fees.scheduleTermId === "string") setScheduleTermId(payload.fees.scheduleTermId);
      if (typeof payload.fees.scheduleClassYearId === "string") {
        setScheduleClassYearId(payload.fees.scheduleClassYearId);
      }
      if (typeof payload.fees.selectedScheduleId === "string") setSelectedScheduleId(payload.fees.selectedScheduleId);
    }
    if (payload.staff) {
      if (payload.staff.inviteStatusMap !== undefined) setInviteStatusMap(payload.staff.inviteStatusMap || {});
      if (payload.staff.staffRoleMap !== undefined) setStaffRoleMap(payload.staff.staffRoleMap || {});
      if (payload.staff.teacherAssignments !== undefined) {
        setTeacherAssignments(payload.staff.teacherAssignments || {});
      }
    }
    if (payload.checklist) {
      if (typeof payload.checklist.checkInvites === "boolean") setCheckInvites(payload.checklist.checkInvites);
      if (typeof payload.checklist.checkFees === "boolean") setCheckFees(payload.checklist.checkFees);
      if (typeof payload.checklist.checkFirstInvoice === "boolean") {
        setCheckFirstInvoice(payload.checklist.checkFirstInvoice);
      }
      if (typeof payload.checklist.pilotReady === "boolean") setPilotReady(payload.checklist.pilotReady);
      if (typeof payload.checklist.pilotNotes === "string") setPilotNotes(payload.checklist.pilotNotes);
      if (payload.checklist.checklistOpenMap !== undefined) {
        setChecklistOpenMap(payload.checklist.checklistOpenMap || {});
      }
    }
    if (payload.import) {
      if (!initialSubStep && typeof payload.import.importStep === "string") {
        setImportStep(payload.import.importStep);
      }
      if (typeof payload.import.importReviewTab === "string") setImportReviewTab(payload.import.importReviewTab);
      if (typeof payload.import.importProceedWithValidOnly === "boolean") {
        setImportProceedWithValidOnly(payload.import.importProceedWithValidOnly);
      }
      if (payload.import.importErrorAcknowledged !== undefined) {
        setImportErrorAcknowledged(payload.import.importErrorAcknowledged || {});
      }
      if (typeof payload.import.importHasHeaders === "boolean") setImportHasHeaders(payload.import.importHasHeaders);
      if (payload.import.importFieldMap !== undefined) setImportFieldMap(payload.import.importFieldMap || {});
    }
    if (payload.ui) {
      if (typeof payload.ui.academicTab === "string") setAcademicTab(payload.ui.academicTab);
      if (typeof payload.ui.academicWizardCompleted === "boolean") {
        setAcademicWizardCompleted(payload.ui.academicWizardCompleted);
      }
      if (payload.ui.skippedSteps !== undefined) setSkippedSteps(payload.ui.skippedSteps || {});
      if (typeof payload.ui.stepsDrawerOpen === "boolean") setStepsDrawerOpen(payload.ui.stepsDrawerOpen);
      if (typeof payload.ui.teacherFormOpen === "boolean") setTeacherFormOpen(payload.ui.teacherFormOpen);
    }
  };

  const loadSetupState = async () => {
    if (!schoolId || !token) return;
    try {
      const data = await graphqlFetch(
        `query SetupStateBySchool($schoolId: ID!, $limit: Int) {
          setupStateBySchool(schoolId: $schoolId, limit: $limit) {
            id
            schoolId
            stateJson
            updatedAt
          }
        }`,
        { schoolId, limit: 1 },
        token
      );
      const record = data?.setupStateBySchool?.[0];
      if (record?.stateJson) {
        setSetupStateId(record.id || schoolId);
        try {
          const parsed = JSON.parse(record.stateJson) as SetupStatePayload;
          applySetupStatePayload(parsed);
          setSetupStateSnapshot(JSON.stringify(parsed));
          setStatus("Draft loaded.");
        } catch (_err) {
          setStatus("Failed to read saved setup draft.");
        }
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load setup draft.");
    } finally {
      setSetupStateLoaded(true);
    }
  };

  const persistSetupState = async (payload: SetupStatePayload) => {
    if (!schoolId || !token) return;
    setSetupStateSaving(true);
    const stateJson = JSON.stringify(payload);
    const input = {
      id: setupStateId || schoolId,
      schoolId,
      stateJson
    };
    try {
      if (setupStateId) {
        await graphqlFetch(
          `mutation UpdateSchoolSetupState($input: UpdateSchoolSetupStateInput!) {
            updateSchoolSetupState(input: $input) { id }
          }`,
          { input },
          token
        );
      } else {
        const data = await graphqlFetch(
          `mutation CreateSchoolSetupState($input: CreateSchoolSetupStateInput!) {
            createSchoolSetupState(input: $input) { id }
          }`,
          { input },
          token
        );
        setSetupStateId(data?.createSchoolSetupState?.id || input.id);
      }
    } catch (err) {
      if (setupStateId) {
        try {
          const data = await graphqlFetch(
            `mutation CreateSchoolSetupState($input: CreateSchoolSetupStateInput!) {
              createSchoolSetupState(input: $input) { id }
            }`,
            { input },
            token
          );
          setSetupStateId(data?.createSchoolSetupState?.id || input.id);
        } catch (createErr) {
          setStatus(createErr instanceof Error ? createErr.message : "Failed to save setup draft.");
        }
      } else {
        setStatus(err instanceof Error ? err.message : "Failed to save setup draft.");
      }
    } finally {
      setSetupStateSaving(false);
    }
  };
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setSessionStart(today);
    setSessionEnd(today);
    setTermStart(today);
    setTermEnd(today);
    const storedInvites = window.localStorage.getItem("cp.checklist.invites") === "true";
    const storedFees = window.localStorage.getItem("cp.checklist.fees") === "true";
    const storedInvoice = window.localStorage.getItem("cp.checklist.invoice") === "true";
    setCheckInvites(storedInvites);
    setCheckFees(storedFees);
    setCheckFirstInvoice(storedInvoice);
    const storedPilotReady = window.localStorage.getItem("cp.checklist.pilotReady") === "true";
    setPilotReady(storedPilotReady);
    const storedPilotNotes = window.localStorage.getItem("cp.checklist.pilotNotes") || "";
    setPilotNotes(storedPilotNotes);
    const storedPayments = window.localStorage.getItem("cp.setup.payments");
    if (storedPayments) {
      try {
        setPaymentsSaved(true);
        setLastSavedPaymentsAt(new Date().toISOString());
        const parsed = JSON.parse(storedPayments) as {
          manualPaymentsEnabled?: boolean;
          paymentProvider?: string;
        };
        if (typeof parsed.manualPaymentsEnabled === "boolean") {
          setManualPaymentsEnabled(parsed.manualPaymentsEnabled);
        }
        if (parsed.paymentProvider) {
          setPaymentProvider(parsed.paymentProvider);
        }
      } catch (_err) {
        // ignore local storage parsing errors
      }
    }
    const storedComms = window.localStorage.getItem("cp.setup.communications");
    if (storedComms) {
      try {
        setCommsSaved(true);
        setLastSavedCommsAt(new Date().toISOString());
        const parsed = JSON.parse(storedComms) as {
          smsSenderName?: string;
          smsChannel?: string;
          smsTemplateInvoice?: string;
          smsTemplateReceipt?: string;
        };
        if (parsed.smsSenderName) setSmsSenderName(parsed.smsSenderName);
        if (parsed.smsChannel) setSmsChannel(parsed.smsChannel);
        if (parsed.smsTemplateInvoice) setSmsTemplateInvoice(parsed.smsTemplateInvoice);
        if (parsed.smsTemplateReceipt) setSmsTemplateReceipt(parsed.smsTemplateReceipt);
      } catch (_err) {
        // ignore local storage parsing errors
      }
    }
    const storedInviteStatus = window.localStorage.getItem("cp.setup.staffInvitesStatus");
    if (storedInviteStatus) {
      try {
        setInviteStatusMap(JSON.parse(storedInviteStatus));
      } catch (_err) {
        // ignore local storage parsing errors
      }
    }
    const storedRoleMap = window.localStorage.getItem("cp.setup.staffRoles");
    if (storedRoleMap) {
      try {
        setStaffRoleMap(JSON.parse(storedRoleMap));
      } catch (_err) {
        // ignore local storage parsing errors
      }
    }
    const storedAssignments = window.localStorage.getItem("cp.setup.teacherAssignments");
    if (storedAssignments) {
      try {
        setTeacherAssignments(JSON.parse(storedAssignments));
      } catch (_err) {
        // ignore local storage parsing errors
      }
    }
    const storedChecklistOpen = window.localStorage.getItem("cp.setup.checklistOpen");
    if (storedChecklistOpen) {
      try {
        setChecklistOpenMap(JSON.parse(storedChecklistOpen));
      } catch (_err) {
        // ignore local storage parsing errors
      }
    }
    const storedAcademicTab = window.localStorage.getItem("cp.setup.academicTab");
    if (storedAcademicTab) {
      setAcademicTab(storedAcademicTab);
    }
    const storedImportAck = window.localStorage.getItem("cp.setup.importAck");
    if (storedImportAck) {
      try {
        setImportErrorAcknowledged(JSON.parse(storedImportAck));
      } catch (_err) {
        // ignore local storage parsing errors
      }
    }
    if (initialSubStep) {
      setImportStep(initialSubStep);
    }
    const storedSkipped = window.localStorage.getItem("cp.setup.skipped");
    if (storedSkipped) {
      try {
        setSkippedSteps(JSON.parse(storedSkipped));
      } catch (_err) {
        // ignore local storage parsing errors
      }
    }
  }, []);

  useEffect(() => {
    if (token && schoolId) {
      loadSetupState();
    }
  }, [token, schoolId]);

  useEffect(() => {
    if (!token || !schoolId) return;
    void loadStaff();
    void loadImportJobs();
  }, [token, schoolId]);

  useEffect(() => {
    let isActive = true;
    const hydrateFees = async () => {
      if (!token || scheduleTermId || scheduleClassYearId) return;
      if (terms.length === 0 || classYears.length === 0) return;
      for (const term of terms) {
        for (const classYear of classYears) {
          try {
            const data = await graphqlFetch(
              `query FeeSchedulesByTerm($termId: ID!, $classYearId: ID!, $limit: Int) {
                feeSchedulesByTerm(termId: $termId, classYearId: $classYearId, limit: $limit) {
                  id
                  name
                  termId
                  classYearId
                  currency
                  isActive
                }
              }`,
              { termId: term.id, classYearId: classYear.id, limit: 1 },
              token
            );
            const items = data.feeSchedulesByTerm || [];
            if (items.length > 0) {
              if (!isActive) return;
              setScheduleTermId(term.id);
              setScheduleClassYearId(classYear.id);
              setFeeSchedules(items);
              setSelectedScheduleId(items[0].id);
              return;
            }
          } catch (_err) {
            // ignore
          }
        }
      }
    };
    void hydrateFees();
    return () => {
      isActive = false;
    };
  }, [token, terms, classYears, scheduleTermId, scheduleClassYearId]);

  useEffect(() => {
    if (Object.keys(importFieldMap).length > 0) return;
    const headerSource = importHeaders.length ? importHeaders : csvHeaderList;
    setImportFieldMap(buildImportFieldMap(headerSource));
  }, [importFieldMap, importHeaders]);

  useEffect(() => {
    const payload = {
      steps: stepMeta.map((step) => ({
        stepId: step.stepId,
        label: step.label,
        status: stepStatusMap[step.stepId]
      }))
    };
    window.localStorage.setItem("cp.setup.state", JSON.stringify(payload));
  }, [stepMeta, stepStatusMap]);

  useEffect(() => {
    if (!setupStateLoaded || !schoolId || !token) return;
    const payload = buildSetupStatePayload();
    const nextSnapshot = JSON.stringify(payload);
    if (nextSnapshot === setupStateSnapshot) return;
    const timer = window.setTimeout(() => {
      void persistSetupState(payload).then(() => {
        setSetupStateSnapshot(nextSnapshot);
      });
    }, 900);
    return () => window.clearTimeout(timer);
  }, [
    setupStateLoaded,
    schoolId,
    token,
    setupStateSnapshot,
    brandName,
    brandAddress,
    brandCity,
    brandState,
    brandEmail,
    brandPhone,
    brandLogo,
    brandPrimary,
    brandAccent,
    manualPaymentsEnabled,
    paymentProvider,
    paymentsSaved,
    lastSavedPaymentsAt,
    smsSenderName,
    smsChannel,
    smsTemplateInvoice,
    smsTemplateReceipt,
    commsSaved,
    lastSavedCommsAt,
    scheduleTermId,
    scheduleClassYearId,
    selectedScheduleId,
    inviteStatusMap,
    staffRoleMap,
    teacherAssignments,
    checkInvites,
    checkFees,
    checkFirstInvoice,
    pilotReady,
    pilotNotes,
    checklistOpenMap,
    importStep,
    importReviewTab,
    importProceedWithValidOnly,
    importErrorAcknowledged,
    importHasHeaders,
    importFieldMap,
    academicTab,
    skippedSteps,
    stepsDrawerOpen,
    teacherFormOpen
  ]);

  useEffect(() => {
    if (token && termSessionId) {
      loadTerms(termSessionId);
    }
  }, [token, termSessionId]);

  useEffect(() => {
    if (scheduleTermId && scheduleClassYearId) {
      const term = terms.find((item) => item.id === scheduleTermId);
      const classYear = feeYears.find((item) => item.id === scheduleClassYearId);
      if (term && classYear) {
        setScheduleName(`${classYear.name} - ${term.name}`);
      }
    }
  }, [scheduleTermId, scheduleClassYearId, terms, feeYears]);

  useEffect(() => {
    if (scheduleTermId && scheduleClassYearId) {
      setFeeLines([]);
      loadFeeSchedules();
    }
  }, [scheduleTermId, scheduleClassYearId]);

  useEffect(() => {
    if (selectedScheduleId && token) {
      loadFeeLines(selectedScheduleId);
      return;
    }
    if (!selectedScheduleId) {
      setFeeLines([]);
      setLineFeeItemId("");
      setLineAmount("");
      setLineDueDate("");
      setLineOptionalOverride(false);
      setLineSortOrder(1);
    }
  }, [selectedScheduleId, token]);

  useEffect(() => {
    if (token && schoolId) {
      loadStructure();
    }
  }, [token, schoolId]);

  useEffect(() => {
    if (classYears.length === 0) return;
    window.localStorage.setItem("cp.setup.classYears", JSON.stringify(classYears));
  }, [classYears]);

  useEffect(() => {
    if (classYears.length > 0) return;
    const stored = window.localStorage.getItem("cp.setup.classYears");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as ClassYear[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setClassYears(parsed);
      }
    } catch (_err) {
      // ignore stored class year errors
    }
  }, [classYears.length]);

  useEffect(() => {
    if (!isStepView) return;
    if (!["setup-fee-items", "setup-fee-schedules"].includes(initialSectionId || "")) return;
    if (feeYears.length > 0) return;
    if (feesYearsRefreshed) return;
    if (!token || !schoolId) return;
    setFeesYearsRefreshed(true);
    void loadFeeClassYears();
  }, [isStepView, initialSectionId, feeYears.length, feesYearsRefreshed, token, schoolId]);

  useEffect(() => {
    if (!classYearLevelId && levels.length) {
      setClassYearLevelId(levels[0].id);
    }
  }, [classYearLevelId, levels]);

  useEffect(() => {
    if (!classGroupYearId && classYears.length) {
      setClassGroupYearId(classYears[0].id);
    }
  }, [classGroupYearId, classYears]);

  useEffect(() => {
    if (!classYearLevelId && generatedLevels.length) {
      setClassYearLevelId(generatedLevels[0].id);
    }
  }, [classYearLevelId, generatedLevels]);

  useEffect(() => {
    if (!classGroupYearId && generatedClassYears.length) {
      setClassGroupYearId(generatedClassYears[0].id);
    }
  }, [classGroupYearId, generatedClassYears]);

  useEffect(() => {
    let isActive = true;
    if (!importFile) {
      setImportPreviewLoading(false);
      setImportHeaders([]);
      setImportPreviewRows([]);
      setImportPreviewIssues([]);
      setImportPreviewDuplicates([]);
      setImportPreviewSummary({
        total: 0,
        missingHeaders: 0,
        errors: 0,
        duplicateAdmissions: 0,
        duplicateParentContacts: 0
      });
      setImportReviewTab("errors");
      return;
    }
    if (!importFile.name.toLowerCase().endsWith(".csv")) {
      setImportPreviewLoading(false);
      setImportPreviewIssues(["File must be a CSV to preview."]);
      return;
    }
    const parsePreview = async () => {
      const requestId = ++importPreviewRequestId.current;
      setImportPreviewLoading(true);
      try {
        const text = await importFile.text();
        const rows = parseCsvText(text);
        if (!rows.length) {
          if (!isActive) return;
          setImportPreviewIssues(["CSV appears to be empty."]);
          return;
        }
        const rawHeaders = rows[0].map((header) => header.trim());
        const headers = importHasHeaders
          ? rawHeaders
          : Array.from({ length: Math.max(...rows.map((row) => row.length)) }, (_, i) => `Column ${i + 1}`);
        const dataRows = importHasHeaders ? rows.slice(1) : rows;
        const mappedRows = dataRows.map((row) => {
          const mapped: Record<string, string> = {};
          csvHeaderList.forEach((fieldKey) => {
            const headerName = importFieldMap[fieldKey];
            if (!headerName) {
              mapped[fieldKey] = "";
              return;
            }
            const idx = headers.indexOf(headerName);
            mapped[fieldKey] = idx >= 0 ? (row[idx] || "").trim() : "";
          });
          return mapped;
        });

        const admissionSeen = new Set<string>();
        const admissionDuplicates = new Set<string>();
        const parentContactSeen = new Set<string>();
        const parentContactDuplicates = new Set<string>();
        const issues: string[] = [];

        mappedRows.forEach((row, index) => {
          const rowNumber = importHasHeaders ? index + 2 : index + 1;
          const admissionNo = row.admissionNo;
          if (!admissionNo) {
            issues.push(`Row ${rowNumber}: admissionNo is required.`);
          } else if (admissionSeen.has(admissionNo)) {
            admissionDuplicates.add(admissionNo);
          } else {
            admissionSeen.add(admissionNo);
          }
          if (!row.firstName || !row.lastName) {
            issues.push(`Row ${rowNumber}: firstName and lastName are required.`);
          }
          const parentEmail = row.parentEmail;
          const parentPhone = row.parentPhone;
          if (parentEmail && !isValidEmail(parentEmail)) {
            issues.push(`Row ${rowNumber}: parentEmail format looks invalid.`);
          }
          if (parentPhone && !isLikelyImportPhone(parentPhone)) {
            issues.push(`Row ${rowNumber}: parentPhone format looks invalid.`);
          }
          if (!parentPhone) {
            issues.push(`Row ${rowNumber}: parentPhone is required.`);
          }
          const hasClassGroup = Boolean(row.classGroup || row.classGroupId);
          const hasClassYear = Boolean(row.classYear || row.classYearId);
          const hasClassArm = Boolean(row.classArm || row.classArmId);
          if (!hasClassGroup && !(hasClassYear && hasClassArm)) {
            issues.push(`Row ${rowNumber}: provide classGroup or classYear + classArm.`);
          }
          const parentKey = parentEmail || parentPhone;
          if (parentKey) {
            if (parentContactSeen.has(parentKey)) {
              parentContactDuplicates.add(parentKey);
            } else {
              parentContactSeen.add(parentKey);
            }
          }
        });

        if (!isActive || requestId !== importPreviewRequestId.current) return;
        setImportHeaders(headers);
        setImportPreviewRows(mappedRows.slice(0, 20));
        setImportPreviewIssues([
          ...missingImportMappings.map((field) => `Map required field: ${field}`),
          ...issues.slice(0, 8)
        ]);
        setImportPreviewDuplicates(Array.from(admissionDuplicates));
        setImportPreviewSummary({
          total: mappedRows.length,
          missingHeaders: missingImportMappings.length,
          errors: issues.length,
          duplicateAdmissions: admissionDuplicates.size,
          duplicateParentContacts: parentContactDuplicates.size
        });
      } catch (_err) {
        if (!isActive || requestId !== importPreviewRequestId.current) return;
        setImportPreviewIssues(["Unable to parse CSV preview."]);
      } finally {
        if (isActive && requestId === importPreviewRequestId.current) {
          setImportPreviewLoading(false);
        }
      }
    };
    parsePreview();
    return () => {
      isActive = false;
    };
  }, [importFile, importHasHeaders, importFieldMap, missingImportMappings]);

  useEffect(() => {
    if (!paymentsSaved) return;
    const payload = JSON.stringify({
      manualPaymentsEnabled,
      paymentProvider
    });
    window.localStorage.setItem("cp.setup.payments", payload);
  }, [paymentsSaved, manualPaymentsEnabled, paymentProvider]);

  useEffect(() => {
    if (!commsSaved) return;
    const payload = JSON.stringify({
      smsSenderName,
      smsChannel,
      smsTemplateInvoice,
      smsTemplateReceipt
    });
    window.localStorage.setItem("cp.setup.communications", payload);
  }, [commsSaved, smsSenderName, smsChannel, smsTemplateInvoice, smsTemplateReceipt]);

  useEffect(() => {
    if (!lastSavedBrandingAt) return;
    setBrandingDirty(true);
  }, [brandName, brandAddress, brandCity, brandState, brandEmail, brandPhone, brandLogo, brandPrimary, brandAccent, lastSavedBrandingAt]);

  useEffect(() => {
    if (!paymentsSaved) return;
    setPaymentsDirty(true);
  }, [manualPaymentsEnabled, paymentProvider, paymentsSaved]);

  useEffect(() => {
    if (!commsSaved) return;
    setCommsDirty(true);
  }, [smsSenderName, smsChannel, smsTemplateInvoice, smsTemplateReceipt, commsSaved]);

  useEffect(() => {
    setLogoLoadError(false);
  }, [brandLogo]);

  useEffect(() => {
    window.localStorage.setItem("cp.checklist.invites", String(checkInvites));
  }, [checkInvites]);

  useEffect(() => {
    window.localStorage.setItem("cp.checklist.fees", String(checkFees));
  }, [checkFees]);

  useEffect(() => {
    window.localStorage.setItem("cp.checklist.invoice", String(checkFirstInvoice));
  }, [checkFirstInvoice]);

  useEffect(() => {
    window.localStorage.setItem("cp.checklist.pilotReady", String(pilotReady));
  }, [pilotReady]);

  useEffect(() => {
    window.localStorage.setItem("cp.checklist.pilotNotes", pilotNotes);
  }, [pilotNotes]);

  useEffect(() => {
    if (status) {
      setStatusAt(new Date().toISOString());
    }
  }, [status]);

  const fetchStructureSnapshot = async () => {
    if (!token || !schoolId) return null;
    return graphqlFetch(
      `query LoadStructure($schoolId: ID!) {
        sessionsBySchool(schoolId: $schoolId, limit: 50) { id name startDate endDate status }
        levelsBySchool(schoolId: $schoolId, limit: 50) { id name type sortOrder }
        classYearsBySchool(schoolId: $schoolId, limit: 50) { id name sortOrder levelId }
        classArmsBySchool(schoolId: $schoolId, limit: 50) { id name }
        classGroupsBySchool(schoolId: $schoolId, limit: 50) { id displayName classYearId classArmId }
        schoolProfileBySchool(schoolId: $schoolId, limit: 1) {
          id
          address
          city
          state
          contactEmail
          contactPhone
          logoUrl
          themeJson
        }
      }`,
      { schoolId },
      token
    );
  };

  const loadStructure = async () => {
    if (!token || !schoolId) return;
    setLoading(true);
    setStatus("");
    const hadLevels = levels.length > 0;
    const hadClassYears = classYears.length > 0;
    const hadClassGroups = classGroups.length > 0;
    try {
      const data = await fetchStructureSnapshot();
      if (!data) return;
      const nextSessions = data.sessionsBySchool || [];
      setSessions(nextSessions);
      const nextLevels = data.levelsBySchool || [];
      const nextClassYears = data.classYearsBySchool || [];
      const nextClassGroups = data.classGroupsBySchool || [];
      setLevels((prev) => (nextLevels.length ? nextLevels : prev));
      setClassYears((prev) => (nextClassYears.length ? nextClassYears : prev));
      setClassArms(data.classArmsBySchool || []);
      setClassGroups((prev) => (nextClassGroups.length ? nextClassGroups : prev));
      setFeeItems([]);
      await loadFeeItems();
      const profile = data.schoolProfileBySchool?.[0] as SchoolProfile | undefined;
      if (profile) {
        setProfileId(profile.id || "");
        setBrandAddress(profile.address || "");
        setBrandCity(profile.city || "");
        setBrandState(profile.state || "");
        setBrandEmail(profile.contactEmail || "");
        setBrandPhone(profile.contactPhone || "");
        setBrandLogo(profile.logoUrl || "");
        setLogoLoadError(false);
        if (profile.logoUrl && /^https?:\/\//i.test(profile.logoUrl)) {
          setBrandLogoLink(profile.logoUrl);
        } else {
          setBrandLogoLink("");
        }
        if (profile.themeJson) {
          try {
            const theme = JSON.parse(profile.themeJson);
            if (theme?.primary) setBrandPrimary(theme.primary);
            if (theme?.accent) setBrandAccent(theme.accent);
            if (theme?.brandName) setBrandName(theme.brandName);
          } catch (_err) {
            // ignore theme parse issues
          }
        }
        if (!lastSavedBrandingAt) {
          setLastSavedBrandingAt(new Date().toISOString());
        }
        setBrandingDirty(false);
      }
      if (!termSessionId && nextSessions.length) {
        setTermSessionId(nextSessions[0].id);
      }
      await loadTerms(termSessionId || nextSessions[0]?.id || "");
      if (nextSessions.length === 0) {
        setStatus("Add an academic session first to unlock terms and fee schedules.");
      } else {
        setStatus("Structure loaded.");
      }
      if (hadLevels && !nextLevels.length) {
        setStatus("Structure loaded, but levels are missing from the latest refresh. Keeping the last known list.");
      }
      if (hadClassYears && !nextClassYears.length) {
        setStatus("Structure loaded, but class years are missing from the latest refresh. Keeping the last known list.");
      }
      if (hadClassGroups && !nextClassGroups.length) {
        setStatus("Structure loaded, but class groups are missing from the latest refresh. Keeping the last known list.");
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load structure.");
    } finally {
      setLoading(false);
    }
  };

  const loadTerms = async (sessionId: string) => {
    if (!token || !sessionId) return;
    try {
      const data = await graphqlFetch(
        `query TermsBySession($sessionId: ID!, $limit: Int) {
          termsBySession(sessionId: $sessionId, limit: $limit) {
            id
            name
            startDate
            endDate
            status
            sessionId
          }
        }`,
        { sessionId, limit: 50 },
        token
      );
      setTerms(data.termsBySession || []);
    } catch (_err) {
      // Term loading is optional for setup list; keep silent on errors.
    }
  };

  const createSession = async () => {
    if (!token || !schoolId || !sessionName || !sessionStart || !sessionEnd) return;
    if (sessionStart > sessionEnd) {
      setStatus("Session start date must be before end date.");
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      await graphqlFetch(
        `mutation CreateSession($input: CreateAcademicSessionInput!) {
          createAcademicSession(input: $input) { id }
        }`,
        {
          input: {
            schoolId,
            name: sessionName,
            startDate: sessionStart,
            endDate: sessionEnd,
            status: sessionStatus
          }
        },
        token
      );
      setStatus("Session created.");
      await loadStructure();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to create session.");
    } finally {
      setSaving(false);
    }
  };

  const loadFeeClassYears = async () => {
    const authToken = token;
    const authSchoolId = schoolId || decodeSchoolId(authToken);
    if (!authToken || !authSchoolId) {
      setFeesStatusNote("Connect a staff login before loading classes.");
      return;
    }
    if (classYears.length > 0) {
      setFeeClassYears(classYears);
      setFeesStatusNote("Loaded classes from your academic setup.");
      return;
    }
    try {
      const data = await graphqlFetch(
        `query ClassYearsBySchool($schoolId: ID!, $limit: Int) {
          classYearsBySchool(schoolId: $schoolId, limit: $limit) { id name sortOrder levelId }
        }`,
        { schoolId: authSchoolId, limit: 200 },
        authToken
      );
      const years = data.classYearsBySchool || [];
      if (years.length) {
        setClassYears(years);
        setFeeClassYears(years);
        setFeesStatusNote(`Loaded ${years.length} classes.`);
      } else {
        let resolvedId = "";
        try {
          const slugData = await graphqlFetch(
            `query SchoolBySlug($slug: String!) {
              schoolBySlug(slug: $slug) { id }
            }`,
            { slug: authSchoolId },
            authToken
          );
          resolvedId = slugData.schoolBySlug?.id || "";
        } catch (_err) {
          // ignore slug lookup errors
        }
        if (resolvedId && resolvedId !== authSchoolId) {
          const retry = await graphqlFetch(
            `query ClassYearsBySchool($schoolId: ID!, $limit: Int) {
              classYearsBySchool(schoolId: $schoolId, limit: $limit) { id name sortOrder levelId }
            }`,
            { schoolId: resolvedId, limit: 200 },
            authToken
          );
          const retryYears = retry.classYearsBySchool || [];
          if (retryYears.length) {
            setClassYears(retryYears);
            setFeeClassYears(retryYears);
            setFeesStatusNote(`Loaded ${retryYears.length} classes.`);
            return;
          }
        }
        setFeesStatusNote("No classes found. Finish Academic Structure setup first.");
      }
    } catch (err) {
      setFeesStatusNote(err instanceof Error ? err.message : "Failed to load classes.");
    }
  };

  const refreshLevels = async () => {
    try {
      const data = await fetchStructureSnapshot();
      if (!data) return;
      const nextLevels = data.levelsBySchool || [];
      const nextClassYears = data.classYearsBySchool || [];
      setLevels((prev) => (nextLevels.length ? nextLevels : prev));
      setClassYears((prev) => (nextClassYears.length ? nextClassYears : prev));
      if (!classYearLevelId && (data.levelsBySchool || []).length) {
        setClassYearLevelId((data.levelsBySchool || [])[0].id);
      }
      if (!classGroupYearId && (data.classYearsBySchool || []).length) {
        setClassGroupYearId((data.classYearsBySchool || [])[0].id);
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to refresh levels.");
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!token || !schoolId || !sessionId) return;
    if (!window.confirm("Delete this session? This may unlink associated terms.")) return;
    setSaving(true);
    setStatus("");
    try {
      await graphqlFetch(
        `mutation DeleteAcademicSession($schoolId: ID!, $id: ID!) {
          deleteAcademicSession(schoolId: $schoolId, id: $id)
        }`,
        { schoolId, id: sessionId },
        token
      );
      if (termSessionId === sessionId) {
        setTermSessionId("");
      }
      setStatus("Session deleted.");
      await loadStructure();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to delete session.");
    } finally {
      setSaving(false);
    }
  };

  const toggleSessionStatus = async (session: AcademicSession) => {
    if (!token || !schoolId || !session?.id) return;
    const nextStatus = session.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    if (!window.confirm(`Set session "${session.name}" to ${nextStatus}?`)) return;
    setSaving(true);
    setStatus("");
    try {
      await graphqlFetch(
        `mutation UpdateAcademicSession($input: UpdateAcademicSessionInput!) {
          updateAcademicSession(input: $input) { id }
        }`,
        {
          input: {
            schoolId,
            id: session.id,
            name: session.name,
            startDate: session.startDate,
            endDate: session.endDate,
            status: nextStatus
          }
        },
        token
      );
      setStatus(`Session set to ${nextStatus.toLowerCase()}.`);
      await loadStructure();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to update session status.");
    } finally {
      setSaving(false);
    }
  };

  const createTerm = async () => {
    if (!token || !schoolId || !termSessionId || !termName || !termStart || !termEnd) return;
    if (termStart > termEnd) {
      setStatus("Term start date must be before end date.");
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      await graphqlFetch(
        `mutation CreateTerm($input: CreateTermInput!) {
          createTerm(input: $input) { id }
        }`,
        {
          input: {
            schoolId,
            sessionId: termSessionId,
            name: termName,
            startDate: termStart,
            endDate: termEnd,
            status: termStatus
          }
        },
        token
      );
      setStatus("Term created.");
      await loadStructure();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to create term.");
    } finally {
      setSaving(false);
    }
  };

  const createLevel = async () => {
    if (!token || !schoolId || !levelName) return;
    setSaving(true);
    setStatus("");
    try {
      const data = await graphqlFetch<{ createLevel: { id: string } }>(
        `mutation CreateLevel($input: CreateLevelInput!) {
          createLevel(input: $input) { id }
        }`,
        {
          input: {
            schoolId,
            name: levelName,
            type: levelType,
            sortOrder: levelSort
          }
        },
        token
      );
      if (data.createLevel?.id) {
        setLevels((prev) => {
          if (prev.some((item) => item.id === data.createLevel.id)) return prev;
          return [
            ...prev,
            {
              id: data.createLevel.id,
              name: levelName,
              type: levelType,
              sortOrder: levelSort
            }
          ];
        });
        if (!classYearLevelId) {
          setClassYearLevelId(data.createLevel.id);
        }
      }
      setStatus("Level created.");
      await loadStructure();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to create level.");
    } finally {
      setSaving(false);
    }
  };

  const createClassYear = async () => {
    if (!token || !schoolId || !classYearLevelId || !classYearName) return;
    setSaving(true);
    setStatus("");
    try {
      const data = await graphqlFetch<{ createClassYear: { id: string } }>(
        `mutation CreateClassYear($input: CreateClassYearInput!) {
          createClassYear(input: $input) { id }
        }`,
        {
          input: {
            schoolId,
            levelId: classYearLevelId,
            name: classYearName,
            sortOrder: classYearSort
          }
        },
        token
      );
      if (data.createClassYear?.id) {
        setClassYears((prev) => {
          if (prev.some((item) => item.id === data.createClassYear.id)) return prev;
          return [
            ...prev,
            {
              id: data.createClassYear.id,
              name: classYearName,
              sortOrder: classYearSort,
              levelId: classYearLevelId
            }
          ];
        });
        if (!classGroupYearId) {
          setClassGroupYearId(data.createClassYear.id);
        }
      }
      setStatus("Class year created.");
      await loadStructure();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to create class year.");
    } finally {
      setSaving(false);
    }
  };

  const createClassArm = async () => {
    if (!token || !schoolId || !classArmName) return;
    setSaving(true);
    setStatus("");
    try {
      await graphqlFetch(
        `mutation CreateClassArm($input: CreateClassArmInput!) {
          createClassArm(input: $input) { id }
        }`,
        {
          input: {
            schoolId,
            name: classArmName
          }
        },
        token
      );
      setStatus("Class arm created.");
      await loadStructure();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to create class arm.");
    } finally {
      setSaving(false);
    }
  };

  const createClassGroup = async () => {
    if (!token || !schoolId || !classGroupYearId || !classGroupDisplayName) return;
    setSaving(true);
    setStatus("");
    try {
      const data = await graphqlFetch<{ createClassGroup: { id: string } }>(
        `mutation CreateClassGroup($input: CreateClassGroupInput!) {
          createClassGroup(input: $input) { id }
        }`,
        {
          input: {
            schoolId,
            classYearId: classGroupYearId,
            classArmId: classGroupArmId || null,
            displayName: classGroupDisplayName
          }
        },
        token
      );
      if (data.createClassGroup?.id) {
        setClassGroups((prev) => {
          if (prev.some((item) => item.id === data.createClassGroup.id)) return prev;
          return [
            ...prev,
            {
              id: data.createClassGroup.id,
              classYearId: classGroupYearId,
              classArmId: classGroupArmId || null,
              displayName: classGroupDisplayName
            }
          ];
        });
      }
      setStatus("Class group created.");
      await loadStructure();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to create class group.");
    } finally {
      setSaving(false);
    }
  };

  const createDefaultTerms = async () => {
    if (!token || !schoolId || !termSessionId) {
      setStatus("Select a session before creating default terms.");
      return;
    }
    if (!sessionStart || !sessionEnd) {
      setStatus("Set session dates before creating default terms.");
      return;
    }
    const start = new Date(sessionStart);
    const end = new Date(sessionEnd);
    if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf()) || start > end) {
      setStatus("Session dates are invalid.");
      return;
    }
    if (!window.confirm("Create default terms for the selected session?")) {
      return;
    }
    const dayMs = 24 * 60 * 60 * 1000;
    const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / dayMs) + 1);
    const termLength = Math.floor(totalDays / 3);
    const termStarts = [0, termLength, termLength * 2];
    const termLabels = ["1st Term", "2nd Term", "3rd Term"];
    setSaving(true);
    setStatus("");
    try {
      for (let i = 0; i < 3; i += 1) {
        const termStartDate = new Date(start.getTime() + termStarts[i] * dayMs);
        const termEndDate =
          i === 2 ? end : new Date(start.getTime() + (termStarts[i] + termLength - 1) * dayMs);
        await graphqlFetch(
          `mutation CreateTerm($input: CreateTermInput!) {
            createTerm(input: $input) { id }
          }`,
          {
            input: {
              schoolId,
              sessionId: termSessionId,
              name: termLabels[i],
              startDate: termStartDate.toISOString().slice(0, 10),
              endDate: termEndDate.toISOString().slice(0, 10),
              status: "ACTIVE"
            }
          },
          token
        );
      }
      setStatus("Default terms created.");
      await loadStructure();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to create default terms.");
    } finally {
      setSaving(false);
    }
  };

  const createDefaultLevels = async () => {
    if (!token || !schoolId) return;
    const hasPrimary = availableLevels.some((level) => level.name.toLowerCase().includes("primary"));
    const hasSecondary = availableLevels.some((level) => level.name.toLowerCase().includes("secondary"));
    if (hasPrimary && hasSecondary) {
      setStatus("Default levels already exist.");
      return;
    }
    if (!window.confirm("Create default Primary and Secondary levels?")) {
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      const created: Level[] = [];
      if (!hasPrimary) {
        const data = await graphqlFetch<{ createLevel: { id: string } }>(
          `mutation CreateLevel($input: CreateLevelInput!) {
            createLevel(input: $input) { id }
          }`,
          { input: { schoolId, name: "Primary", type: "PRIMARY", sortOrder: 1 } },
          token
        );
        if (data.createLevel?.id) {
          created.push({ id: data.createLevel.id, name: "Primary", type: "PRIMARY", sortOrder: 1 });
        }
      }
      if (!hasSecondary) {
        const data = await graphqlFetch<{ createLevel: { id: string } }>(
          `mutation CreateLevel($input: CreateLevelInput!) {
            createLevel(input: $input) { id }
          }`,
          { input: { schoolId, name: "Secondary", type: "SECONDARY", sortOrder: 2 } },
          token
        );
        if (data.createLevel?.id) {
          created.push({ id: data.createLevel.id, name: "Secondary", type: "SECONDARY", sortOrder: 2 });
        }
      }
      if (created.length) {
        setLevels((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          return [...prev, ...created.filter((item) => !existingIds.has(item.id))];
        });
        setGeneratedLevels((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          return [...prev, ...created.filter((item) => !existingIds.has(item.id))];
        });
        if (!classYearLevelId) {
          setClassYearLevelId(created[0].id);
        }
      }
      setStatus("Default levels created (skipped existing).");
      await loadStructure();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to create default levels.");
    } finally {
      setSaving(false);
    }
  };

  const ensureLevelByName = async (name: string, type: string, sortOrder: number) => {
    if (!token || !schoolId) {
      throw new Error("Connect a staff token before creating levels.");
    }
    const existing = availableLevels.find((level) => level.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing.id;
    const data = await graphqlFetch<{ createLevel: { id: string } }>(
      `mutation CreateLevel($input: CreateLevelInput!) {
        createLevel(input: $input) { id }
      }`,
      { input: { schoolId, name, type, sortOrder } },
      token
    );
    if (!data.createLevel?.id) {
      const snapshot = await fetchStructureSnapshot();
      const refreshed = snapshot?.levelsBySchool || [];
      const match = refreshed.find((level) => level.name.toLowerCase() === name.toLowerCase());
      if (match?.id) {
        setLevels((prev) => {
          if (prev.some((item) => item.id === match.id)) return prev;
          return [...prev, match];
        });
        setGeneratedLevels((prev) => {
          if (prev.some((item) => item.id === match.id)) return prev;
          return [...prev, match];
        });
        if (!classYearLevelId) {
          setClassYearLevelId(match.id);
        }
        return match.id;
      }
      throw new Error(`CreateLevel returned no id for ${name}. Check AppSync permissions/resolver.`);
    }
    setLevels((prev) => {
      if (prev.some((item) => item.id === data.createLevel?.id)) return prev;
      return [...prev, { id: data.createLevel.id, name, type, sortOrder }];
    });
    setGeneratedLevels((prev) => {
      if (prev.some((item) => item.id === data.createLevel?.id)) return prev;
      return [...prev, { id: data.createLevel.id, name, type, sortOrder }];
    });
    if (!classYearLevelId) {
      setClassYearLevelId(data.createLevel.id);
    }
    return data.createLevel.id;
  };

  const handleGeneratePrimaryYears = async () => {
    if (!token || !schoolId) {
      setStatus("Connect a staff token before generating class years.");
      return;
    }
    setSaving(true);
    setStatus("Generating Primary class years...");
    try {
      const levelName = academicPrimaryLabel || "Primary";
      const levelId = await ensureLevelByName(levelName, "PRIMARY", 1);
      await createDefaultClassYears(levelId, levelName, 6);
      await refreshLevels();
      setStatus("Primary class years generated.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to generate primary years.");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateSecondaryYears = async () => {
    if (!token || !schoolId) {
      setStatus("Connect a staff token before generating class years.");
      return;
    }
    setSaving(true);
    setStatus("Generating Secondary class years...");
    try {
      const levelName = academicSecondaryLabel || "Secondary";
      const levelId = await ensureLevelByName(levelName, "SECONDARY", 2);
      await createDefaultClassYears(levelId, "JSS", 3);
      await createDefaultClassYears(levelId, "SSS", 3);
      await refreshLevels();
      setStatus("Secondary class years generated.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to generate secondary years.");
    } finally {
      setSaving(false);
    }
  };

  const createDefaultClassYears = async (levelId: string, prefix: string, count: number) => {
    if (!token || !schoolId || !levelId) return;
    if (!window.confirm(`Create ${prefix} ${count} class years?`)) {
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      const existingNames = new Set(
        availableClassYears
          .filter((year) => year.levelId === levelId)
          .map((year) => year.name.toLowerCase())
      );
      const created: ClassYear[] = [];
      let createdCount = 0;
      for (let i = 1; i <= count; i += 1) {
        const name = `${prefix} ${i}`;
        if (existingNames.has(name.toLowerCase())) {
          continue;
        }
        const data = await graphqlFetch<{ createClassYear: { id: string } }>(
          `mutation CreateClassYear($input: CreateClassYearInput!) {
            createClassYear(input: $input) { id }
          }`,
          {
            input: {
              schoolId,
              levelId,
              name,
              sortOrder: i
            }
          },
          token
        );
        if (data.createClassYear?.id) {
          created.push({ id: data.createClassYear.id, name, sortOrder: i, levelId });
        }
        createdCount += 1;
      }
      if (created.length) {
        setClassYears((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          return [...prev, ...created.filter((item) => !existingIds.has(item.id))];
        });
        setGeneratedClassYears((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          return [...prev, ...created.filter((item) => !existingIds.has(item.id))];
        });
        if (!classGroupYearId) {
          setClassGroupYearId(created[0].id);
        }
      }
      setStatus(`${prefix} class years created (${createdCount} added).`);
      await loadStructure();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to create class years.");
    } finally {
      setSaving(false);
    }
  };

  const createDefaultClassArms = async () => {
    if (!token || !schoolId) return;
    const arms = ["A", "B", "C"];
    if (!window.confirm("Create default class arms A, B, C?")) {
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      const existing = new Set(classArms.map((arm) => arm.name.toUpperCase()));
      let created = 0;
      for (const name of arms) {
        if (existing.has(name)) continue;
        await graphqlFetch(
          `mutation CreateClassArm($input: CreateClassArmInput!) {
            createClassArm(input: $input) { id }
          }`,
          {
            input: {
              schoolId,
              name
            }
          },
          token
        );
        created += 1;
      }
      setStatus(`Default class arms created (${created} added).`);
      await loadStructure();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to create class arms.");
    } finally {
      setSaving(false);
    }
  };

  const createDefaultClassGroups = async () => {
    if (!token || !schoolId) return;
    if (!availableClassYears.length) {
      setStatus("Create class years before generating class groups.");
      return;
    }
    if (!window.confirm("Generate class groups for all class years?")) {
      return;
    }
    const arms = classArms.length ? classArms : [{ id: "", name: "" }];
    setSaving(true);
    setStatus("");
    try {
      const existing = new Set(
        availableClassGroups.map((group) => `${group.classYearId}:${group.classArmId || ""}:${group.displayName}`)
      );
      let created = 0;
      for (const year of availableClassYears) {
        for (const arm of arms) {
          const displayName = arm.name ? `${year.name}${arm.name}` : year.name;
          const key = `${year.id}:${arm.id || ""}:${displayName}`;
          if (existing.has(key)) {
            continue;
          }
          await graphqlFetch(
            `mutation CreateClassGroup($input: CreateClassGroupInput!) {
              createClassGroup(input: $input) { id }
            }`,
            {
              input: {
                schoolId,
                classYearId: year.id,
                classArmId: arm.id || null,
                displayName
              }
            },
            token
          );
          created += 1;
        }
      }
      setStatus(`Default class groups created (${created} added).`);
      await loadStructure();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to create class groups.");
    } finally {
      setSaving(false);
    }
  };

  const createDefaultFeeSchedules = async () => {
    if (!token || !schoolId) return;
    if (!terms.length || !feeYears.length) {
      setStatus("Create terms and class years before generating fee schedules.");
      return;
    }
    if (!window.confirm("Generate fee schedules for all terms and class years?")) {
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      const existing = new Set(
        feeSchedules.map((schedule) => `${schedule.termId}:${schedule.classYearId}`)
      );
      let created = 0;
      for (const term of terms) {
        for (const year of feeYears) {
          const key = `${term.id}:${year.id}`;
          if (existing.has(key)) {
            continue;
          }
          await graphqlFetch(
            `mutation CreateFeeSchedule($input: CreateFeeScheduleInput!) {
              createFeeSchedule(input: $input) { id }
            }`,
            {
              input: {
                schoolId,
                sessionId: term.sessionId,
                termId: term.id,
                classYearId: year.id,
                name: `${year.name} - ${term.name}`,
                currency: scheduleCurrency || "NGN",
                isActive: true
              }
            },
            token
          );
          created += 1;
        }
      }
      setStatus(`Default fee schedules created (${created} added).`);
      await loadFeeSchedules();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to create fee schedules.");
    } finally {
      setSaving(false);
    }
  };

  const createDefaultFeeLines = async () => {
    if (!token || !schoolId || !selectedScheduleId) {
      setStatus("Select a fee schedule before generating lines.");
      return;
    }
    if (!feeItems.length) {
      setStatus("Create fee items before generating lines.");
      return;
    }
    if (!normalizedLineAmount) {
      setStatus("Enter a default amount before generating lines.");
      return;
    }
    if (!Number.isFinite(lineAmountValue) || lineAmountValue <= 0) {
      setStatus("Enter a valid default amount greater than 0.");
      return;
    }
    if (!window.confirm("Add all fee items to this schedule using the default amount?")) {
      return;
    }
    const existingIds = new Set(feeLines.map((line) => line.feeItemId));
    setSaving(true);
    setStatus("");
    try {
      let sortOrder = lineSortOrder;
      for (const item of feeItems) {
        if (existingIds.has(item.id)) {
          continue;
        }
        await graphqlFetch(
          `mutation CreateFeeScheduleLine($input: CreateFeeScheduleLineInput!) {
            createFeeScheduleLine(input: $input) { id }
          }`,
          {
            input: {
              schoolId,
              feeScheduleId: selectedScheduleId,
              feeItemId: item.id,
              amount: lineAmountValue,
              isOptionalOverride: item.isOptional,
              dueDate: lineDueDate || null,
              sortOrder
            }
          },
          token
        );
        sortOrder += 1;
      }
      setLineSortOrder(sortOrder);
      setStatus("Default fee lines created (skipped existing items).");
      await loadFeeLines(selectedScheduleId);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to create fee lines.");
    } finally {
      setSaving(false);
    }
  };

  const loadImportJobs = async () => {
    if (!token || !schoolId) return;
    setLoading(true);
    setStatus("");
    try {
      const data = await graphqlFetch(
        `query ImportJobsBySchool($schoolId: ID!, $limit: Int) {
          importJobsBySchool(schoolId: $schoolId, limit: $limit) {
            id
            status
            processedLines
            created
            updated
            skipped
            errors
            errorReportKey
            createdAt
            processedAt
          }
        }`,
        { schoolId, limit: 20 },
        token
      );
      setImportJobs(data.importJobsBySchool || []);
      setStatus("Import jobs loaded.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load import jobs.");
    } finally {
      setLoading(false);
    }
  };

  const uploadImport = async () => {
    if (!token || !schoolId) {
      setStatus("Sign in again to upload a CSV.");
      return;
    }
    if (!importStructureReady) {
      setStatus("Create sessions, terms, and class years before importing students.");
      return;
    }
    if (!importFile) {
      setStatus("Select a CSV file to upload.");
      return;
    }
    if (!importFile.name.toLowerCase().endsWith(".csv")) {
      setStatus("Import file must be a CSV.");
      return;
    }
    if (!mappingsReady) {
      setStatus("Map required columns before uploading.");
      setImportStep("map");
      return;
    }
    setUploading(true);
    setStatus("");
    try {
      const text = await importFile.text();
      const rows = parseCsvText(text);
      if (!rows.length) {
        setStatus("CSV appears to be empty.");
        return;
      }
      const rawHeaders = rows[0].map((header) => header.trim());
      const headers = importHasHeaders
        ? rawHeaders
        : Array.from({ length: Math.max(...rows.map((row) => row.length)) }, (_, i) => `Column ${i + 1}`);
      const dataRows = importHasHeaders ? rows.slice(1) : rows;
      const normalizedRows = dataRows.map((row) =>
        csvHeaderList.map((fieldKey) => {
          const headerName = importFieldMap[fieldKey];
          if (!headerName) return "";
          const idx = headers.indexOf(headerName);
          return idx >= 0 ? (row[idx] || "").trim() : "";
        })
      );
      const escapeCsvValue = (value: string) => {
        if (value.includes('"') || value.includes(",") || value.includes("\n") || value.includes("\r")) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };
      const normalizedCsv = [
        csvHeaderList.join(","),
        ...normalizedRows.map((row) => row.map(escapeCsvValue).join(","))
      ].join("\n");
      const uploadData = await graphqlFetch(
        `mutation CreateImportUploadUrl($input: CreateImportUploadUrlInput!) {
          createImportUploadUrl(input: $input) { uploadUrl bucket key expiresIn }
        }`,
        {
          input: {
            schoolId,
            fileName: `normalized-${importFile.name}`,
            contentType: "text/csv"
          }
        },
        token
      );
      const upload = uploadData.createImportUploadUrl;
      await fetch(upload.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "text/csv" },
        body: normalizedCsv
      });
      await graphqlFetch(
        `mutation CreateImportJob($input: CreateImportJobInput!) {
          createImportJob(input: $input) { id status }
        }`,
        {
          input: {
            schoolId,
            bucket: upload.bucket,
            key: upload.key
          }
        },
        token
      );
      setStatus("Import job created.");
      setImportFile(null);
      await loadImportJobs();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to upload import.");
    } finally {
      setUploading(false);
    }
  };

  const copyCsvHeaders = async () => {
    try {
      await navigator.clipboard.writeText(csvTemplateHeaders);
      setStatus("CSV headers copied.");
    } catch (_err) {
      setStatus("Unable to copy CSV headers.");
    }
  };

  const copyDuplicateAdmissionNos = async () => {
    if (!importPreviewDuplicates.length) return;
    try {
      await navigator.clipboard.writeText(importPreviewDuplicates.join("\n"));
      setStatus("Duplicate admission numbers copied.");
    } catch (_err) {
      setStatus("Unable to copy duplicates.");
    }
  };

  const toggleImportAcknowledged = (jobId: string) => {
    setImportErrorAcknowledged((prev) => {
      const next = { ...prev, [jobId]: !prev[jobId] };
      window.localStorage.setItem("cp.setup.importAck", JSON.stringify(next));
      return next;
    });
  };

  const downloadCsvTemplate = () => {
    const blob = new Blob([`${csvTemplateHeaders}\n`], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "classpoint-import-template.csv";
    link.click();
    window.URL.revokeObjectURL(url);
    setStatus("CSV template downloaded.");
  };

  const downloadCsvSample = () => {
    const blob = new Blob([`${csvTemplateHeaders}\n${csvSampleRow}\n`], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "classpoint-import-sample.csv";
    link.click();
    window.URL.revokeObjectURL(url);
    setStatus("Sample CSV downloaded.");
  };

  const copyScheduleTotal = async () => {
    try {
      await navigator.clipboard.writeText(totalFeeAmount.toString());
      setStatus("Schedule total copied.");
    } catch (_err) {
      setStatus("Unable to copy schedule total.");
    }
  };

  const exportScheduleLines = () => {
    if (!selectedScheduleId || feeLines.length === 0) {
      setStatus("Select a schedule with lines to export.");
      return;
    }
    const rows = [
      "feeItemId,feeItemName,amount,isOptionalOverride,dueDate,sortOrder",
      ...feeLines.map((line) => {
        const item = feeItems.find((feeItem) => feeItem.id === line.feeItemId);
        const name = (item?.name || "").replace(/,/g, " ");
        return [
          line.feeItemId,
          name,
          line.amount,
          line.isOptionalOverride ? "true" : "false",
          line.dueDate || "",
          line.sortOrder
        ].join(",");
      })
    ];
    const blob = new Blob([rows.join("\n") + "\n"], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `schedule-lines-${selectedScheduleId}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    setStatus("Schedule lines exported.");
  };

  const downloadErrorReport = async (job: ImportJob) => {
    if (!token || !schoolId || !job.errorReportKey) return;
    setDownloadingJobId(job.id);
    setStatus("");
    try {
      const data = await graphqlFetch(
        `mutation CreateImportErrorDownloadUrl($input: CreateImportErrorDownloadUrlInput!) {
          createImportErrorDownloadUrl(input: $input) { downloadUrl expiresIn }
        }`,
        { input: { schoolId, key: job.errorReportKey } },
        token
      );
      const url = data.createImportErrorDownloadUrl?.downloadUrl;
      if (!url) throw new Error("Download URL missing.");
      const fileName = getErrorReportFilename(job);
      const tryAnchorDownload = () => {
        const link = document.createElement("a");
        link.href = url;
        link.rel = "noopener noreferrer";
        link.download = fileName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        link.remove();
      };
      const newWindow = window.open(url, "_blank", "noopener,noreferrer");
      if (!newWindow) {
        tryAnchorDownload();
        window.location.href = url;
      } else {
        setTimeout(() => {
          if (document.hasFocus()) {
            tryAnchorDownload();
          }
        }, 800);
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to download error report.");
    } finally {
      setDownloadingJobId(null);
    }
  };

  const inviteStaff = async ({
    name,
    email,
    phone,
    roleLabel,
    userType = "STAFF"
  }: {
    name: string;
    email?: string;
    phone?: string;
    roleLabel: string;
    userType?: string;
  }) => {
    if (!token || !schoolId || !name) return;
    if (!email && !phone) {
      setStatus("Provide an email or phone number for staff invites.");
      return;
    }
    if ((email && !isValidEmail(email)) || (phone && !isValidPhone(phone))) {
      setStatus("Check the email/phone formats.");
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      await graphqlFetch(
        `mutation InviteStaffUser($input: InviteStaffUserInput!) {
          inviteStaffUser(input: $input) { id }
        }`,
        {
          input: {
            schoolId,
            name,
            email: email || null,
            phone: phone || null,
            userType
          }
        },
        token
      );
      const inviteKey = getInviteKeyFromInput(name, email || "", phone || "");
      rememberStaffRole(inviteKey, roleLabel);
      setStatus(`${roleLabel} invite created.`);
      await loadStaff();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to invite staff.");
    } finally {
      setSaving(false);
    }
  };

  const deleteTermEntry = async (termId: string) => {
    if (!token || !schoolId || !termId) return;
    if (!window.confirm("Delete this term? This may affect fee schedules and enrollments.")) return;
    setSaving(true);
    setStatus("");
    try {
      await graphqlFetch(
        `mutation DeleteTerm($schoolId: ID!, $id: ID!) {
          deleteTerm(schoolId: $schoolId, id: $id)
        }`,
        { schoolId, id: termId },
        token
      );
      setStatus("Term deleted.");
      await loadStructure();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to delete term.");
    } finally {
      setSaving(false);
    }
  };

  const toggleTermStatus = async (term: Term) => {
    if (!token || !schoolId || !term?.id) return;
    const nextStatus = term.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    if (!window.confirm(`Set term "${term.name}" to ${nextStatus}?`)) return;
    setSaving(true);
    setStatus("");
    try {
      await graphqlFetch(
        `mutation UpdateTerm($input: UpdateTermInput!) {
          updateTerm(input: $input) { id }
        }`,
        {
          input: {
            schoolId,
            id: term.id,
            sessionId: term.sessionId,
            name: term.name,
            startDate: term.startDate,
            endDate: term.endDate,
            status: nextStatus
          }
        },
        token
      );
      setStatus(`Term set to ${nextStatus.toLowerCase()}.`);
      await loadStructure();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to update term status.");
    } finally {
      setSaving(false);
    }
  };

  const createAcademicStructureWizard = async () => {
    if (!token || !schoolId) return;
    if (!wizardSessionName || !wizardSessionStartDate || !wizardSessionEndDate) {
      setStatus("Add a session name and dates before creating the structure.");
      return;
    }
    const startDate = wizardSessionStartDate;
    const endDate = wizardSessionEndDate;
    if (startDate > endDate) {
      setStatus("Session start date must be before end date.");
      return;
    }
    const termNames = wizardTermNames.filter(Boolean);
    if (!termNames.length) {
      setStatus("Add at least one term name.");
      return;
    }
    if (academicIncludeNursery && academicECCDEEnabled && wizardNurseryYears.length === 0) {
      setStatus("Add at least one nursery year.");
      return;
    }
    if (academicIncludePrimary && wizardPrimaryYears.length === 0) {
      setStatus("Add at least one primary year.");
      return;
    }
    if (academicIncludeSecondary && wizardSecondaryYears.length === 0) {
      setStatus("Add at least one secondary year.");
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      setAcademicWizardCompleted(false);
      const snapshot = await fetchStructureSnapshot();
      const baseSessions = snapshot?.sessionsBySchool || sessions;
      const baseLevels = snapshot?.levelsBySchool || levels;
      const baseClassYears = snapshot?.classYearsBySchool || classYears;
      const baseClassGroups = snapshot?.classGroupsBySchool || classGroups;
      const baseClassArms = snapshot?.classArmsBySchool || classArms;

      let sessionId = baseSessions.find((session) => session.name === wizardSessionName)?.id;
      if (!sessionId) {
        const sessionData = await graphqlFetch<{ createAcademicSession: { id: string } }>(
          `mutation CreateAcademicSession($input: CreateAcademicSessionInput!) {
            createAcademicSession(input: $input) { id }
          }`,
          {
            input: {
              schoolId,
              name: wizardSessionName,
              startDate,
              endDate,
              status: "ACTIVE"
            }
          },
          token
        );
        sessionId = sessionData.createAcademicSession?.id;
      }

      if (!sessionId) {
        throw new Error("Session creation failed.");
      }

      const termRanges =
        wizardTermDatesEnabled && wizardTermDates.length
          ? wizardTermDates
          : computeTermRanges(startDate, endDate, termNames.length);
      for (let i = 0; i < termNames.length; i += 1) {
        const name = termNames[i];
        const existing = terms.find((term) => term.sessionId === sessionId && term.name === name);
        if (existing) continue;
        const range = termRanges[i] || { start: startDate, end: endDate };
        await graphqlFetch(
          `mutation CreateTerm($input: CreateTermInput!) {
            createTerm(input: $input) { id }
          }`,
          {
            input: {
              schoolId,
              sessionId,
              name,
              startDate: range.start || startDate,
              endDate: range.end || endDate,
              status: "ACTIVE"
            }
          },
          token
        );
      }

      const levelMap = new Map<string, string>();
      const createdLevels: Level[] = [];
      const ensureLevel = async (name: string, type: string, sortOrder: number) => {
        const existing = baseLevels.find((level) => level.name.toLowerCase() === name.toLowerCase());
        if (existing) {
          levelMap.set(name, existing.id);
          return existing.id;
        }
        const data = await graphqlFetch<{ createLevel: { id: string } }>(
          `mutation CreateLevel($input: CreateLevelInput!) {
            createLevel(input: $input) { id }
          }`,
          { input: { schoolId, name, type, sortOrder } },
          token
        );
        const levelId = data.createLevel?.id;
        if (levelId) {
          levelMap.set(name, levelId);
          createdLevels.push({ id: levelId, name, type, sortOrder });
        }
        return levelId;
      };

      const levelNames: { name: string; type: string }[] = [];
      if (academicIncludeNursery) levelNames.push({ name: "Nursery", type: "NURSERY" });
      if (academicIncludePrimary) levelNames.push({ name: academicPrimaryLabel || "Primary", type: "PRIMARY" });
      if (academicIncludeSecondary) levelNames.push({ name: academicSecondaryLabel || "Secondary", type: "SECONDARY" });
      if (academicCustomLevelName) levelNames.push({ name: academicCustomLevelName, type: "CUSTOM" });

      for (let i = 0; i < levelNames.length; i += 1) {
        await ensureLevel(levelNames[i].name, levelNames[i].type, i + 1);
      }

      const createdYears: { id: string; name: string; levelId: string }[] = [];
      const ensureClassYear = async (levelId: string, name: string, sortOrder: number) => {
        const existing = baseClassYears.find(
          (year) => year.levelId === levelId && year.name.toLowerCase() === name.toLowerCase()
        );
        if (existing) return existing;
        const data = await graphqlFetch<{ createClassYear: { id: string } }>(
          `mutation CreateClassYear($input: CreateClassYearInput!) {
            createClassYear(input: $input) { id }
          }`,
          { input: { schoolId, levelId, name, sortOrder } },
          token
        );
        const id = data.createClassYear?.id;
        if (id) {
          const record = { id, name, levelId };
          createdYears.push(record);
          return record;
        }
        return null;
      };

      if (academicIncludeNursery && academicECCDEEnabled) {
        const levelId = levelMap.get("Nursery");
        if (levelId) {
          for (let i = 0; i < wizardNurseryYears.length; i += 1) {
            const record = await ensureClassYear(levelId, wizardNurseryYears[i], i + 1);
          }
        }
      }
      if (academicIncludePrimary) {
        const levelId = levelMap.get(academicPrimaryLabel || "Primary");
        if (levelId) {
          for (let i = 0; i < wizardPrimaryYears.length; i += 1) {
            const record = await ensureClassYear(levelId, wizardPrimaryYears[i], i + 1);
          }
        }
      }
      if (academicIncludeSecondary) {
        const levelId = levelMap.get(academicSecondaryLabel || "Secondary");
        if (levelId) {
          for (let i = 0; i < wizardSecondaryYears.length; i += 1) {
            const record = await ensureClassYear(levelId, wizardSecondaryYears[i], i + 1);
          }
        }
      }

      const armMap = new Map<string, string | null>();
      const arms = wizardArmsEnabled ? (wizardArms.length ? wizardArms : ["A"]) : [""];
      if (wizardArmsEnabled) {
        for (const arm of arms) {
          const existing = baseClassArms.find((item) => item.name.toLowerCase() === arm.toLowerCase());
          if (existing) {
            armMap.set(arm, existing.id);
            continue;
          }
          const data = await graphqlFetch<{ createClassArm: { id: string } }>(
            `mutation CreateClassArm($input: CreateClassArmInput!) {
              createClassArm(input: $input) { id }
            }`,
            { input: { schoolId, name: arm } },
            token
          );
          armMap.set(arm, data.createClassArm?.id || null);
        }
      } else {
        armMap.set("", null);
      }

      const existingGroups = new Set(
        baseClassGroups.map((group) => `${group.classYearId}:${group.classArmId || ""}:${group.displayName}`)
      );
      const createdGroups: ClassGroup[] = [];
      const allYears = [...baseClassYears, ...createdYears].filter(
        (year, index, list) => list.findIndex((item) => item.id === year.id) === index
      );
      for (const year of allYears) {
        const yearName = year.name;
        const isSenior = wizardStreamsEnabled && yearName.toLowerCase().startsWith("ss");
        const streams = isSenior && wizardStreams.length ? wizardStreams : [];
        const armsList = wizardArmsEnabled ? (wizardArms.length ? wizardArms : ["A"]) : [""];
        if (streams.length) {
          for (const stream of streams) {
            for (const arm of armsList) {
              const groupName = formatWizardGroupName(yearName, arm || undefined, stream);
              const armId = wizardArmsEnabled ? armMap.get(arm) || null : null;
              const key = `${year.id}:${armId || ""}:${groupName}`;
              if (existingGroups.has(key)) continue;
              const data = await graphqlFetch<{ createClassGroup: { id: string } }>(
                `mutation CreateClassGroup($input: CreateClassGroupInput!) {
                  createClassGroup(input: $input) { id }
                }`,
                {
                  input: {
                    schoolId,
                    classYearId: year.id,
                    classArmId: armId,
                    displayName: groupName
                  }
                },
                token
              );
              if (data.createClassGroup?.id) {
                createdGroups.push({
                  id: data.createClassGroup.id,
                  classYearId: year.id,
                  classArmId: armId || null,
                  displayName: groupName
                });
              }
              existingGroups.add(key);
            }
          }
        } else {
          for (const arm of armsList) {
            const groupName = formatWizardGroupName(yearName, arm || undefined);
            const armId = wizardArmsEnabled ? armMap.get(arm) || null : null;
            const key = `${year.id}:${armId || ""}:${groupName}`;
            if (existingGroups.has(key)) continue;
            const data = await graphqlFetch<{ createClassGroup: { id: string } }>(
              `mutation CreateClassGroup($input: CreateClassGroupInput!) {
                createClassGroup(input: $input) { id }
              }`,
              {
                input: {
                  schoolId,
                  classYearId: year.id,
                  classArmId: armId,
                  displayName: groupName
                }
              },
              token
            );
            if (data.createClassGroup?.id) {
              createdGroups.push({
                id: data.createClassGroup.id,
                classYearId: year.id,
                classArmId: armId || null,
                displayName: groupName
              });
            }
            existingGroups.add(key);
          }
        }
      }

      if (createdYears.length) {
        setClassYears((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          return [...prev, ...createdYears.filter((item) => !existingIds.has(item.id))];
        });
      }
      if (createdGroups.length) {
        setClassGroups((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          return [...prev, ...createdGroups.filter((item) => !existingIds.has(item.id))];
        });
      }

      setStatus("Academic structure created.");
      const postSnapshot = await fetchStructureSnapshot();
      if (postSnapshot) {
        setSessions(postSnapshot.sessionsBySchool || []);
        const postLevels = postSnapshot.levelsBySchool || [];
        const postYears = postSnapshot.classYearsBySchool || [];
        const postGroups = postSnapshot.classGroupsBySchool || [];
        setLevels(postLevels);
        setClassYears(postYears);
        setClassArms(postSnapshot.classArmsBySchool || []);
        setClassGroups(postGroups);
        setGeneratedLevels(postLevels.length ? [] : createdLevels);
        setGeneratedClassYears(postYears.length ? [] : createdYears as ClassYear[]);
        setGeneratedClassGroups(postGroups.length ? [] : createdGroups);
        const ready =
          postYears.length > 0 && postGroups.length > 0;
        setAcademicWizardCompleted(ready);
        if (!ready) {
          setStatus("Academic structure created, but class years or class groups are still missing.");
        }
      } else {
        setAcademicWizardCompleted(true);
        await loadStructure();
      }
      return true;
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to create academic structure.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const runAcademicWizard = async () => {
    const created = await createAcademicStructureWizard();
    if (!created) return;
    setStatus("Academic structure saved. Loading classes...");
    await loadStructure();
    await loadFeeClassYears();
  };

  const handleGenerateAcademicDefaults = async () => {
    if (!academicPrimaryEnabled && !academicSecondaryEnabled) {
      setStatus("Select Primary or Secondary to generate defaults.");
      return;
    }
    if (!levels.length) {
      await createDefaultLevels();
      setStatus("Default levels created. Run Generate defaults again to add class years.");
      return;
    }
    const primary = levels.find((level) => level.name.toLowerCase().includes("primary"));
    const secondary = levels.find((level) => level.name.toLowerCase().includes("secondary"));
    if (academicPrimaryEnabled && primary) {
      await createDefaultClassYears(primary.id, "Primary", 6);
    }
    if (academicSecondaryEnabled && secondary) {
      await createDefaultClassYears(secondary.id, "JSS", 3);
      await createDefaultClassYears(secondary.id, "SSS", 3);
    }
  };

  const handleGenerateAcademicSuite = async () => {
    await handleGenerateAcademicDefaults();
    if (academicArmsEnabled) {
      await createDefaultClassArms();
    }
    await createDefaultClassGroups();
  };

  const loadStaff = async () => {
    if (!token || !schoolId) return;
    setLoadingStaff(true);
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
        { schoolId, userType: staffUserType, limit: 50 },
        token
      );
      setStaffList(data.usersBySchool || []);
      setStatus("Staff list loaded.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load staff.");
    } finally {
      setLoadingStaff(false);
    }
  };

  const getInviteKey = (user: User) => user.id || user.email || user.phone || user.name;
  const getInviteKeyFromInput = (name: string, email: string, phone: string) => email || phone || name;

  const saveInviteStatusMap = (next: Record<string, { sentAt: string; channel: string }>) => {
    setInviteStatusMap(next);
    window.localStorage.setItem("cp.setup.staffInvitesStatus", JSON.stringify(next));
  };

  const rememberStaffRole = (key: string, roleLabel: string) => {
    if (!key) return;
    setStaffRoleMap((prev) => {
      const next = { ...prev, [key]: roleLabel };
      window.localStorage.setItem("cp.setup.staffRoles", JSON.stringify(next));
      return next;
    });
  };

  const saveTeacherAssignment = (key: string, classGroups: string[], subjects: string[]) => {
    if (!key) return;
    setTeacherAssignments((prev) => {
      const next = { ...prev, [key]: { classGroups, subjects } };
      window.localStorage.setItem("cp.setup.teacherAssignments", JSON.stringify(next));
      return next;
    });
  };

  const getTeacherAssignment = (user: User) => {
    const lookupKey =
      (user.email && teacherAssignments[user.email] && user.email) ||
      (user.phone && teacherAssignments[user.phone] && user.phone) ||
      (user.name && teacherAssignments[user.name] && user.name) ||
      "";
    return lookupKey ? teacherAssignments[lookupKey] : null;
  };

  const getTeacherAssignmentSummary = (user: User) => {
    const assignment = getTeacherAssignment(user);
    if (!assignment) return null;
    const groupNames = assignment.classGroups
      .map((groupId) => classGroups.find((group) => group.id === groupId)?.displayName)
      .filter(Boolean) as string[];
    const subjects = assignment.subjects;
    const groupLabel = groupNames.length ? groupNames.slice(0, 2).join(", ") : "No class groups yet";
    const subjectLabel = subjects.length ? subjects.slice(0, 2).join(", ") : "Subjects pending";
    return `Groups: ${groupLabel}${groupNames.length > 2 ? " +" + (groupNames.length - 2) : ""} · Subjects: ${subjectLabel}${
      subjects.length > 2 ? " +" + (subjects.length - 2) : ""
    }`;
  };

  const getSubjectCount = (value: string) =>
    value
      .split(",")
      .map((subject) => subject.trim())
      .filter(Boolean).length;

  const getRoleLabel = (user: User) => {
    const lookupKey =
      (user.email && staffRoleMap[user.email] && user.email) ||
      (user.phone && staffRoleMap[user.phone] && user.phone) ||
      (user.name && staffRoleMap[user.name] && user.name) ||
      "";
    if (lookupKey) {
      return staffRoleMap[lookupKey];
    }
    if (user.userType === "SCHOOL_ADMIN") {
      return "School Admin";
    }
    return "Staff";
  };

  const buildStaffInviteMessage = (user: User) => {
    const schoolLabel = brandName || "ClassPoint";
    const portalLink = schoolSlug ? buildSchoolBaseUrl(schoolSlug, "/admin") : "/admin";
    return [
      `Hello ${user.name},`,
      "",
      `You have been invited to join ${schoolLabel}.`,
      `Access the admin portal: ${portalLink}`,
      "Use the credentials shared by your school admin.",
      "",
      "If you need help, reply to this message."
    ].join("\n");
  };

  const markInviteSent = (user: User, channel: string) => {
    const key = getInviteKey(user);
    const next = {
      ...inviteStatusMap,
      [key]: {
        sentAt: new Date().toISOString(),
        channel
      }
    };
    saveInviteStatusMap(next);
    setStaffStatusNote(`Invite marked as sent to ${user.name}.`);
  };

  const copyStaffInviteMessage = async (user: User) => {
    try {
      await navigator.clipboard.writeText(buildStaffInviteMessage(user));
      setStaffStatusNote(`Invite message copied for ${user.name}.`);
    } catch (_err) {
      setStaffStatusNote("Unable to copy invite message.");
    }
  };

  const getStaffInviteMailto = (user: User) => {
    if (!user.email) return "";
    const subject = encodeURIComponent(`You're invited to ${brandName || "ClassPoint"}`);
    const body = encodeURIComponent(buildStaffInviteMessage(user));
    return `mailto:${user.email}?subject=${subject}&body=${body}`;
  };

  const getStaffInviteSms = (user: User) => {
    if (!user.phone) return "";
    const body = encodeURIComponent(buildStaffInviteMessage(user));
    return `sms:${user.phone}?body=${body}`;
  };

  const loadFeeItems = async () => {
    if (!token || !schoolId) return;
    try {
      const data = await graphqlFetch(
        `query FeeItemsBySchool($schoolId: ID!, $limit: Int) {
          feeItemsBySchool(schoolId: $schoolId, limit: $limit) {
            id
            name
            category
            isOptional
            isActive
          }
        }`,
        { schoolId, limit: 100 },
        token
      );
      setFeeItems(data.feeItemsBySchool || []);
    } catch (_err) {
      // Keep silent in setup wizard.
    }
  };

  const createFeeItem = async () => {
    if (!token || !schoolId || !feeItemName) return;
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
            description: null,
            category: feeItemCategory,
            isOptional: feeItemOptional,
            isActive: feeItemActive
          }
        },
        token
      );
      setFeeItemName("");
      setFeeItemOptional(false);
      await loadFeeItems();
      setStatus("Fee item created.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to create fee item.");
    } finally {
      setSaving(false);
    }
  };

  const addNigeriaFeePack = async () => {
    if (!token || !schoolId) return;
    const feePack = [
      { name: "Tuition", category: "TUITION", isOptional: false },
      { name: "Development Levy", category: "LEVY", isOptional: false },
      { name: "PTA Levy", category: "LEVY", isOptional: false },
      { name: "Exam Fee", category: "EXAM", isOptional: false },
      { name: "Uniform", category: "UNIFORM", isOptional: false },
      { name: "Books", category: "BOOKS", isOptional: false },
      { name: "Transport", category: "TRANSPORT", isOptional: true },
      { name: "Lunch", category: "LUNCH", isOptional: true }
    ];
    const existing = new Set(feeItems.map((item) => item.name.trim().toLowerCase()));
    const toCreate = feePack.filter((item) => !existing.has(item.name.toLowerCase()));
    if (toCreate.length === 0) {
      setStatus("Nigeria fee pack already added.");
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      for (const item of toCreate) {
        await graphqlFetch(
          `mutation CreateFeeItem($input: CreateFeeItemInput!) {
            createFeeItem(input: $input) { id }
          }`,
          {
            input: {
              schoolId,
              name: item.name,
              description: null,
              category: item.category,
              isOptional: item.isOptional,
              isActive: true
            }
          },
          token
        );
      }
      await loadFeeItems();
      setStatus(`Added ${toCreate.length} fee items from the Nigeria pack.`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to add the Nigeria fee pack.");
    } finally {
      setSaving(false);
    }
  };

  const loadFeeSchedules = async () => {
    if (!token || !scheduleTermId || !scheduleClassYearId) return;
    try {
      const data = await graphqlFetch(
        `query FeeSchedulesByTerm($termId: ID!, $classYearId: ID!, $limit: Int) {
          feeSchedulesByTerm(termId: $termId, classYearId: $classYearId, limit: $limit) {
            id
            name
            termId
            classYearId
            currency
            isActive
          }
        }`,
        { termId: scheduleTermId, classYearId: scheduleClassYearId, limit: 20 },
        token
      );
      const items = data.feeSchedulesByTerm || [];
      setFeeSchedules(items);
      if (items.length === 0) {
        setSelectedScheduleId("");
        setFeeLines([]);
        return;
      }
      const hasSelected = selectedScheduleId && items.some((schedule: FeeSchedule) => schedule.id === selectedScheduleId);
      if (!hasSelected) {
        setSelectedScheduleId(items[0].id);
      }
    } catch (_err) {
      // ignore
    }
  };

  const createFeeSchedule = async () => {
    if (!token || !schoolId || !scheduleTermId || !scheduleClassYearId || !scheduleName) return;
    const term = terms.find((item) => item.id === scheduleTermId);
    if (!term?.sessionId) {
      setStatus("Select a term with a valid session.");
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      const created = await graphqlFetch(
        `mutation CreateFeeSchedule($input: CreateFeeScheduleInput!) {
          createFeeSchedule(input: $input) { id }
        }`,
        {
          input: {
            schoolId,
            sessionId: term.sessionId,
            termId: scheduleTermId,
            classYearId: scheduleClassYearId,
            name: scheduleName,
            currency: scheduleCurrency,
            isActive: scheduleActive
          }
        },
        token
      );
      const createdId = created?.createFeeSchedule?.id as string | undefined;
      await loadFeeSchedules();
      if (createdId) {
        setSelectedScheduleId(createdId);
      }
      setStatus("Fee schedule created.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to create fee schedule.");
    } finally {
      setSaving(false);
    }
  };

  const loadFeeLines = async (
    scheduleId: string,
    options?: { preserveOnEmpty?: boolean }
  ) => {
    if (!token || !scheduleId) return;
    try {
      const data = await graphqlFetch(
        `query FeeScheduleLinesBySchedule($feeScheduleId: ID!, $limit: Int) {
          feeScheduleLinesBySchedule(feeScheduleId: $feeScheduleId, limit: $limit) {
            id
            feeItemId
            amount
            isOptionalOverride
            dueDate
            sortOrder
          }
        }`,
        { feeScheduleId: scheduleId, limit: 50 },
        token
      );
      const lines = (data.feeScheduleLinesBySchedule || []).slice();
      lines.sort((a: FeeScheduleLine, b: FeeScheduleLine) => (a.sortOrder || 0) - (b.sortOrder || 0));
      if (options?.preserveOnEmpty && lines.length === 0) {
        setStatus("Fee line saved. Refreshing lines...");
        return;
      }
      setFeeLines(lines);
      if (lines.length > 0) {
        const nextSort = Math.max(...lines.map((line: FeeScheduleLine) => line.sortOrder || 0)) + 1;
        setLineSortOrder(nextSort);
      } else {
        setLineSortOrder(1);
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load fee schedule lines.");
    }
  };

  const createFeeLine = async () => {
    if (!token || !schoolId) {
      setStatus("Sign in as a school admin to add fee lines.");
      return;
    }
    if (!selectedScheduleId) {
      setStatus("Select a fee schedule before adding amounts.");
      return;
    }
    if (!lineFeeItemId) {
      setStatus("Select a fee item before adding a line.");
      return;
    }
    if (!normalizedLineAmount) {
      setStatus("Enter an amount before adding a line.");
      return;
    }
    if (!Number.isFinite(lineAmountValue) || lineAmountValue <= 0) {
      setStatus("Enter a valid fee amount greater than 0.");
      return;
    }
    if (!lineSortOk) {
      setStatus("Sort order must be a number greater than 0.");
      return;
    }
    if (!lineDueDateOk) {
      setStatus("Due date must fall within the selected term.");
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      const created = await graphqlFetch(
        `mutation CreateFeeScheduleLine($input: CreateFeeScheduleLineInput!) {
          createFeeScheduleLine(input: $input) { id }
        }`,
        {
          input: {
            schoolId,
            feeScheduleId: selectedScheduleId,
            feeItemId: lineFeeItemId,
            amount: lineAmountValue,
            isOptionalOverride: lineOptionalOverride,
            dueDate: lineDueDate || null,
            sortOrder: lineSortOrder
          }
        },
        token
      );
      const createdId = created?.createFeeScheduleLine?.id as string | undefined;
      const optimisticLine: FeeScheduleLine = {
        id: createdId || `tmp-${Date.now()}`,
        feeItemId: lineFeeItemId,
        amount: lineAmountValue,
        isOptionalOverride: lineOptionalOverride,
        dueDate: lineDueDate || null,
        sortOrder: lineSortOrder
      };
      setFeeLines((prev) => {
        const next = [...prev, optimisticLine];
        return next.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      });
      setLineAmount("");
      setLineSortOrder((prev) => prev + 1);
      await loadFeeLines(selectedScheduleId, { preserveOnEmpty: true });
      setStatus("Fee line added.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to add fee line.");
    } finally {
      setSaving(false);
    }
  };

  const saveBranding = async () => {
    if (!token || !schoolId) return;
    setSaving(true);
    setBrandingStatus("");
    const warnConditionExpression = (message: string) => message.includes("Unsupported element '$[conditionExpression]'");
    try {
      const sanitizedPhone = normalizePhone(brandPhone);
      if (brandPhone && !sanitizedPhone) {
        setBrandingStatus("Contact phone must use E.164 format, e.g. +2348012345678.");
        return;
      }
      const input = {
        schoolId,
        id: profileId || schoolId,
        address: brandAddress || null,
        city: brandCity || null,
        state: brandState || null,
        contactEmail: brandEmail || null,
        contactPhone: sanitizedPhone || null,
        logoUrl: brandLogo || null,
        themeJson: JSON.stringify({
          brandName: brandName || null,
          primary: brandPrimary,
          accent: brandAccent
        })
      };
      if (profileId) {
        await graphqlFetch(
          `mutation UpdateSchoolProfile($input: UpdateSchoolProfileInput!) {
            updateSchoolProfile(input: $input) { id }
          }`,
          { input },
          token
        );
        setBrandingStatus("Branding updated.");
      } else {
        const data = await graphqlFetch<{ createSchoolProfile: { id: string } }>(
          `mutation CreateSchoolProfile($input: CreateSchoolProfileInput!) {
            createSchoolProfile(input: $input) { id }
          }`,
          { input: { ...input, id: undefined } },
          token
        );
        setProfileId(data.createSchoolProfile?.id || schoolId);
        setBrandingStatus("Branding saved.");
      }
      setLastSavedBrandingAt(new Date().toISOString());
      setBrandingDirty(false);
      await loadStructure();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save branding.";
      if (warnConditionExpression(message)) {
        if (!profileId) {
          setProfileId(schoolId);
        }
        setLastSavedBrandingAt(new Date().toISOString());
        setBrandingDirty(false);
        await loadStructure();
        setBrandingStatus("Branding saved with a backend warning. If this persists, we will fix the AppSync resolver.");
      } else {
        setBrandingStatus(message);
      }
    } finally {
      setSaving(false);
    }
  };

  const savePayments = async () => {
    const payload = JSON.stringify({
      manualPaymentsEnabled,
      paymentProvider
    });
    window.localStorage.setItem("cp.setup.payments", payload);
    const savedAt = new Date().toLocaleString();
    setPaymentStatusNote(`Payment setup saved locally (${savedAt}). Gateway config will be added once approved.`);
    setPaymentsSaved(true);
    setLastSavedPaymentsAt(new Date().toISOString());
    setPaymentsDirty(false);
  };

  const saveCommunications = async () => {
    if (!token || !schoolId) return;
    const payload = JSON.stringify({
      smsSenderName,
      smsChannel,
      smsTemplateInvoice,
      smsTemplateReceipt
    });
    window.localStorage.setItem("cp.setup.communications", payload);
    try {
      const templateData = await graphqlFetch<{ templatesBySchool: { id: string; type: string; channel: string }[] }>(
        `query TemplatesBySchool($schoolId: ID!, $limit: Int) {
          templatesBySchool(schoolId: $schoolId, limit: $limit) {
            id
            type
            channel
          }
        }`,
        { schoolId, limit: 50 },
        token
      );
      const templates = templateData.templatesBySchool || [];
      const variablesJson = JSON.stringify([
        "parentName",
        "studentName",
        "amountDue",
        "dueDate",
        "amount",
        "currency",
        "receiptNo"
      ]);
      const invoiceTemplate = templates.find(
        (template) => template.type === "INVOICE_SMS" && template.channel === smsChannel
      );
      const receiptTemplate = templates.find(
        (template) => template.type === "RECEIPT_SMS" && template.channel === smsChannel
      );
      if (invoiceTemplate) {
        await graphqlFetch(
          `mutation UpdateMessageTemplate($input: UpdateMessageTemplateInput!) {
            updateMessageTemplate(input: $input) { id }
          }`,
          {
            input: {
              schoolId,
              id: invoiceTemplate.id,
              body: smsTemplateInvoice,
              variablesJson,
              isActive: true
            }
          },
          token
        );
      } else {
        await graphqlFetch(
          `mutation CreateMessageTemplate($input: CreateMessageTemplateInput!) {
            createMessageTemplate(input: $input) { id }
          }`,
          {
            input: {
              schoolId,
              type: "INVOICE_SMS",
              channel: smsChannel,
              body: smsTemplateInvoice,
              variablesJson,
              isActive: true
            }
          },
          token
        );
      }
      if (receiptTemplate) {
        await graphqlFetch(
          `mutation UpdateMessageTemplate($input: UpdateMessageTemplateInput!) {
            updateMessageTemplate(input: $input) { id }
          }`,
          {
            input: {
              schoolId,
              id: receiptTemplate.id,
              body: smsTemplateReceipt,
              variablesJson,
              isActive: true
            }
          },
          token
        );
      } else {
        await graphqlFetch(
          `mutation CreateMessageTemplate($input: CreateMessageTemplateInput!) {
            createMessageTemplate(input: $input) { id }
          }`,
          {
            input: {
              schoolId,
              type: "RECEIPT_SMS",
              channel: smsChannel,
              body: smsTemplateReceipt,
              variablesJson,
              isActive: true
            }
          },
          token
        );
      }
      const savedAt = new Date().toLocaleString();
      setSmsStatusNote(`Communications setup saved (${savedAt}). Templates updated.`);
      setCommsSaved(true);
      setLastSavedCommsAt(new Date().toISOString());
      setCommsDirty(false);
    } catch (err) {
      setSmsStatusNote(err instanceof Error ? err.message : "Failed to save communications setup.");
    }
  };

  const resetBrandingDefaults = () => {
    if (!window.confirm("Reset branding colors to default?")) return;
    setBrandPrimary("#2e6b5a");
    setBrandAccent("#b9772f");
  };

  const handleLogoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setBrandingStatus("Upload a logo image (PNG or JPG).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) {
        setBrandingStatus("Unable to read the logo file.");
        return;
      }
      setBrandLogo(result);
      setBrandLogoLink("");
      setLogoLoadError(false);
    };
    reader.onerror = () => setBrandingStatus("Unable to read the logo file.");
    reader.readAsDataURL(file);
  };

  const handleLogoLinkChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setBrandLogoLink(value);
    setBrandLogo(value);
    setLogoLoadError(false);
  };

  const clearBrandLogo = () => {
    setBrandLogo("");
    setBrandLogoLink("");
    setLogoLoadError(false);
  };

  const applyBrandingPreview = () => {
    const root = document.documentElement;
    root.style.setProperty("--emerald-500", brandPrimary);
    root.style.setProperty("--sand-500", brandAccent);
    setStatus("Applied branding preview.");
  };

  const resetBrandingPreview = () => {
    const root = document.documentElement;
    root.style.setProperty("--emerald-500", "#2e6b5a");
    root.style.setProperty("--sand-500", "#b9772f");
    setStatus("Reset branding preview.");
  };

  const copyThemeJson = async () => {
    const payload = JSON.stringify({
      brandName: brandName || null,
      primary: brandPrimary,
      accent: brandAccent
    });
    try {
      await navigator.clipboard.writeText(payload);
      setStatus("Theme JSON copied.");
    } catch (_err) {
      setStatus("Unable to copy theme JSON.");
    }
  };

  const downloadThemeJson = () => {
    const payload = JSON.stringify(
      {
        brandName: brandName || null,
        primary: brandPrimary,
        accent: brandAccent
      },
      null,
      2
    );
    const blob = new Blob([payload], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "branding-theme.json";
    link.click();
    window.URL.revokeObjectURL(url);
    setStatus("Theme JSON downloaded.");
  };

  const copyPortalLinks = async () => {
    const links = [
      schoolSlug ? buildSchoolBaseUrl(schoolSlug) : "",
      schoolSlug ? buildSchoolBaseUrl(schoolSlug, "/portal") : `${window.location.origin}/portal`,
      schoolSlug ? buildSchoolBaseUrl(schoolSlug, "/teacher") : `${window.location.origin}/teacher`,
      schoolSlug ? buildSchoolBaseUrl(schoolSlug, "/admin") : `${window.location.origin}/admin`
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(links);
      setStatus("Portal links copied.");
    } catch (_err) {
      setStatus("Unable to copy portal links.");
    }
  };

  const exportSetupSummary = () => {
    const payload = {
      schoolId,
      branding: {
        brandName,
        logoUrl: brandLogo,
        contactEmail: brandEmail,
        contactPhone: brandPhone,
        primary: brandPrimary,
        accent: brandAccent
      },
      structure: {
        sessions: sessions.length,
        terms: terms.length,
        levels: levels.length,
        classYears: classYears.length,
        classArms: classArms.length,
        classGroups: classGroups.length
      },
      fees: {
        items: feeItems.length,
        schedules: feeSchedules.length,
        lines: feeLines.length,
        totalAmount: totalFeeAmount
      },
      payments: {
        manualEnabled: manualPaymentsEnabled,
        provider: paymentProvider,
        saved: paymentsSaved
      },
      communications: {
        senderName: smsSenderName,
        channel: smsChannel,
        saved: commsSaved
      },
      import: {
        jobs: importJobs.length
      },
      progress: setupProgress,
      pilot: {
        ready: pilotReady,
        notes: pilotNotes
      }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `setup-summary-${schoolId || "school"}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
    setStatus("Setup summary downloaded.");
  };

  const copyPilotSummary = async () => {
    const lines = [
      `Pilot readiness: ${pilotReady ? "Ready" : "Pending"}`,
      `Progress: ${setupProgress}%`,
      `Structure: ${structureReady ? "Ready" : "Pending"}`,
      `Branding: ${brandingReady ? "Ready" : "Pending"}`,
      `Fees: ${feesReady ? "Ready" : "Pending"}`,
      `Payments: ${paymentsSaved ? "Ready" : "Pending"}`,
      `Communications: ${commsSaved ? "Ready" : "Pending"}`,
      pilotNotes ? `Notes: ${pilotNotes}` : "Notes: (none)"
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setStatus("Pilot summary copied.");
    } catch (_err) {
      setStatus("Unable to copy pilot summary.");
    }
  };

  const resetCommunicationsDefaults = () => {
    if (!window.confirm("Reset SMS templates to defaults?")) return;
    setSmsSenderName("ClassPoint");
    setSmsChannel("SMS");
    setSmsTemplateInvoice("Hi {{parentName}}, your invoice for {{studentName}} is ready. Amount due: {{amountDue}} by {{dueDate}}.");
    setSmsTemplateReceipt("Hi {{parentName}}, we received {{amount}} {{currency}}. Receipt: {{receiptNo}}.");
  };

  const renderSmsPreview = (template: string) =>
    template
      .replaceAll("{{parentName}}", "Mr Doe")
      .replaceAll("{{studentName}}", "John Doe")
      .replaceAll("{{amountDue}}", "NGN 45,000")
      .replaceAll("{{dueDate}}", "2025-09-30")
      .replaceAll("{{amount}}", "NGN 45,000")
      .replaceAll("{{currency}}", "NGN")
      .replaceAll("{{receiptNo}}", "RCP-1001");

  if (!isStepView) {
    const nextStepIdHub =
      stepOrder.find((stepId) => stepStatusMap[stepId] !== "completed") || stepOrder[0];
    const nextStepLabelHub = stepLabelMap[nextStepIdHub];
    const nextStepHrefHub = stepRouteMap[nextStepIdHub];
    return (
      <main className="dashboard-page setup-hub-page">
        <div className="page-header modern-header">
          <div>
            <div className="breadcrumb">Admin / Setup</div>
            <h1>School Setup</h1>
            <p className="muted">Complete setup to start billing, communications, and academics.</p>
          </div>
          <a className="button primary" href={nextStepHrefHub}>
            Continue setup
          </a>
        </div>

        <div className="card setup-progress-card">
          <div>
            <span className="status-pill status-in_progress">In progress</span>
            <h3>{setupProgressSteps}% complete</h3>
            <p className="muted">Next step: {nextStepLabelHub}</p>
          </div>
          <div className="progress-bar">
            <span style={{ width: `${setupProgressSteps}%` }} />
          </div>
          <a className="ghost-button" href={nextStepHrefHub}>
            Continue
          </a>
        </div>

        <div className="setup-step-grid">
          {stepMeta.map((step, index) => {
            const status = stepStatusMap[step.stepId];
            const ctaLabel =
              status === "completed" ? "Edit" : status === "not_started" ? "Start" : "Continue";
            return (
              <div key={step.stepId} className="card setup-step-card">
                <div className="setup-step-header">
                  <span className="setup-step-number">Step {index + 1}</span>
                  <StatusPill status={status} />
                </div>
                <h3>{step.label}</h3>
                <p className="muted">{step.description}</p>
                <small className="muted">Completion: {step.criteria}</small>
                <div className="setup-step-actions">
                  <a className="button secondary" href={stepRouteMap[step.stepId]}>
                    {ctaLabel}
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        <details className="card readiness-card">
          <summary>
            <strong>Go-live readiness</strong>
            <span className="muted">Review missing items before launch.</span>
          </summary>
          <div className="list" style={{ marginTop: 16 }}>
            {goLiveMissing.length === 0 && (
              <div className="line-item">
                <div>
                  <strong>All required steps complete</strong>
                  <small>You are ready to go live.</small>
                </div>
                <span className="badge">Ready</span>
              </div>
            )}
            {goLiveMissing.map((item) => (
              <div key={item} className="line-item">
                <div>
                  <strong>{item}</strong>
                  <small>Open the matching setup step to resolve.</small>
                </div>
                <a className="ghost-button" href={nextStepHrefHub}>
                  Fix
                </a>
              </div>
            ))}
          </div>
        </details>
      </main>
    );
  }

  return (
    <main className="dashboard-page wizard-page">
          <div className="wizard-header">
            <div className="wizard-title-block">
              <div className="breadcrumb">Admin / Setup / {stepLabelMap[initialSectionId || "setup-branding"]}</div>
              <h1>{stepLabelMap[initialSectionId || "setup-branding"]}</h1>
              <p className="muted">
                {stepMeta.find((step) => step.stepId === initialSectionId)?.description ||
                  "Follow the steps to complete setup."}
              </p>
              <div className="wizard-meta">
                <StatusPill status={activeStepStatus} />
                {activeStepValidation && !activeStepValidation.ready && (
                  <span className="muted">{activeStepValidation.message}</span>
                )}
                {setupStateSaving && <span className="muted">Autosaving...</span>}
                {statusAt && <span className="muted">Last saved: {new Date(statusAt).toLocaleTimeString()}</span>}
              </div>
              {status && <div className={`inline-status ${statusTone}`}>{status}</div>}
            </div>
            <div className="wizard-header-actions">
              <button className="ghost-button mobile-only" type="button" onClick={() => setStepsDrawerOpen(true)}>
                Steps
              </button>
              <button className="button secondary" onClick={loadStructure} disabled={loading || !schoolId}>
                {loading ? "Refreshing..." : "Refresh data"}
              </button>
            </div>
          </div>

      <div className="wizard-mobile-progress">
        <span>
          Step {stepIndex + 1} of {stepOrder.length}
        </span>
        <div className="progress-bar">
          <span style={{ width: `${((stepIndex + 1) / stepOrder.length) * 100}%` }} />
        </div>
      </div>

      <div className={`wizard-shell ${stepsDrawerOpen ? "steps-open" : ""}`}>
        <aside className="wizard-stepper">
          <div className="wizard-stepper-header">
            <strong>Setup steps</strong>
            <button className="icon-button mobile-only" type="button" onClick={() => setStepsDrawerOpen(false)}>
              X
            </button>
          </div>
          {stepMeta.map((step, index) => {
            const isActive = step.stepId === initialSectionId;
            const status = stepStatusMap[step.stepId];
            return (
              <a
                key={step.stepId}
                href={stepRouteMap[step.stepId]}
                className={`wizard-step ${isActive ? "active" : ""}`}
              >
                <div className="wizard-step-title">
                  <span className="wizard-step-index">{index + 1}</span>
                  <div>
                    <strong>{step.label}</strong>
                    <small className="muted">{step.description}</small>
                  </div>
                </div>
                <StatusPill status={status} />
              </a>
            );
          })}
        </aside>

        <section className="wizard-content">
        <div
          className="card"
          id="setup-branding"
          style={{ display: isSectionVisible("setup-branding") ? undefined : "none" }}
        >
          <h3>
            School profile & branding <span className="badge">{brandingReady ? "Ready" : "Pending"}</span>
          </h3>
          <p className="muted">
            Set your school name, logo, and contact details. Parents will see this on the portal and receipts.
          </p>
          <div className="wizard-note">
            Use a clear name like "Great Heights Primary School" and a square logo if possible.
          </div>
          {renderChecklist("setup-branding", "Branding requirements")}
          <div className="wizard-stack">
            <div className="wizard-card">
              <div className="wizard-card-header">
                <div>
                  <strong>Identity & logo</strong>
                  <p className="muted">Parents will see this on the portal, invoices, and receipts.</p>
                </div>
                <div className="wizard-meta">
                  {lastSavedBrandingAt && (
                    <span className="badge">Saved {new Date(lastSavedBrandingAt).toLocaleString()}</span>
                  )}
                  {brandingDirty && <span className="badge">Draft</span>}
                </div>
              </div>
              <div className="line-item">
                <div>
                  <strong>{brandName || "School name preview"}</strong>
                  <small>{brandEmail || "contact@example.com"}</small>
                  <small>{brandPhone || "+234 000 000 0000"}</small>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {brandLogo && !logoLoadError ? (
                    <img
                      src={brandLogo}
                      alt="School logo preview"
                      style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover" }}
                      onError={() => setLogoLoadError(true)}
                    />
                  ) : (
                    <span className="badge">Logo</span>
                  )}
                  <span className="badge" style={{ background: brandPrimary, color: "#fff" }}>
                    Primary
                  </span>
                  <span className="badge" style={{ background: brandAccent, color: "#fff" }}>
                    Accent
                  </span>
                </div>
              </div>
              <div className="wizard-form-grid">
                <div className="form-grid">
                  <input
                    placeholder="School display name"
                    value={brandName}
                    onChange={(event) => setBrandName(event.target.value)}
                  />
                  <div className="file-drop">
                    <input type="file" accept="image/*" onChange={handleLogoFileChange} />
                    <div>
                      <strong>Upload school logo</strong>
                      <small>PNG or JPG. Square works best on receipts.</small>
                    </div>
                  </div>
                  <div className="action-row">
                    <button className="ghost-button" type="button" onClick={clearBrandLogo} disabled={!brandLogo}>
                      Remove logo
                    </button>
                  </div>
                  <details className="panel panel-muted">
                    <summary className="line-item" style={{ cursor: "pointer" }}>
                      <div>
                        <strong>Use a logo link instead</strong>
                        <small>Paste an HTTPS logo URL if you host the image elsewhere.</small>
                      </div>
                    </summary>
                    <input
                      placeholder="https://..."
                      value={brandLogoLink}
                      onChange={handleLogoLinkChange}
                    />
                  </details>
                  {!brandLogoOk && <p className="muted">Logo must be a valid image link or upload.</p>}
                  {brandLogo && logoLoadError && <p className="muted">Logo could not be loaded.</p>}
                  <p className="muted">Recommended: square logo, 256x256px or larger.</p>
                  <div className="grid">
                    <label className="line-item">
                      <span>Primary color</span>
                      <input
                        type="color"
                        value={brandPrimary}
                        onChange={(event) => setBrandPrimary(event.target.value)}
                      />
                    </label>
                    <label className="line-item">
                      <span>Accent color</span>
                      <input
                        type="color"
                        value={brandAccent}
                        onChange={(event) => setBrandAccent(event.target.value)}
                      />
                    </label>
                  </div>
                  <button className="ghost-button" type="button" onClick={resetBrandingDefaults}>
                    Reset colors
                  </button>
                  <input
                    placeholder="Address"
                    value={brandAddress}
                    onChange={(event) => setBrandAddress(event.target.value)}
                  />
                  <div className="grid">
                    <input
                      placeholder="City"
                      value={brandCity}
                      onChange={(event) => setBrandCity(event.target.value)}
                    />
                    <input
                      placeholder="State"
                      value={brandState}
                      onChange={(event) => setBrandState(event.target.value)}
                    />
                  </div>
                  <div className="grid">
                    <input
                      placeholder="Contact email"
                      value={brandEmail}
                      onChange={(event) => setBrandEmail(event.target.value)}
                    />
                    <input
                      placeholder="Contact phone"
                      value={brandPhone}
                      onChange={(event) => setBrandPhone(event.target.value)}
                    />
                  </div>
                  {(!brandEmailOk || !brandPhoneOk) && (
                    <p className="muted">Use E.164 phone format, e.g. +2348012345678.</p>
                  )}
                  <div className="action-row">
                    <button className="ghost-button" type="button" onClick={applyBrandingPreview}>
                      Preview colors
                    </button>
                    <button className="ghost-button" type="button" onClick={resetBrandingPreview}>
                      Reset preview
                    </button>
                  </div>
                  <div className="action-row">
                    <button className="ghost-button" type="button" onClick={copyThemeJson}>
                      Copy theme JSON
                    </button>
                    <button className="ghost-button" type="button" onClick={downloadThemeJson}>
                      Download theme JSON
                    </button>
                  </div>
                  {schoolSlug && (
                    <div className="action-row">
                      <a
                        className="ghost-button"
                        href={buildSchoolBaseUrl(schoolSlug)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View public portal
                      </a>
                      <a className="ghost-button" href="/portal" target="_blank" rel="noreferrer">
                        View parent portal
                      </a>
                      <a className="ghost-button" href="/teacher" target="_blank" rel="noreferrer">
                        View teacher portal
                      </a>
                      <a className="ghost-button" href="/admin" target="_blank" rel="noreferrer">
                        View admin portal
                      </a>
                      <button className="ghost-button" type="button" onClick={copyPortalLinks}>
                        Copy portal links
                      </button>
                    </div>
                  )}
                  {brandingStatus && <p className="muted">{brandingStatus}</p>}
                  <button
                    className="button"
                    onClick={saveBranding}
                    disabled={saving || !schoolId || !brandEmailOk || !brandPhoneOk || !brandLogoOk}
                  >
                    {saving ? "Saving..." : "Save branding"}
                  </button>
                </div>
                <div className="preview-card">
                  <div className="preview-header">
                    <div className="preview-logo">
                      {brandLogo && !logoLoadError ? (
                        <img
                          src={brandLogo}
                          alt="School logo preview"
                          style={{ width: 40, height: 40, objectFit: "cover" }}
                          onError={() => setLogoLoadError(true)}
                        />
                      ) : (
                        <span>{(brandName || "CP").slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <strong>{brandName || "School Name"}</strong>
                      <small className="muted">
                        {(brandCity || "City") + (brandState ? `, ${brandState}` : "")}
                      </small>
                    </div>
                  </div>
                  <div className="preview-banner" style={{ background: brandPrimary }}>
                    <strong style={{ color: "#fff" }}>Portal header</strong>
                    <span style={{ color: "#eef2ff" }}>Welcome back, parents</span>
                  </div>
                  <div className="preview-card-mini">
                    <div>
                      <strong>Announcement</strong>
                      <small className="muted">PTA meeting on Friday at 4:00 PM.</small>
                    </div>
                    <span className="badge" style={{ background: brandAccent, color: "#fff" }}>
                      New
                    </span>
                  </div>
                  <div className="preview-receipt">
                    <strong>Receipt header</strong>
                    <div className="preview-row">
                      <span>Receipt for</span>
                      <span>{brandName || "School Name"}</span>
                    </div>
                    <div className="preview-row">
                      <span>Contact</span>
                      <span>{brandEmail || "contact@example.com"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          className="card"
          id="setup-fee-items"
          style={{ display: isSectionVisible("setup-fee-items") ? undefined : "none" }}
        >
          <h3>
            Fee items (what parents will see) <span className="badge">{feeItems.length ? "Ready" : "Pending"}</span>
          </h3>
          <p className="muted">
            List the common fees parents recognize: Tuition, Development Levy, PTA, Uniform, Books, Bus, Lunch, Exam.
          </p>
          <div className="wizard-note">
            Add the fee items first, then move to Fee schedules to set amounts per class.
          </div>
          {isStepView && renderChecklist("setup-fee-items", "Fees requirements")}
          <div className="wizard-stack">
            <div className="wizard-card">
              <div className="wizard-card-header">
                <div>
                  <strong>Add fee items</strong>
                  <p className="muted">Start with tuition and any mandatory levies.</p>
                </div>
              </div>
              <div className="form-grid">
                <input
                  placeholder="Fee item (e.g., Tuition, Development Levy)"
                  value={feeItemName}
                  onChange={(event) => setFeeItemName(event.target.value)}
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
                <p className="muted">Category helps with reports (e.g., LEVY for PTA/Development).</p>
                <label className="line-item">
                  <span>Optional (parents can choose)</span>
                  <input
                    type="checkbox"
                    checked={feeItemOptional}
                    onChange={(event) => setFeeItemOptional(event.target.checked)}
                  />
                </label>
                <label className="line-item">
                  <span>Show on new schedules</span>
                  <input
                    type="checkbox"
                    checked={feeItemActive}
                    onChange={(event) => setFeeItemActive(event.target.checked)}
                  />
                </label>
                <button className="button" onClick={createFeeItem} disabled={saving || !schoolId || !feeItemName}>
                  Save fee item
                </button>
              </div>
            </div>
            <div className="wizard-card">
              <div className="wizard-card-header">
                <div>
                  <strong>Nigeria quick add</strong>
                  <p className="muted">Adds common items like Tuition, PTA Levy, and Exam Fee.</p>
                </div>
                <button
                  className="button secondary"
                  type="button"
                  onClick={addNigeriaFeePack}
                  disabled={saving || !schoolId}
                >
                  Add Nigeria pack
                </button>
              </div>
              <div className="list">
                <div className="line-item">
                  <span>Tuition, Development Levy, PTA Levy, Exam Fee</span>
                </div>
                <div className="line-item">
                  <span>Uniform, Books, Transport, Lunch (optional)</span>
                </div>
              </div>
            </div>
            <div className="wizard-card">
              <div className="wizard-card-header">
                <div>
                  <strong>Current fee items</strong>
                  <p className="muted">Use these when building schedules.</p>
                </div>
              </div>
              <div className="list">
                {feeItems.length === 0 && <div className="empty-state">No fee items yet.</div>}
                {feeItems.map((item) => (
                  <div key={item.id} className="line-item">
                    <div>
                      <strong>{item.name}</strong>
                      <small>{item.category}</small>
                    </div>
                    <span className="badge">{item.isOptional ? "Optional" : "Required"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div
          className="card"
          id="setup-fee-schedules"
          style={{ display: isSectionVisible("setup-fee-schedules") ? undefined : "none" }}
        >
          <h3>
            Fee schedules (by class and term) <span className="badge">{feeSchedules.length ? "Ready" : "Pending"}</span>
          </h3>
          <p className="muted">
            A schedule is the full term fees for one class. Example: Primary 3 - 1st Term.
          </p>
          <div className="wizard-stack">
            <div className="wizard-card">
              <div className="wizard-card-header">
                <div>
                  <strong>Before you start</strong>
                  <p className="muted">Make sure Academic Structure has your class years and terms.</p>
                </div>
                <a className="ghost-button" href="/admin/setup/academic-structure">
                  Open Academic Structure
                </a>
              </div>
              <div className="wizard-note">
                Pick the term and class, save the schedule, then set amounts in "Amounts and due dates" below.
              </div>
            </div>
            <div className="wizard-card">
              <div className="wizard-card-header">
                <div>
                  <strong>Create a schedule</strong>
                  <p className="muted">Each schedule is for one class in one term.</p>
                </div>
                {scheduleFormDirty && <span className="badge">Draft</span>}
              </div>
              <div className="form-grid">
                {!terms.length && <p className="muted">Create a term before setting up fee schedules.</p>}
                {!feeYears.length && (
                  <p className="muted">Create class years before setting up fee schedules.</p>
                )}
                <div className="action-row">
                  <button className="ghost-button" type="button" onClick={loadFeeClassYears} disabled={loading}>
                    Load classes
                  </button>
                  <button
                    className="button"
                    type="button"
                    onClick={createDefaultFeeSchedules}
                    disabled={saving || !schoolId || !terms.length || !feeYears.length}
                  >
                    Create schedules for all classes
                  </button>
                </div>
                <select
                  value={scheduleTermId}
                  onChange={(event) => setScheduleTermId(event.target.value)}
                  disabled={!terms.length}
                >
                  <option value="">Select term (1st, 2nd, 3rd)</option>
                  {terms.map((term) => (
                    <option key={term.id} value={term.id}>
                      {term.name}
                    </option>
                  ))}
                </select>
                <select
                  value={scheduleClassYearId}
                  onChange={(event) => setScheduleClassYearId(event.target.value)}
                  disabled={!feeYears.length}
                >
                  <option value="">Select class (e.g., Primary 3, JSS1)</option>
                  {feeYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="Schedule name (e.g., JSS1 - 1st Term)"
                  value={scheduleName}
                  onChange={(event) => setScheduleName(event.target.value)}
                />
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => {
                    const term = terms.find((item) => item.id === scheduleTermId);
                    const year = feeYears.find((item) => item.id === scheduleClassYearId);
                    if (!term || !year) {
                      setFeesStatusNote("Select term and class to generate the schedule name.");
                      return;
                    }
                    setScheduleName(`${year.name} - ${term.name}`);
                    setFeesStatusNote("");
                  }}
                  disabled={!scheduleTermId || !scheduleClassYearId}
                >
                  Generate schedule name
                </button>
                {feesStatusNote && <div className="inline-status info">{feesStatusNote}</div>}
                <div className="grid">
                  <select value={scheduleCurrency} onChange={(event) => setScheduleCurrency(event.target.value)}>
                    <option value="NGN">NGN</option>
                    <option value="GHS">GHS</option>
                    <option value="KES">KES</option>
                    <option value="USD">USD</option>
                  </select>
                  <label className="line-item">
                    <span>Active</span>
                    <input
                      type="checkbox"
                      checked={scheduleActive}
                      onChange={(event) => setScheduleActive(event.target.checked)}
                    />
                  </label>
                </div>
                <p className="muted">NGN is the default for Nigerian schools.</p>
                <button
                  className="button"
                  onClick={createFeeSchedule}
                  disabled={
                    saving ||
                    !schoolId ||
                    !scheduleTermId ||
                    !scheduleClassYearId ||
                    !scheduleName ||
                    !(terms.length > 0 && feeYears.length > 0)
                  }
                >
                  Save schedule
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => {
                    if (scheduleFormDirty && !window.confirm("Clear schedule form inputs?")) {
                      return;
                    }
                    setScheduleTermId("");
                    setScheduleClassYearId("");
                    setScheduleName("");
                    setScheduleCurrency("NGN");
                    setScheduleActive(true);
                    setSelectedScheduleId("");
                    setFeeLines([]);
                  }}
                >
                  Clear schedule form
                </button>
              </div>
            </div>
            <div className="wizard-card">
              <div className="wizard-card-header">
                <div>
                  <strong>Saved schedules</strong>
                  <p className="muted">Select one to add amounts below.</p>
                </div>
              </div>
              <div className="list">
                {feeSchedules.length === 0 && <div className="empty-state">No schedules yet.</div>}
                {feeSchedules.map((schedule) => (
                  <div key={schedule.id} className="line-item">
                    <div>
                      <strong>{schedule.name}</strong>
                      <small>{schedule.currency}</small>
                    </div>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => setSelectedScheduleId(schedule.id)}
                    >
                      {selectedScheduleId === schedule.id ? "Selected" : "Select"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div
          className="card"
          id="setup-fee-lines"
          style={{ display: isSectionVisible("setup-fee-lines") ? undefined : "none" }}
        >
          <h3>
            Amounts and due dates <span className="badge">{feeLines.length ? "Ready" : "Pending"}</span>
          </h3>
          <p className="muted">Add the amount for each fee item and set when it is due in the term.</p>
          <div className="wizard-note">
            Select a schedule, add amounts and due dates, then preview what parents will see.
          </div>
          <div className="wizard-stack">
            <div className="wizard-card">
              <div className="wizard-card-header">
                <div>
                  <strong>Add amounts & due dates</strong>
                  <p className="muted">Set the amount per item and due date within the term.</p>
                </div>
                {lineFormDirty && <span className="badge">Draft</span>}
              </div>
              <div className="form-grid">
                {!feeSchedules.length && <p className="muted">Create a fee schedule before adding lines.</p>}
                {!feeItems.length && <p className="muted">Add fee items to use in schedule lines.</p>}
                {!selectedScheduleId && feeSchedules.length > 0 && (
                  <p className="muted">Select a schedule to view and add lines.</p>
                )}
                <button
                  className="button"
                  type="button"
                  onClick={createDefaultFeeLines}
                  disabled={!canCreateLines || !selectedScheduleId || saving}
                >
                  Add all fee items (quick start)
                </button>
                <select
                  value={selectedScheduleId}
                  onChange={(event) => setSelectedScheduleId(event.target.value)}
                  disabled={!feeSchedules.length}
                >
                  <option value="">Select schedule to add amounts</option>
                  {feeSchedules.map((schedule) => (
                    <option key={schedule.id} value={schedule.id}>
                      {schedule.name}
                    </option>
                  ))}
                </select>
                <select
                  value={lineFeeItemId}
                  onChange={(event) => setLineFeeItemId(event.target.value)}
                  disabled={!feeItems.length}
                >
                  <option value="">Select fee item</option>
                  {feeItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <div className="grid">
              <input
                placeholder="Amount (NGN)"
                type="text"
                inputMode="decimal"
                value={lineAmount}
                onChange={(event) => setLineAmount(event.target.value)}
                disabled={!canCreateLines}
              />
                  <input
                    placeholder="Due date (within the term)"
                    type="date"
                    value={lineDueDate}
                    onChange={(event) => setLineDueDate(event.target.value)}
                    disabled={!canCreateLines}
                  />
                </div>
                {lineAmountTouched && !lineAmountOk && (
                  <p className="muted">Amount must be greater than 0.</p>
                )}
                {!lineDueDateOk && selectedTerm && feeTermDatesValid && (
                  <div className="wizard-note">
                    Due date should be within {feeTermStartDisplay} and {feeTermEndDisplay}. Update term dates if the
                    range is wrong.
                    <div className="action-row" style={{ marginTop: 8 }}>
                      <a className="ghost-button" href="/admin/setup/academic-structure">
                        Update term dates
                      </a>
                    </div>
                  </div>
                )}
                {!lineDueDateOk && selectedTerm && !feeTermDatesValid && (
                  <p className="muted">Term dates are missing or invalid. Please update the term dates.</p>
                )}
                {lineBlockers.length > 0 && (
                  <div className="inline-alert">
                    {lineBlockers.slice(0, 3).join(" ")}
                  </div>
                )}
                <div className="grid">
                  <input
                    placeholder="Display order (1 = top)"
                    type="number"
                    value={lineSortOrder}
                    onChange={(event) => setLineSortOrder(Number(event.target.value || 0))}
                    disabled={!canCreateLines}
                  />
                  {!lineSortOk && <p className="muted">Sort order must be greater than 0.</p>}
                  <label className="line-item">
                    <span>Optional for parents</span>
                    <input
                      type="checkbox"
                      checked={lineOptionalOverride}
                      onChange={(event) => setLineOptionalOverride(event.target.checked)}
                      disabled={!canCreateLines}
                    />
                  </label>
                </div>
            <button
              className="button"
              onClick={createFeeLine}
              disabled={
                saving ||
                !schoolId ||
                !selectedScheduleId ||
                !lineFeeItemId ||
                !lineAmountOk ||
                !lineSortOk ||
                !lineDueDateOk ||
                !canCreateLines
              }
            >
                  Add line
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => {
                    if (lineFormDirty && !window.confirm("Clear line form inputs?")) {
                      return;
                    }
                    setLineFeeItemId("");
                    setLineAmount("");
                    setLineDueDate("");
                    setLineOptionalOverride(false);
                    setLineSortOrder(1);
                  }}
                  disabled={!selectedScheduleId}
                >
                  Clear line form
                </button>
              </div>
            </div>
            <div className="wizard-card">
              <div className="wizard-card-header">
                <div>
                  <strong>Schedule lines</strong>
                  <p className="muted">These are the charges parents will see.</p>
                </div>
                {feeLines.length > 0 && (
                  <div className="action-row">
                    <button className="button" type="button" onClick={copyScheduleTotal}>
                      Copy schedule total
                    </button>
                    <button className="button" type="button" onClick={exportScheduleLines}>
                      Export schedule lines
                    </button>
                  </div>
                )}
              </div>
              <div className="list">
                {feeLines.length === 0 && <div className="empty-state">No lines yet.</div>}
                {feeLines.map((line) => {
                  const item = feeItems.find((feeItem) => feeItem.id === line.feeItemId);
                  return (
                    <div key={line.id} className="line-item">
                      <div>
                        <strong>{item?.name || "Fee item"}</strong>
                        <small>Amount: {line.amount.toLocaleString()}</small>
                        <small>Due: {line.dueDate || "Not set"}</small>
                      </div>
                      <span className="badge">{line.isOptionalOverride ? "Optional" : "Required"}</span>
                    </div>
                  );
                })}
                {feeLines.length > 0 && (
                  <div className="line-item">
                    <div>
                      <strong>Total scheduled amount</strong>
                      <small>{totalFeeAmount.toLocaleString()}</small>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="wizard-card">
              <div className="preview-card">
                <div className="preview-header">
                  <div>
                    <strong>Parent view preview</strong>
                    <small className="muted">
                      {selectedSchedule?.name || "Select a schedule to preview the invoice layout."}
                    </small>
                  </div>
                  <span className="badge">Draft</span>
                </div>
                {feePreviewLines.length === 0 ? (
                  <p className="muted">Add schedule lines to see a parent-facing breakdown.</p>
                ) : (
                  <>
                    <div className="preview-section">
                      <strong>Required fees</strong>
                      <div className="preview-list">
                        {feePreviewRequired.map((line) => (
                          <div key={line.id} className="preview-row">
                            <span>{line.name}</span>
                            <span>{line.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {feePreviewOptional.length > 0 && (
                      <div className="preview-section">
                        <strong>Optional add-ons</strong>
                        <div className="preview-list">
                          {feePreviewOptional.map((line) => (
                            <div key={line.id} className="preview-row">
                              <span>{line.name}</span>
                              <span>{line.amount.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="preview-total">
                      <span>Total due</span>
                      <strong>{feePreviewTotal.toLocaleString()}</strong>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div
          className="card"
          id="setup-payments"
          style={{ display: isSectionVisible("setup-payments") ? undefined : "none" }}
        >
          <h3>
            Payments setup <span className="badge">{paymentsSaved ? "Ready" : "Pending"}</span>
          </h3>
          <p className="muted">Enable cash or transfer now, and pick your online gateway for later.</p>
          <div className="wizard-note">
            In Nigeria, most schools start with bank transfer and receipts before switching on Paystack or Flutterwave.
          </div>
          {renderChecklist("setup-payments", "Payment requirements")}
          <div className="wizard-stack">
            <div className="wizard-card">
              <div className="wizard-card-header">
                <div>
                  <strong>Payment controls</strong>
                  <p className="muted">Start with offline payments while you prepare your gateway.</p>
                </div>
                <div className="wizard-meta">
                  {lastSavedPaymentsAt && (
                    <span className="badge">Saved {new Date(lastSavedPaymentsAt).toLocaleString()}</span>
                  )}
                  {paymentsDirty && <span className="badge">Draft</span>}
                </div>
              </div>
              <div className="line-item">
                <div>
                  <strong>Gateway status</strong>
                  <small>Online payments will be enabled once provider keys are approved.</small>
                </div>
                <span className="badge">Pending</span>
              </div>
              <div className="form-grid">
                <label className="line-item">
                  <span>Enable manual/offline payments</span>
                  <input
                    type="checkbox"
                    checked={manualPaymentsEnabled}
                    onChange={(event) => setManualPaymentsEnabled(event.target.checked)}
                  />
                </label>
                <select value={paymentProvider} onChange={(event) => setPaymentProvider(event.target.value)}>
                  <option value="PAYSTACK">Paystack</option>
                  <option value="FLUTTERWAVE">Flutterwave</option>
                </select>
                <p className="muted">
                  Online gateway setup is on hold until stakeholder approval. Use manual payments and receipts for now.
                </p>
                {paymentStatusNote && <p className="muted">{paymentStatusNote}</p>}
                <button className="button" type="button" onClick={savePayments}>
                  Save payments setup
                </button>
              </div>
            </div>
          </div>
        </div>
        <div
          className="card"
          id="setup-comms"
          style={{ display: isSectionVisible("setup-comms") ? undefined : "none" }}
        >
          <h3>
            Communications setup <span className="badge">{commsSaved ? "Ready" : "Pending"}</span>
          </h3>
          <p className="muted">Set your SMS sender name and message templates for parents.</p>
          <div className="wizard-note">
            Keep messages short and clear. Use parentName and studentName so parents recognize the child.
          </div>
          {renderChecklist("setup-comms", "Communications requirements")}
          <div className="wizard-stack">
            <div className="wizard-card">
              <div className="wizard-card-header">
                <div>
                  <strong>SMS templates</strong>
                  <p className="muted">Send clear and short messages to parents.</p>
                </div>
                <div className="wizard-meta">
                  {lastSavedCommsAt && (
                    <span className="badge">Saved {new Date(lastSavedCommsAt).toLocaleString()}</span>
                  )}
                  {commsDirty && <span className="badge">Draft</span>}
                </div>
              </div>
              <div className="form-grid">
                <button className="ghost-button" type="button" onClick={resetCommunicationsDefaults}>
                  Reset templates
                </button>
                <input
                  placeholder="SMS sender name"
                  value={smsSenderName}
                  onChange={(event) => setSmsSenderName(event.target.value)}
                />
                <select value={smsChannel} onChange={(event) => setSmsChannel(event.target.value)}>
                  <option value="SMS">SMS (Twilio)</option>
                  <option value="WHATSAPP">WhatsApp (coming soon)</option>
                </select>
                <div className="panel panel-muted">
                  <div className="panel-header">
                    <div>
                      <strong>Invoice template</strong>
                      <small>Sent when a new invoice is issued.</small>
                    </div>
                    <span className="badge">{smsTemplateInvoice.length} chars</span>
                  </div>
                  <textarea
                    rows={3}
                    value={smsTemplateInvoice}
                    onChange={(event) => setSmsTemplateInvoice(event.target.value)}
                  />
                </div>
                <div className="panel panel-muted">
                  <div className="panel-header">
                    <div>
                      <strong>Receipt template</strong>
                      <small>Sent after payment is confirmed.</small>
                    </div>
                    <span className="badge">{smsTemplateReceipt.length} chars</span>
                  </div>
                  <textarea
                    rows={3}
                    value={smsTemplateReceipt}
                    onChange={(event) => setSmsTemplateReceipt(event.target.value)}
                  />
                </div>
                <div className="line-item">
                  <div>
                    <strong>Invoice preview</strong>
                    <small>{renderSmsPreview(smsTemplateInvoice)}</small>
                  </div>
                </div>
                <div className="line-item">
                  <div>
                    <strong>Receipt preview</strong>
                    <small>{renderSmsPreview(smsTemplateReceipt)}</small>
                  </div>
                </div>
                <p className="muted">
                  Use variables: {"{{parentName}}"}, {"{{studentName}}"}, {"{{amountDue}}"}, {"{{dueDate}}"},{" "}
                  {"{{amount}}"}, {"{{currency}}"}, {"{{receiptNo}}"}.
                </p>
                {smsStatusNote && <p className="muted">{smsStatusNote}</p>}
                <button className="button" type="button" onClick={saveCommunications}>
                  Save communications setup
                </button>
              </div>
            </div>
          </div>
        </div>
        {academicManualOpen && isAcademicStep && (
          <div className="card">
            <h3>Quick generator</h3>
            <p className="muted">Generate default levels and class years in one pass.</p>
            <div className="list">
              <label className="line-item">
                <div>
                  <strong>Enable Primary</strong>
                  <small>Creates Primary 1-6 class years.</small>
                </div>
                <input
                  type="checkbox"
                  checked={academicPrimaryEnabled}
                  onChange={(event) => setAcademicPrimaryEnabled(event.target.checked)}
                />
              </label>
              <label className="line-item">
                <div>
                  <strong>Enable Secondary</strong>
                  <small>Creates JSS/SSS 1-3 class years.</small>
                </div>
                <input
                  type="checkbox"
                  checked={academicSecondaryEnabled}
                  onChange={(event) => setAcademicSecondaryEnabled(event.target.checked)}
                />
              </label>
              <label className="line-item">
                <div>
                  <strong>Generate class arms</strong>
                  <small>Adds A/B/C as optional arms.</small>
                </div>
                <input
                  type="checkbox"
                  checked={academicArmsEnabled}
                  onChange={(event) => setAcademicArmsEnabled(event.target.checked)}
                />
              </label>
              <div className="line-item">
                <div>
                  <strong>Preview</strong>
                  <small>
                    {academicPrimaryEnabled ? "Primary: 6 years" : "Primary: skipped"} /{" "}
                    {academicSecondaryEnabled ? "Secondary: 6 years" : "Secondary: skipped"} /{" "}
                    {academicArmsEnabled ? "Arms: A/B/C" : "Arms: skipped"}
                  </small>
                </div>
                <span className="badge">Defaults</span>
              </div>
            </div>
            <div className="grid" style={{ marginTop: 12 }}>
              <button
                className="button"
                type="button"
                onClick={handleGenerateAcademicDefaults}
                disabled={saving || !schoolId}
              >
                Generate defaults
              </button>
              <button
                className="button secondary"
                type="button"
                onClick={handleGenerateAcademicSuite}
                disabled={saving || !schoolId}
              >
                Generate defaults + class groups
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={() => {
                  setAcademicPrimaryEnabled(true);
                  setAcademicSecondaryEnabled(true);
                  setAcademicArmsEnabled(true);
                }}
              >
                Reset
              </button>
            </div>
            <small className="muted" style={{ marginTop: 8 }}>
              This creates class years (and optional arms) before generating class groups.
            </small>
          </div>
        )}
        <div
          className="card"
          id="setup-academic"
          style={{
            display: isSectionVisible("setup-academic") ? undefined : "none"
          }}
        >
          <h3>
            Academic structure <span className="badge">{academicStepReady ? "Ready" : "Pending"}</span>
          </h3>
          <p className="muted">
            Quick setup for Nigerian schools (Primary 1-6, JSS1-SSS3). We will build the structure for you.
          </p>
          <div className="list tutorial">
            <div className="line-item">
              <span>Step 1: Choose the school type.</span>
            </div>
            <div className="line-item">
              <span>Step 2: Set the session year and term count.</span>
            </div>
            <div className="line-item">
              <span>Step 3: Review class years and (optional) arms/streams.</span>
            </div>
            <div className="line-item">
              <span>Step 4: Confirm subjects or skip for later.</span>
            </div>
            <div className="line-item">
              <span>Step 5: Review and create the structure.</span>
            </div>
          </div>
          {isAcademicStep && renderChecklist("setup-academic", "Academic requirements")}
          {status && (
            <div className={`inline-status ${statusTone}`} style={{ marginBottom: 12 }}>
              {status}
            </div>
          )}
          {!academicStepReady && academicMissing.length > 0 && (
            <div className="inline-alert" style={{ marginBottom: 12 }}>
              Still missing: {academicMissing.join(", ")}.
            </div>
          )}
          <div className="wizard-substeps">
            {[
              { id: 1, label: "School type" },
              { id: 2, label: "Calendar" },
              { id: 3, label: "Classes" },
              { id: 4, label: "Subjects" },
              { id: 5, label: "Review" }
            ].map((step) => (
              <button
                key={step.id}
                type="button"
                className={`substep${academicWizardStep === step.id ? " active" : ""}`}
                onClick={() => setAcademicWizardStep(step.id)}
              >
                {step.label}
              </button>
            ))}
          </div>

          {academicWizardStep === 1 && (
            <div className="wizard-card">
              <div className="wizard-card-header">
                <div>
                  <strong>School type</strong>
                  <p className="muted">Choose the structure that matches your school in Nigeria.</p>
                </div>
                <span className="wizard-pill">Defaults</span>
              </div>
              <div className="choice-grid">
                {[
                  { id: "primary-only", label: "Primary only", note: "Primary 1 to 6" },
                  { id: "secondary-only", label: "Secondary only", note: "JSS1 to SSS3" },
                  { id: "primary-secondary", label: "Primary + Secondary", note: "Most private schools" },
                  { id: "nursery-primary", label: "Nursery + Primary", note: "ECCDE + Primary 1-6" },
                  { id: "nursery-primary-secondary", label: "Nursery + Primary + Secondary", note: "Full school" }
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`choice-card${academicSchoolType === option.id ? " active" : ""}`}
                    onClick={() => setAcademicSchoolType(option.id)}
                  >
                    <strong>{option.label}</strong>
                    <small>{option.note}</small>
                  </button>
                ))}
              </div>
              <div className="wizard-note">
                Default levels:{" "}
                {academicIncludeNursery ? "Nursery, " : ""}
                {academicIncludePrimary ? academicPrimaryLabel : ""}
                {academicIncludeSecondary ? `, ${academicSecondaryLabel}` : ""}
              </div>
              <button
                className="ghost-button"
                type="button"
                onClick={() => setAcademicShowAdvanced((prev) => !prev)}
              >
                {academicShowAdvanced ? "Hide advanced options" : "Show advanced options"}
              </button>
              {academicShowAdvanced && (
                <div className="panel panel-muted">
                  <div className="grid">
                    <label className="line-item">
                      <span>Rename Primary (optional)</span>
                      <input
                        value={academicPrimaryLabel}
                        onChange={(event) => setAcademicPrimaryLabel(event.target.value || "Primary")}
                      />
                    </label>
                    <label className="line-item">
                      <span>Rename Secondary (optional)</span>
                      <input
                        value={academicSecondaryLabel}
                        onChange={(event) => setAcademicSecondaryLabel(event.target.value || "Secondary")}
                      />
                    </label>
                  </div>
                  <label className="line-item">
                    <span>Enable ECCDE (Nursery + KG)</span>
                    <input
                      type="checkbox"
                      checked={academicECCDEEnabled}
                      onChange={(event) => setAcademicECCDEEnabled(event.target.checked)}
                    />
                  </label>
                  <label className="line-item">
                    <span>Add custom level group</span>
                    <input
                      placeholder="e.g., Creche"
                      value={academicCustomLevelName}
                      onChange={(event) => setAcademicCustomLevelName(event.target.value)}
                    />
                  </label>
                </div>
              )}
              <div className="wizard-actions">
                <div className="wizard-actions-left" />
                <div className="wizard-actions-right">
                  <button className="button" type="button" onClick={() => setAcademicWizardStep(2)}>
                    Save & Continue
                  </button>
                </div>
              </div>
            </div>
          )}

          {academicWizardStep === 2 && (
            <div className="wizard-card">
              <div className="wizard-card-header">
                <div>
                  <strong>Academic calendar</strong>
                  <p className="muted">Set the session and term names used in Nigerian schools.</p>
                </div>
              </div>
              <div className="wizard-inline">
                <label className="line-item">
                  <span>Session start year</span>
                  <input
                    type="number"
                    value={wizardSessionStartYear}
                    onChange={(event) => setWizardSessionStartYear(Number(event.target.value || 0))}
                  />
                </label>
                <label className="line-item">
                  <span>Session name</span>
                  <input value={wizardSessionName} readOnly />
                </label>
              </div>
              <label className="line-item">
                <span>Use default session dates (Sep - Jul)</span>
                <input
                  type="checkbox"
                  checked={wizardSessionDatesLocked}
                  onChange={(event) => setWizardSessionDatesLocked(event.target.checked)}
                />
              </label>
              {!wizardSessionDatesLocked && (
                <div className="grid">
                  <input
                    type="date"
                    value={wizardSessionStartDate}
                    onChange={(event) => setWizardSessionStartDate(event.target.value)}
                  />
                  <input
                    type="date"
                    value={wizardSessionEndDate}
                    onChange={(event) => setWizardSessionEndDate(event.target.value)}
                  />
                </div>
              )}
              <div className="grid">
                <label className="line-item">
                  <span>Term count</span>
                  <select
                    value={wizardTermCount}
                    onChange={(event) => setWizardTermCount(Number(event.target.value || 3))}
                  >
                    <option value={3}>3 Terms (recommended)</option>
                    <option value={2}>2 Terms</option>
                  </select>
                </label>
                <label className="line-item">
                  <span>Set term dates (optional)</span>
                  <input
                    type="checkbox"
                    checked={wizardTermDatesEnabled}
                    onChange={(event) => setWizardTermDatesEnabled(event.target.checked)}
                  />
                </label>
              </div>
              <label className="line-item">
                <span>Mid-term break</span>
                <input
                  type="checkbox"
                  checked={wizardMidtermBreakEnabled}
                  onChange={(event) => setWizardMidtermBreakEnabled(event.target.checked)}
                />
              </label>
              <div className="wizard-stack">
                <strong>Term names</strong>
                <div className="grid">
                  {wizardTermNames.map((name, index) => (
                    <input
                      key={`${name}-${index}`}
                      value={name}
                      onChange={(event) => {
                        const next = [...wizardTermNames];
                        next[index] = event.target.value;
                        setWizardTermNames(next);
                        setWizardTermNamesEdited(true);
                      }}
                    />
                  ))}
                </div>
              </div>
              {wizardTermDatesEnabled && (
                <div className="wizard-stack">
                  <strong>Term dates</strong>
                  <div className="grid">
                    {wizardTermDates.map((range, index) => (
                      <div key={`${range.start}-${index}`} className="form-grid">
                        <input
                          type="date"
                          value={range.start}
                          onChange={(event) => {
                            const next = [...wizardTermDates];
                            next[index] = { ...next[index], start: event.target.value };
                            setWizardTermDates(next);
                          }}
                        />
                        <input
                          type="date"
                          value={range.end}
                          onChange={(event) => {
                            const next = [...wizardTermDates];
                            next[index] = { ...next[index], end: event.target.value };
                            setWizardTermDates(next);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="wizard-actions">
                <div className="wizard-actions-left">
                  <button className="ghost-button" type="button" onClick={() => setAcademicWizardStep(1)}>
                    Back
                  </button>
                </div>
                <div className="wizard-actions-right">
                  <button className="button" type="button" onClick={() => setAcademicWizardStep(3)}>
                    Save & Continue
                  </button>
                </div>
              </div>
            </div>
          )}

          {academicWizardStep === 3 && (
            <div className="wizard-card">
              <div className="wizard-card-header">
                <div>
                  <strong>Classes & naming</strong>
                  <p className="muted">Confirm your class years and decide if you use arms/streams.</p>
                </div>
              </div>
              <div className="wizard-stack">
                <div className="wizard-card">
                  <strong>Class years (auto-generated)</strong>
                  <div className="list">
                    {academicIncludeNursery && academicECCDEEnabled && (
                      <div className="line-item">
                        <div>
                          <strong>Nursery</strong>
                          <small>{wizardNurseryYears.length ? wizardNurseryYears.join(", ") : "No nursery years."}</small>
                        </div>
                        <button
                          className="ghost-button"
                          type="button"
                          onClick={() => setShowNurseryYearsEditor((prev) => !prev)}
                        >
                          {showNurseryYearsEditor ? "Hide edit" : "Edit list"}
                        </button>
                      </div>
                    )}
                    {academicIncludePrimary && (
                      <div className="line-item">
                        <div>
                          <strong>{academicPrimaryLabel}</strong>
                          <small>{wizardPrimaryYears.length ? wizardPrimaryYears.join(", ") : "No primary years."}</small>
                        </div>
                        <button
                          className="ghost-button"
                          type="button"
                          onClick={() => setShowPrimaryYearsEditor((prev) => !prev)}
                        >
                          {showPrimaryYearsEditor ? "Hide edit" : "Edit list"}
                        </button>
                      </div>
                    )}
                    {academicIncludeSecondary && (
                      <div className="line-item">
                        <div>
                          <strong>{academicSecondaryLabel}</strong>
                          <small>
                            {wizardSecondaryYears.length ? wizardSecondaryYears.join(", ") : "No secondary years."}
                          </small>
                        </div>
                        <button
                          className="ghost-button"
                          type="button"
                          onClick={() => setShowSecondaryYearsEditor((prev) => !prev)}
                        >
                          {showSecondaryYearsEditor ? "Hide edit" : "Edit list"}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="action-row" style={{ marginTop: 8 }}>
                    {academicIncludeNursery && academicECCDEEnabled && (
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => {
                          setNurseryYearsText(defaultNurseryYears().join("\n"));
                          setNurseryYearsEdited(false);
                        }}
                      >
                        Reset nursery defaults
                      </button>
                    )}
                    {academicIncludePrimary && (
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => {
                          setPrimaryYearsText(defaultPrimaryYears(academicPrimaryLabel).join("\n"));
                          setPrimaryYearsEdited(false);
                        }}
                      >
                        Reset primary defaults
                      </button>
                    )}
                    {academicIncludeSecondary && (
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => {
                          setSecondaryYearsText(defaultSecondaryYears().join("\n"));
                          setSecondaryYearsEdited(false);
                        }}
                      >
                        Reset secondary defaults
                      </button>
                    )}
                  </div>
                </div>
                {academicIncludeNursery && academicECCDEEnabled && showNurseryYearsEditor && (
                  <div className="panel panel-muted">
                    <strong>Nursery years</strong>
                    <textarea
                      rows={4}
                      value={nurseryYearsText}
                      onChange={(event) => {
                        setNurseryYearsText(event.target.value);
                        setNurseryYearsEdited(true);
                      }}
                    />
                  </div>
                )}
                {academicIncludePrimary && showPrimaryYearsEditor && (
                  <div className="panel panel-muted">
                    <strong>{academicPrimaryLabel} years</strong>
                    <textarea
                      rows={4}
                      value={primaryYearsText}
                      onChange={(event) => {
                        setPrimaryYearsText(event.target.value);
                        setPrimaryYearsEdited(true);
                      }}
                    />
                  </div>
                )}
                {academicIncludeSecondary && showSecondaryYearsEditor && (
                  <div className="panel panel-muted">
                    <strong>{academicSecondaryLabel} years</strong>
                    <textarea
                      rows={4}
                      value={secondaryYearsText}
                      onChange={(event) => {
                        setSecondaryYearsText(event.target.value);
                        setSecondaryYearsEdited(true);
                      }}
                    />
                  </div>
                )}
                <div className="wizard-card">
                  <div className="wizard-card-header">
                    <div>
                      <strong>Arms / streams</strong>
                      <p className="muted">Use A/B/C or named arms like Blue/Gold.</p>
                    </div>
                    <label className="line-item">
                      <span>Enable arms</span>
                      <input
                        type="checkbox"
                        checked={wizardArmsEnabled}
                        onChange={(event) => setWizardArmsEnabled(event.target.checked)}
                      />
                    </label>
                  </div>
                  {wizardArmsEnabled && (
                    <div className="panel panel-muted">
                      <div className="tab-row">
                        {[
                          { id: "letters", label: "Letters (A, B, C)" },
                          { id: "names", label: "Names (Blue, Gold)" },
                          { id: "custom", label: "Custom pattern" }
                        ].map((mode) => (
                          <button
                            key={mode.id}
                            type="button"
                            className={`tab-button${wizardArmsMode === mode.id ? " active" : ""}`}
                            onClick={() => setWizardArmsMode(mode.id as "letters" | "names" | "custom")}
                          >
                            {mode.label}
                          </button>
                        ))}
                      </div>
                      <input
                        placeholder="Arms list (comma separated)"
                        value={wizardArmsText}
                        onChange={(event) => setWizardArmsText(event.target.value)}
                      />
                      {wizardArmsMode === "custom" && (
                        <input
                          placeholder="Pattern e.g., {year} {arm}"
                          value={wizardArmsPattern}
                          onChange={(event) => setWizardArmsPattern(event.target.value)}
                        />
                      )}
                      {academicIncludeSecondary && (
                        <label className="line-item">
                          <span>Enable senior secondary streams</span>
                          <input
                            type="checkbox"
                            checked={wizardStreamsEnabled}
                            onChange={(event) => setWizardStreamsEnabled(event.target.checked)}
                          />
                        </label>
                      )}
                      {wizardStreamsEnabled && (
                        <input
                          placeholder="Streams list (comma separated)"
                          value={wizardStreamsText}
                          onChange={(event) => setWizardStreamsText(event.target.value)}
                        />
                      )}
                    </div>
                  )}
                </div>
                <div className="wizard-card">
                  <strong>Preview</strong>
                  <div className="list">
                    {wizardGroupPreview.map((group) => (
                      <div key={group.label} className="line-item">
                        <div>
                          <strong>{group.label}</strong>
                          <small>
                            {group.years.length
                              ? group.years.slice(0, 3).join(", ") +
                                (group.years.length > 3 ? ` +${group.years.length - 3}` : "")
                              : "No years added."}
                          </small>
                        </div>
                        <span className="badge">{group.years.length}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="wizard-actions">
                <div className="wizard-actions-left">
                  <button className="ghost-button" type="button" onClick={() => setAcademicWizardStep(2)}>
                    Back
                  </button>
                </div>
                <div className="wizard-actions-right">
                  <button className="button" type="button" onClick={() => setAcademicWizardStep(4)}>
                    Save & Continue
                  </button>
                </div>
              </div>
            </div>
          )}

          {academicWizardStep === 4 && (
            <div className="wizard-card">
              <div className="wizard-card-header">
                <div>
                  <strong>Subjects & grading</strong>
                  <p className="muted">Keep it light for your pilot school. You can edit later.</p>
                </div>
              </div>
              <label className="line-item">
                <span>Set up subjects later (recommended)</span>
                <input
                  type="checkbox"
                  checked={wizardSubjectsLater}
                  onChange={(event) => setWizardSubjectsLater(event.target.checked)}
                />
              </label>
              {!wizardSubjectsLater && (
                <>
                  {academicIncludePrimary && (
                    <div className="panel panel-muted">
                      <label className="line-item">
                        <span>Use common primary subjects</span>
                        <input
                          type="checkbox"
                          checked={wizardPrimaryDefaultSubjects}
                          onChange={(event) => setWizardPrimaryDefaultSubjects(event.target.checked)}
                        />
                      </label>
                      {!wizardPrimaryDefaultSubjects && (
                        <textarea
                          rows={4}
                          value={wizardPrimarySubjectsText}
                          onChange={(event) => setWizardPrimarySubjectsText(event.target.value)}
                        />
                      )}
                    </div>
                  )}
                  {academicIncludeSecondary && (
                    <div className="panel panel-muted">
                      <label className="line-item">
                        <span>Use common secondary subjects</span>
                        <input
                          type="checkbox"
                          checked={wizardSecondaryDefaultSubjects}
                          onChange={(event) => setWizardSecondaryDefaultSubjects(event.target.checked)}
                        />
                      </label>
                      {!wizardSecondaryDefaultSubjects && (
                        <textarea
                          rows={4}
                          value={wizardSecondarySubjectsText}
                          onChange={(event) => setWizardSecondarySubjectsText(event.target.value)}
                        />
                      )}
                      {wizardStreamsEnabled && (
                        <p className="muted">
                          Stream-specific subjects can be refined later under Academics.
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
              <label className="line-item">
                <span>Assessment preset</span>
                <select
                  value={wizardAssessmentPreset}
                  onChange={(event) => setWizardAssessmentPreset(event.target.value)}
                >
                  <option value="40/60">CA 40 / Exam 60</option>
                  <option value="30/70">CA 30 / Exam 70</option>
                </select>
              </label>
              <div className="wizard-actions">
                <div className="wizard-actions-left">
                  <button className="ghost-button" type="button" onClick={() => setAcademicWizardStep(3)}>
                    Back
                  </button>
                </div>
                <div className="wizard-actions-right">
                  <button className="button" type="button" onClick={() => setAcademicWizardStep(5)}>
                    Save & Continue
                  </button>
                </div>
              </div>
            </div>
          )}

          {academicWizardStep === 5 && (
            <div className="wizard-card">
              <div className="wizard-card-header">
                <div>
                  <strong>Review & create</strong>
                  <p className="muted">Confirm the summary, then create your academic structure.</p>
                </div>
              </div>
              <div className="wizard-summary-grid">
                <div className="wizard-summary-item">
                  <strong>Session</strong>
                  <small>{wizardSessionName}</small>
                  <span className="badge">{wizardTermCount} terms</span>
                </div>
                <div className="wizard-summary-item">
                  <strong>Levels</strong>
                  <small>
                    {academicIncludeNursery ? "Nursery, " : ""}
                    {academicIncludePrimary ? academicPrimaryLabel : ""}
                    {academicIncludeSecondary ? `, ${academicSecondaryLabel}` : ""}
                  </small>
                </div>
                <div className="wizard-summary-item">
                  <strong>Class years</strong>
                  <small>
                    {[...wizardNurseryYears, ...wizardPrimaryYears, ...wizardSecondaryYears]
                      .filter(Boolean)
                      .slice(0, 6)
                      .join(", ")}
                    {wizardNurseryYears.length + wizardPrimaryYears.length + wizardSecondaryYears.length > 6
                      ? " + more"
                      : ""}
                  </small>
                  <button className="ghost-button" type="button" onClick={() => setAcademicWizardStep(3)}>
                    Edit
                  </button>
                </div>
                <div className="wizard-summary-item">
                  <strong>Arms</strong>
                  <small>{wizardArmsEnabled ? wizardArmsText : "None"}</small>
                </div>
                <div className="wizard-summary-item">
                  <strong>Streams</strong>
                  <small>{wizardStreamsEnabled ? wizardStreamsText : "Off"}</small>
                </div>
                <div className="wizard-summary-item">
                  <strong>Subjects</strong>
                  <small>{wizardSubjectsLater ? "Set up later" : "Configured"}</small>
                  <button className="ghost-button" type="button" onClick={() => setAcademicWizardStep(4)}>
                    Edit
                  </button>
                </div>
              </div>
              <div className="panel panel-muted">
                <strong>Class groups preview</strong>
                <div className="preview-list">
                  {wizardGroupPreview.flatMap((group) =>
                    group.years.flatMap((year) =>
                      getWizardGroupPreview(year)
                        .slice(0, 3)
                        .map((name) => (
                          <div key={`${group.label}-${year}-${name}`} className="preview-row">
                            <span>{year}</span>
                            <span>{name}</span>
                          </div>
                        ))
                    )
                  )}
                </div>
              </div>
              <div className="wizard-actions">
                <div className="wizard-actions-left">
                  <button className="ghost-button" type="button" onClick={() => setAcademicWizardStep(4)}>
                    Back
                  </button>
                </div>
                <div className="wizard-actions-right">
                  <button className="button" type="button" onClick={runAcademicWizard} disabled={saving}>
                    {saving ? "Creating..." : "Create academic structure"}
                  </button>
                </div>
              </div>
              {academicWizardCompleted && (
                <div className="inline-success" style={{ marginTop: 12 }}>
                  Academic setup complete. Next: import students and set up fees.
                </div>
              )}
            </div>
          )}

          <div className="line-item" style={{ marginTop: 12 }}>
            <div>
              <strong>Need manual control?</strong>
              <small>Open the advanced editor for sessions, terms, and class groups.</small>
            </div>
            <button
              className="ghost-button"
              type="button"
              onClick={() => setAcademicManualOpen((prev) => !prev)}
            >
              {academicManualOpen ? "Hide advanced editor" : "Open advanced editor"}
            </button>
          </div>
          {academicManualOpen && (
            <p className="muted" style={{ marginTop: 8 }}>
              Tip: Use the Advanced editor below to add levels, class years, and class groups in order.
            </p>
          )}
        </div>

          <div
            className="card"
            style={{
              display: academicManualOpen && isSectionVisible("setup-academic") ? undefined : "none"
            }}
          >
            <h3>
              Terms <span className="badge">{termsReady ? "Ready" : "Pending"}</span>
            </h3>
            <p className="muted">Attach terms to the selected session.</p>
            <div className="form-grid">
              {!sessionsReady && <p className="muted">Create a session before adding terms.</p>}
              <button className="button" type="button" onClick={createDefaultTerms} disabled={saving || !termSessionId}>
                Create default terms
              </button>
              <select value={termSessionId} onChange={(e) => setTermSessionId(e.target.value)}>
                <option value="">Select session</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <input placeholder="Term name" value={termName} onChange={(e) => setTermName(e.target.value)} />
              <input type="date" value={termStart} onChange={(e) => setTermStart(e.target.value)} />
              <input type="date" value={termEnd} onChange={(e) => setTermEnd(e.target.value)} />
              <input placeholder="Status" value={termStatus} onChange={(e) => setTermStatus(e.target.value)} />
              <button
                className="button"
                onClick={createTerm}
                disabled={saving || !schoolId || !termSessionId || !sessionsReady}
              >
                Create term
              </button>
            </div>
            <div className="list">
              {terms.map((item) => (
                <div key={item.id} className="line-item">
                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.startDate} - {item.endDate}</small>
                  </div>
                  <div className="line-item-actions">
                    <span className="badge">{item.status}</span>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => toggleTermStatus(item)}
                      disabled={saving}
                    >
                      {item.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => deleteTermEntry(item.id)}
                      disabled={saving}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="card"
            style={{
              display: academicManualOpen && isSectionVisible("setup-academic") ? undefined : "none"
            }}
          >
            <h3>
              Levels <span className="badge">{levelsReady ? "Ready" : "Pending"}</span>
            </h3>
            <p className="muted">Primary/secondary levels help group class years.</p>
            <div className="form-grid">
              <button className="button" type="button" onClick={createDefaultLevels} disabled={saving || !schoolId}>
                Create default levels
              </button>
              <input placeholder="Level name" value={levelName} onChange={(e) => setLevelName(e.target.value)} />
              <input placeholder="Type" value={levelType} onChange={(e) => setLevelType(e.target.value)} />
              <input
                type="number"
                placeholder="Sort order"
                value={levelSort}
                onChange={(e) => setLevelSort(Number(e.target.value || 0))}
              />
              <button className="button" onClick={createLevel} disabled={saving || !schoolId}>
                Create level
              </button>
            </div>
            <div className="list">
              {levels.map((item) => (
                <div key={item.id} className="line-item">
                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.type}</small>
                  </div>
                  <span className="badge">#{item.sortOrder}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="card"
            style={{
              display: academicManualOpen && isSectionVisible("setup-academic") ? undefined : "none"
            }}
          >
          <h3>
            Class years <span className="badge">{classYearsReady ? "Ready" : "Pending"}</span>
          </h3>
          <p className="muted">Add class years like JSS 1, Primary 3, etc.</p>
          <div className="form-grid">
              {!levelsReady && <div className="inline-alert">No levels yet. Use the buttons below to generate.</div>}
              <div className="grid">
                <button className="button" type="button" onClick={handleGeneratePrimaryYears} disabled={saving}>
                  Generate Primary 1-6
                </button>
                <button className="button" type="button" onClick={handleGenerateSecondaryYears} disabled={saving}>
                  Generate JSS/SSS 1-3
                </button>
              </div>
              <div className="action-row">
                <button className="ghost-button" type="button" onClick={refreshLevels} disabled={saving}>
                  Refresh levels
                </button>
                <button className="ghost-button" type="button" onClick={createDefaultLevels} disabled={saving}>
                  Create levels only
                </button>
              </div>
              <select value={classYearLevelId} onChange={(e) => setClassYearLevelId(e.target.value)}>
                <option value="">Select level</option>
                {availableLevels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>
              <input placeholder="Class year name" value={classYearName} onChange={(e) => setClassYearName(e.target.value)} />
              <input
                type="number"
                placeholder="Sort order"
                value={classYearSort}
                onChange={(e) => setClassYearSort(Number(e.target.value || 0))}
              />
              <button
                className="button"
                onClick={createClassYear}
                disabled={saving || !schoolId || !classYearLevelId || !levelsReady}
              >
                Create class year
              </button>
            </div>
            <div className="list">
              {availableClassYears.map((item) => (
                <div key={item.id} className="line-item">
                  <div>
                    <strong>{item.name}</strong>
                    <small>Level: {availableLevels.find((level) => level.id === item.levelId)?.name || "Level"}</small>
                  </div>
                  <span className="badge">#{item.sortOrder}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="card"
            style={{
              display: academicManualOpen && isSectionVisible("setup-academic") ? undefined : "none"
            }}
          >
            <h3>
              Class arms <span className="badge">{classArmsReady ? "Ready" : "Optional"}</span>
            </h3>
            <p className="muted">Optional arms like A, B, C.</p>
            <div className="form-grid">
              <button className="button" type="button" onClick={createDefaultClassArms} disabled={saving || !schoolId}>
                Create default arms (A/B/C)
              </button>
              <input placeholder="Class arm name" value={classArmName} onChange={(e) => setClassArmName(e.target.value)} />
              <button className="button" onClick={createClassArm} disabled={saving || !schoolId}>
                Create class arm
              </button>
            </div>
            <div className="list">
              {classArms.map((item) => (
                <div key={item.id} className="line-item">
                  <strong>{item.name}</strong>
                </div>
              ))}
            </div>
          </div>

          <div
            className="card"
            style={{
              display: academicManualOpen && isSectionVisible("setup-academic") ? undefined : "none"
            }}
          >
            <h3>
              Class groups <span className="badge">{classGroupsReady ? "Ready" : "Pending"}</span>
            </h3>
            <p className="muted">Combine class years and arms into actual groups.</p>
            <div className="form-grid">
              {!classYearsReady && <p className="muted">Create class years before adding class groups.</p>}
              <button
                className="button"
                type="button"
                onClick={createDefaultClassGroups}
                disabled={saving || !schoolId || !classYearsReady}
              >
                Generate class groups
              </button>
              <select value={classGroupYearId} onChange={(e) => setClassGroupYearId(e.target.value)}>
                <option value="">Select class year</option>
                {availableClassYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name}
                  </option>
                ))}
              </select>
              <select value={classGroupArmId} onChange={(e) => setClassGroupArmId(e.target.value)}>
                <option value="">Select arm (optional)</option>
                {classArms.map((arm) => (
                  <option key={arm.id} value={arm.id}>
                    {arm.name}
                  </option>
                ))}
              </select>
              <input
                placeholder="Display name"
                value={classGroupDisplayName}
                onChange={(e) => setClassGroupDisplayName(e.target.value)}
              />
              <button
                className="button"
                onClick={createClassGroup}
                disabled={saving || !schoolId || !classGroupYearId || !classYearsReady}
              >
                Create class group
              </button>
            </div>
            <div className="list">
              {availableClassGroups.map((item) => (
                <div key={item.id} className="line-item">
                  <div>
                    <strong>{item.displayName}</strong>
                    <small>
                      {availableClassYears.find((year) => year.id === item.classYearId)?.name || "Class year"}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        <div
          className="card fade-up delay-3 no-motion"
          id="setup-import"
          style={{ display: isSectionVisible("setup-import") ? undefined : "none" }}
        >
          <h3>
            Students and Parents Import <span className="badge">{importReady ? "Ready" : "Pending"}</span>
          </h3>
          <p className="muted">
            Upload a CSV with student details, class group names, and parent contact. We will validate and link parents
            automatically.
          </p>
          <div className="wizard-note">
            Required: admissionNo, firstName, lastName, parentPhone, and classGroup (or classYear + classArm).
          </div>
          {renderChecklist("setup-import", "Import requirements")}
          <div className="wizard-stack">
            <div className="wizard-card">
              <div className="wizard-card-header">
                <div>
                  <strong>Import steps</strong>
                  <p className="muted">Follow the flow to upload, map, and review.</p>
                </div>
              </div>
              <div className="wizard-substeps">
                {[
                  { id: "upload", label: "Upload" },
                  { id: "map", label: "Map fields" },
                  { id: "review", label: "Review" },
                  { id: "results", label: "Results" }
                ].map((step, index) => (
                  <a
                    key={step.id}
                    className={`substep ${importStep === step.id ? "active" : ""} ${
                      index < importStepIndex ? "completed" : ""
                    }`}
                    href={importStepRoutes[step.id]}
                    onClick={() => setImportStep(step.id)}
                  >
                    {step.label}
                  </a>
                ))}
              </div>
              <div className="substep-meta">
                <span>
                  Step {importStepIndex + 1} of {importStepOrder.length}
                </span>
                <div className="mini-progress">
                  <span style={{ width: `${((importStepIndex + 1) / importStepOrder.length) * 100}%` }} />
                </div>
              </div>
            </div>
            {isImportSubStepVisible("upload") && (
              <div className="wizard-card">
                <div className="wizard-card-header">
                  <div>
                    <strong>Upload CSV</strong>
                    <p className="muted">Use the template to avoid validation errors.</p>
                  </div>
                </div>
                <div className="form-grid">
                  {!importStructureReady && (
                    <p className="muted">Create sessions, terms, and class years before importing students.</p>
                  )}
                  <div className="file-drop">
                    <input type="file" accept=".csv" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
                    <div>
                      <strong>Drop CSV here or click to upload</strong>
                      <small>Use the template to avoid validation errors.</small>
                      <small>Supported format: CSV (UTF-8).</small>
                      <small>Tip: Use names like "Primary 1A", "1st Term", "2025/2026" and keep phones as text.</small>
                    </div>
                  </div>
                  <label className="line-item">
                    <div>
                      <strong>First row contains headers</strong>
                      <small>Recommended for CSV templates.</small>
                    </div>
                    <input
                      type="checkbox"
                      checked={importHasHeaders}
                      onChange={(event) => setImportHasHeaders(event.target.checked)}
                    />
                  </label>
                  <div className="import-upload-status">
                    {!importFileOk && <p className="muted">Please select a CSV file.</p>}
                    {importPreviewLoading && <p className="muted">Analyzing CSV preview...</p>}
                  </div>
                  <div className="grid">
                    <button className="button" onClick={uploadImport} disabled={uploading}>
                      Upload & validate
                    </button>
                    <button className="button secondary" type="button" onClick={downloadCsvTemplate}>
                      Download template
                    </button>
                    <button className="ghost-button" type="button" onClick={downloadCsvSample}>
                      Download sample CSV
                    </button>
                  </div>
                  {importUploadDisabledReason && <small className="muted">{importUploadDisabledReason}</small>}
                </div>
              </div>
            )}

          {isImportSubStepVisible("map") && (
            <div className="wizard-card">
                <div className="wizard-card-header">
                  <div>
                    <strong>Map fields</strong>
                    <p className="muted">Match your CSV columns to the standard student import fields.</p>
                  </div>
                </div>
              <div className="form-grid">
                {missingImportMappings.length > 0 && (
                  <div className="inline-alert">
                    Map required fields: {missingImportMappings.join(", ")}.
                  </div>
                )}
                {mappingsReady && <div className="inline-success">All required fields mapped.</div>}
                <div className="list">
                  {importFieldDefinitions
                    .filter((field) => !field.advanced)
                    .map((field) => (
                      <label key={field.key} className="line-item">
                        <span className="field-label">
                          {field.label}
                          {field.required && <span className="required-pill">Required</span>}
                        </span>
                        <select
                          className={field.required && !importFieldMap[field.key] ? "select-error" : undefined}
                          value={importFieldMap[field.key] || ""}
                          onChange={(event) =>
                            setImportFieldMap((prev) => ({
                              ...prev,
                              [field.key]: event.target.value
                            }))
                          }
                        >
                          <option value="">Select column</option>
                          {(importHeaders.length ? importHeaders : csvHeaderList).map((col) => (
                            <option key={`${field.key}-${col}`} value={col}>
                              {col}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                </div>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => setShowAdvancedImportFields((prev) => !prev)}
                >
                  {showAdvancedImportFields ? "Hide advanced ID mapping" : "Show advanced ID mapping"}
                </button>
                {showAdvancedImportFields && (
                  <div className="list">
                    {importFieldDefinitions
                      .filter((field) => field.advanced)
                      .map((field) => (
                        <label key={field.key} className="line-item">
                          <span className="field-label">{field.label}</span>
                          <select
                            value={importFieldMap[field.key] || ""}
                            onChange={(event) =>
                              setImportFieldMap((prev) => ({
                                ...prev,
                                [field.key]: event.target.value
                              }))
                            }
                          >
                            <option value="">Select column</option>
                            {(importHeaders.length ? importHeaders : csvHeaderList).map((col) => (
                              <option key={`${field.key}-${col}`} value={col}>
                                {col}
                              </option>
                            ))}
                          </select>
                        </label>
                      ))}
                  </div>
                )}
                <div className="grid">
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => setImportFieldMap(buildImportFieldMap(importHeaders.length ? importHeaders : csvHeaderList))}
                  >
                    Reset mapping
                  </button>
                  <button
                    className="button"
                    type="button"
                    onClick={() => {
                      window.location.href = importStepRoutes.review;
                    }}
                    disabled={!mappingsReady}
                  >
                    Run validation
                  </button>
                </div>
                <small>CSV template headers: {csvTemplateHeaders}</small>
                <small>Sample row: {csvSampleRow}</small>
                <small>Use class group / year / arm names. IDs are only for advanced uploads.</small>
                <details className="list">
                  <summary className="line-item" style={{ cursor: "pointer" }}>
                    <div>
                      <strong>Reference IDs (advanced)</strong>
                      <small>Only needed if your CSV already uses IDs instead of names.</small>
                    </div>
                  </summary>
                  {sessions.map((item) => (
                    <div key={item.id} className="line-item">
                      <div>
                        <strong>Session</strong>
                        <small>
                          {item.name}  {item.id}
                        </small>
                      </div>
                    </div>
                  ))}
                  {terms.map((item) => (
                    <div key={item.id} className="line-item">
                      <div>
                        <strong>Term</strong>
                        <small>
                          {item.name}  {item.id}
                        </small>
                      </div>
                    </div>
                  ))}
                  {availableClassYears.map((item) => (
                    <div key={item.id} className="line-item">
                      <div>
                        <strong>Class year</strong>
                        <small>
                          {item.name}  {item.id}
                        </small>
                      </div>
                    </div>
                  ))}
                  {classArms.map((item) => (
                    <div key={item.id} className="line-item">
                      <div>
                        <strong>Class arm</strong>
                        <small>
                          {item.name}  {item.id}
                        </small>
                      </div>
                    </div>
                  ))}
                  {availableClassGroups.map((item) => (
                    <div key={item.id} className="line-item">
                      <div>
                        <strong>Class group</strong>
                        <small>
                          {item.displayName}  {item.id}
                        </small>
                      </div>
                    </div>
                  ))}
                </details>
              </div>
            </div>
          )}

          {isImportSubStepVisible("review") && (
            <div className="wizard-card">
              <div className="wizard-card-header">
                <div>
                  <strong>Review & fix</strong>
                  <p className="muted">Resolve errors before importing.</p>
                </div>
              </div>
              <div className="review-layout">
              <div className="list">
                {importPreviewSummary.total === 0 && <p className="muted">Upload a CSV to see the preview report.</p>}
                {importPreviewSummary.total > 0 && (
                  <>
                    <div className="tab-row">
                      <button
                        className={`tab-button${importReviewTab === "errors" ? " active" : ""}`}
                        type="button"
                        onClick={() => setImportReviewTab("errors")}
                      >
                        Errors & warnings
                        <span className="tab-count">{importPreviewSummary.errors}</span>
                      </button>
                      <button
                        className={`tab-button${importReviewTab === "preview" ? " active" : ""}`}
                        type="button"
                        onClick={() => setImportReviewTab("preview")}
                      >
                        Preview rows
                        <span className="tab-count">{importPreviewRows.length}</span>
                      </button>
                    </div>
                    <div className="line-item">
                      <div>
                        <strong>Preview summary</strong>
                        <small>Total rows: {importPreviewSummary.total}</small>
                        <small>Missing mappings: {importPreviewSummary.missingHeaders}</small>
                        <small>Row issues: {importPreviewSummary.errors}</small>
                        <small>Duplicate admission numbers: {importPreviewSummary.duplicateAdmissions}</small>
                        <small>Duplicate parent contacts (siblings): {importPreviewSummary.duplicateParentContacts}</small>
                      </div>
                    </div>
                    {importReviewTab === "errors" && importPreviewIssues.length > 0 && (
                      <div className="line-item">
                        <div>
                          <strong>Top issues</strong>
                          {importPreviewIssues.map((issue) => (
                            <small key={issue}>{issue}</small>
                          ))}
                        </div>
                      </div>
                    )}
                    {importReviewTab === "errors" && importPreviewDuplicates.length > 0 && (
                      <div className="line-item">
                        <div>
                          <strong>Duplicate admission numbers</strong>
                          <small>Fix duplicates before uploading to avoid rejects.</small>
                          <small>{importPreviewDuplicates.slice(0, 8).join(", ")}</small>
                        </div>
                        <button className="ghost-button" type="button" onClick={copyDuplicateAdmissionNos}>
                          Copy duplicates
                        </button>
                      </div>
                    )}
                    {importReviewTab === "preview" && importPreviewRows.length > 0 && (
                      <div className="table-wrap">
                        <table className="table">
                          <thead>
                            <tr>
                              {csvPreviewColumns.map((col) => (
                                <th key={col}>{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {importPreviewRows.map((row, index) => (
                              <tr key={`${row.admissionNo || "row"}-${index}`}>
                                {csvPreviewColumns.map((col) => (
                                  <td key={`${col}-${index}`}>{row[col] || "-"}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <label className="line-item">
                      <div>
                        <strong>Proceed with valid rows only</strong>
                        <small>
                          {importPreviewSummary.errors > 0
                            ? "Skip rows with errors and import what is clean."
                            : "No errors detected. You're ready to proceed."}
                        </small>
                      </div>
                      <input
                        type="checkbox"
                        checked={importProceedWithValidOnly}
                        onChange={(event) => setImportProceedWithValidOnly(event.target.checked)}
                        disabled={importPreviewSummary.errors === 0}
                      />
                    </label>
                  </>
                )}
                <div className="grid">
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => {
                      window.location.href = importStepRoutes.upload;
                    }}
                  >
                    Upload new file
                  </button>
                  <button
                    className="button"
                    type="button"
                    onClick={() => {
                      window.location.href = importStepRoutes.results;
                    }}
                  >
                    Continue to results
                  </button>
                </div>
              </div>
              <aside className="review-sidebar card">
                <h4>Validation rules</h4>
                <div className="list">
                  <div className="line-item">
                    <div>
                      <strong>Required fields</strong>
                      <small>Admission number, first name, last name, parent phone, class group.</small>
                    </div>
                  </div>
                  <div className="line-item">
                    <div>
                      <strong>Parent contact</strong>
                      <small>Parent phone is required; email is optional.</small>
                    </div>
                  </div>
                  <div className="line-item">
                    <div>
                      <strong>Duplicates</strong>
                      <small>Admission numbers must be unique in the file.</small>
                    </div>
                  </div>
                  <div className="line-item">
                    <div>
                      <strong>Class placement</strong>
                      <small>Provide class group name, or class year + arm.</small>
                    </div>
                  </div>
                </div>
                <div className="panel-divider" />
                <small className="muted">
                  Tip: Fix errors first, then re-upload the corrected CSV to keep imports clean.
                </small>
              </aside>
              </div>
            </div>
          )}

          {isImportSubStepVisible("results") && (
            <div className="wizard-card">
              <div className="wizard-card-header">
                <div>
                  <strong>Import results</strong>
                  <p className="muted">Track jobs, download errors, and re-upload if needed.</p>
                </div>
              </div>
              <div className="form-grid">
                <div className="grid">
                  <button className="button" onClick={loadImportJobs} disabled={loading || !schoolId}>
                    Load import jobs
                  </button>
                  <a className="button" href="/admin/students">
                    View students list
                  </a>
                  <a className="button" href="/admin/parents">
                    View parents list
                  </a>
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => latestErrorJob && downloadErrorReport(latestErrorJob)}
                    disabled={!latestErrorJob || downloadingJobId === latestErrorJob.id}
                  >
                    {downloadingJobId === latestErrorJob?.id ? "Preparing..." : "Download latest errors"}
                  </button>
                </div>
                {latestImportJob && (
                  <div className="line-item">
                    <div>
                      <strong>Latest import</strong>
                      <small>
                        {latestImportJob.createdAt
                          ? new Date(latestImportJob.createdAt).toLocaleString()
                          : "n/a"}{" "}
                        {latestImportJob.status}
                      </small>
                      <small>
                        Processed: {latestImportJob.processedLines ?? 0}  Errors: {latestImportJob.errors ?? 0}
                      </small>
                      <small>
                        Created: {latestImportJob.created ?? 0}  Updated: {latestImportJob.updated ?? 0}  Skipped:{" "}
                        {latestImportJob.skipped ?? 0}
                      </small>
                    </div>
                  </div>
                )}
                {latestImportJob && (latestImportJob.errors ?? 0) > 0 && (
                  <div className="list">
                    <div className="line-item">
                      <div>
                        <strong>Resolve import errors</strong>
                        <small>Download the error report, fix the CSV, and re-upload.</small>
                      </div>
                      {latestImportJob.errorReportKey && (
                        <button
                          className="ghost-button"
                          type="button"
                          onClick={() => downloadErrorReport(latestImportJob)}
                          disabled={downloadingJobId === latestImportJob.id}
                        >
                          {downloadingJobId === latestImportJob.id ? "Preparing..." : "Download error report"}
                        </button>
                      )}
                    </div>
                    <label className="line-item">
                      <div>
                        <strong>Errors resolved</strong>
                        <small>Mark after you re-upload the corrected file.</small>
                      </div>
                      <input
                        type="checkbox"
                        checked={Boolean(importErrorAcknowledged[latestImportJob.id])}
                        onChange={() => toggleImportAcknowledged(latestImportJob.id)}
                      />
                    </label>
                  </div>
                )}
                <div className="grid">
                  <button className="button" type="button" onClick={copyCsvHeaders}>
                    Copy headers
                  </button>
                  <button className="button secondary" type="button" onClick={downloadCsvTemplate}>
                    Download template
                  </button>
                </div>
              </div>
              <div className="list" style={{ marginTop: 16 }}>
                {importJobs.length === 0 && <div className="empty-state">No import jobs loaded.</div>}
                {importJobs.map((job) => (
                  <div key={job.id} className="line-item">
                    <div>
                      <strong>{job.status}</strong>
                      <small>
                        Created: {job.createdAt ? new Date(job.createdAt).toLocaleString() : "n/a"}
                      </small>
                        <small>
                          Processed: {job.processedLines ?? 0} rows, errors: {job.errors ?? 0}
                        </small>
                        <small>
                          Created: {job.created ?? 0}  Updated: {job.updated ?? 0}  Skipped: {job.skipped ?? 0}
                        </small>
                      </div>
                    {job.errorReportKey && (
                      <button
                        className="button"
                        type="button"
                        onClick={() => downloadErrorReport(job)}
                        disabled={downloadingJobId === job.id}
                      >
                        {downloadingJobId === job.id ? "Preparing..." : "Download errors"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>

        <div
          className="card fade-up delay-3"
          id="setup-staff"
          style={{ display: isSectionVisible("setup-staff") ? undefined : "none" }}
        >
          <h3>
            Staff & roles <span className="badge">{staffInvitesReady ? "Ready" : "Pending"}</span>
          </h3>
          <p className="muted">
            Add the key people who will use the system: School Admin, Bursar, Teachers.
          </p>
          <div className="wizard-note">
            Bursar is important for fees and payments. Teachers can be added now or later.
          </div>
          {renderChecklist("setup-staff", "Invite requirements")}
          <div className="wizard-stack">
            <div className="wizard-card">
              <div className="wizard-card-header">
                <div>
                  <strong>Invite and assign staff</strong>
                  <p className="muted">Add bursars and teachers so they can start working.</p>
                </div>
              </div>
          <div className="wizard-two-col">
            <div className="wizard-column">
              <div className="panel">
                <h4>Key roles</h4>
                <div className="list">
                  <div className="line-item">
                    <div>
                      <strong>School admin</strong>
                      <small>Current account</small>
                    </div>
                    <span className="badge">Active</span>
                  </div>
                </div>
                <div className="panel-divider" />
                <div className="form-grid">
                  <strong>Invite bursar</strong>
                  <input
                    placeholder="Bursar full name"
                    value={bursarName}
                    onChange={(event) => setBursarName(event.target.value)}
                  />
                  <input
                    placeholder="Bursar email (optional)"
                    value={bursarEmail}
                    onChange={(event) => setBursarEmail(event.target.value)}
                  />
                  <input
                    placeholder="Bursar phone (optional)"
                    value={bursarPhone}
                    onChange={(event) => setBursarPhone(event.target.value)}
                  />
                  {(!bursarEmailOk || !bursarPhoneOk) && (
                    <p className="muted">Check bursar email/phone formats.</p>
                  )}
                  <button
                    className="button"
                    onClick={async () => {
                      await inviteStaff({
                        name: bursarName,
                        email: bursarEmail,
                        phone: bursarPhone,
                        roleLabel: "Bursar"
                      });
                      setBursarName("");
                      setBursarEmail("");
                      setBursarPhone("");
                    }}
                    disabled={saving || !schoolId || !canInviteBursar}
                  >
                    Invite bursar
                  </button>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h4>Teachers</h4>
                    <p className="muted">Invite teachers and assign classes later.</p>
                  </div>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => setTeacherFormOpen((prev) => !prev)}
                  >
                    {teacherFormOpen ? "Hide form" : "Add teacher"}
                  </button>
                </div>
                {teacherFormOpen && (
                  <div className="form-grid">
                    <input
                      placeholder="Teacher full name"
                      value={teacherName}
                      onChange={(event) => setTeacherName(event.target.value)}
                    />
                    <input
                      placeholder="Teacher email (optional)"
                      value={teacherEmail}
                      onChange={(event) => setTeacherEmail(event.target.value)}
                    />
                    <input
                      placeholder="Teacher phone (optional)"
                      value={teacherPhone}
                      onChange={(event) => setTeacherPhone(event.target.value)}
                    />
                    {(!teacherEmailOk || !teacherPhoneOk) && (
                      <p className="muted">Check teacher email/phone formats.</p>
                    )}
                    <div className="panel panel-muted">
                      <strong>Assign class groups</strong>
                      {availableClassGroups.length === 0 && (
                        <div className="empty-state">Create class groups before assigning teachers.</div>
                      )}
                      {availableClassGroups.length > 0 && (
                        <div className="list">
                          {availableClassGroups.map((group) => (
                            <label key={group.id} className="line-item">
                              <div>
                                <strong>{group.displayName}</strong>
                                <small>
                                  {availableClassYears.find((year) => year.id === group.classYearId)?.name ||
                                    "Class year"}
                                </small>
                              </div>
                              <input
                                type="checkbox"
                                checked={teacherClassGroupIds.includes(group.id)}
                                onChange={() =>
                                  setTeacherClassGroupIds((prev) =>
                                    prev.includes(group.id)
                                      ? prev.filter((id) => id !== group.id)
                                      : [...prev, group.id]
                                  )
                                }
                              />
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="panel panel-muted">
                      <strong>Subjects (optional)</strong>
                      <input
                        placeholder="e.g., English, Mathematics, Basic Science"
                        value={teacherSubjects}
                        onChange={(event) => setTeacherSubjects(event.target.value)}
                      />
                      <small className="muted">We will link subjects once the catalog is configured.</small>
                    </div>
                    <small className="muted">
                      Selected: {teacherClassGroupIds.length} class group
                      {teacherClassGroupIds.length === 1 ? "" : "s"} · {getSubjectCount(teacherSubjects)} subject
                      {getSubjectCount(teacherSubjects) === 1 ? "" : "s"}
                    </small>
                    <button
                      className="button"
                      onClick={async () => {
                        const inviteKey = teacherEmail || teacherPhone || teacherName;
                        const subjectList = teacherSubjects
                          .split(",")
                          .map((subject) => subject.trim())
                          .filter(Boolean);
                        await inviteStaff({
                          name: teacherName,
                          email: teacherEmail,
                          phone: teacherPhone,
                          roleLabel: "Teacher"
                        });
                        saveTeacherAssignment(inviteKey, teacherClassGroupIds, subjectList);
                        setTeacherName("");
                        setTeacherEmail("");
                        setTeacherPhone("");
                        setTeacherClassGroupIds([]);
                        setTeacherSubjects("");
                      }}
                      disabled={saving || !schoolId || !canInviteTeacher}
                    >
                      Invite teacher
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="wizard-column">
              <div className="panel">
                <h4>Permission preview</h4>
                <div className="list">
                  <div className="line-item">
                    <div>
                      <strong>Bursar can</strong>
                      <small>Manage fees, approve payments, and issue receipts.</small>
                    </div>
                  </div>
                  <div className="line-item">
                    <div>
                      <strong>Teachers can</strong>
                      <small>Mark attendance, enter scores, and view class lists.</small>
                    </div>
                  </div>
                  <div className="line-item">
                    <div>
                      <strong>Admins can</strong>
                      <small>Configure setup, manage staff, and publish results.</small>
                    </div>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h4>Invited staff</h4>
                    <p className="muted">Track invite status and resend if needed.</p>
                  </div>
                  <button className="button secondary" onClick={loadStaff} disabled={loadingStaff || !schoolId}>
                    {loadingStaff ? "Loading..." : "Refresh list"}
                  </button>
                </div>
                <div className="list">
                  {staffList.length === 0 && <div className="empty-state">No staff invited yet.</div>}
                  {staffList.map((user) => (
                    <div key={user.id} className="line-item">
                      <div>
                        <strong>{user.name}</strong>
                        <small>{getRoleLabel(user)}</small>
                        <small>{user.email || user.phone || "Contact missing"}</small>
                        {getRoleLabel(user) === "Teacher" && getTeacherAssignment(user) && (
                          <small>{getTeacherAssignmentSummary(user)}</small>
                        )}
                        {inviteStatusMap[getInviteKey(user)] && (
                          <small>
                            Invite sent via {inviteStatusMap[getInviteKey(user)].channel} on{" "}
                            {new Date(inviteStatusMap[getInviteKey(user)].sentAt).toLocaleString()}
                          </small>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span className="badge">
                          {inviteStatusMap[getInviteKey(user)] ? "SENT" : user.status || "INVITED"}
                        </span>
                        {user.email && (
                          <a
                            className="ghost-button"
                            href={getStaffInviteMailto(user)}
                            onClick={() => markInviteSent(user, "EMAIL")}
                          >
                            Send email
                          </a>
                        )}
                        {user.phone && (
                          <a
                            className="ghost-button"
                            href={getStaffInviteSms(user)}
                            onClick={() => markInviteSent(user, "SMS")}
                          >
                            Send SMS
                          </a>
                        )}
                        <button className="ghost-button" type="button" onClick={() => copyStaffInviteMessage(user)}>
                          Copy invite
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {staffStatusNote && <p className="muted">{staffStatusNote}</p>}
          <p className="muted">
            Invites create user records only. Role permissions are applied after the user joins.
          </p>
            </div>
          </div>
        </div>

        <div
          className="card fade-up delay-3"
          id="setup-checklist"
          style={{ display: isSectionVisible("setup-checklist") ? undefined : "none" }}
        >
          <h3>Go-live checklist</h3>
          <p className="muted">Mark these once your pilot school is ready.</p>
          <div className="wizard-note">
            This is your final readiness check before sending invoices to parents.
          </div>
          {renderChecklist("setup-checklist", "Go-live requirements")}
          <div className="wizard-stack">
            <div className="wizard-card">
              <div className="wizard-card-header">
                <div>
                  <strong>Readiness checks</strong>
                  <p className="muted">Tick off each item before go-live.</p>
                </div>
              </div>
              <div className="list">
                <div className="line-item">
                  <div>
                    <strong>Academic structure created</strong>
                    <small>Sessions: {sessions.length}, Classes: {classGroups.length}</small>
                  </div>
                  <span className="badge">{sessions.length && classGroups.length ? "Ready" : "Pending"}</span>
                </div>
                <div className="line-item">
                  <div>
                    <strong>Student import completed</strong>
                    <small>Import jobs: {importJobs.length}</small>
                  </div>
                  <span className="badge">{importJobs.length ? "Ready" : "Pending"}</span>
                </div>
                <div className="line-item">
                  <div>
                    <strong>Staff invites sent</strong>
                    <small>Mark done after inviting staff.</small>
                  </div>
                  <label className="inline">
                    <input
                      type="checkbox"
                      checked={checkInvites}
                      onChange={(event) => setCheckInvites(event.target.checked)}
                    />{" "}
                    Done
                  </label>
                </div>
                <div className="line-item">
                  <div>
                    <strong>Fees configured</strong>
                    <small>Mark done after fee items/schedules are set.</small>
                  </div>
                  <label className="inline">
                    <input
                      type="checkbox"
                      checked={checkFees}
                      onChange={(event) => setCheckFees(event.target.checked)}
                    />{" "}
                    Done
                  </label>
                </div>
                <div className="line-item">
                  <div>
                    <strong>First invoices generated</strong>
                    <small>Mark done after invoices are issued.</small>
                  </div>
                  <label className="inline">
                    <input
                      type="checkbox"
                      checked={checkFirstInvoice}
                      onChange={(event) => setCheckFirstInvoice(event.target.checked)}
                    />{" "}
                    Done
                  </label>
                </div>
              </div>
              {isStepView && initialSectionId === "setup-checklist" && (
                <div className="list" style={{ marginTop: 16 }}>
                  <div className="line-item">
                    <div>
                      <strong>Completion summary</strong>
                      <small>Structure: {structureReady ? "Ready" : "Pending"}</small>
                      <small>Branding: {brandingReady ? "Ready" : "Pending"}</small>
                      <small>Fees: {feesReady ? "Ready" : "Pending"}</small>
                      <small>Payments: {paymentsSaved ? "Ready" : "Pending"}</small>
                      <small>Communications: {commsSaved ? "Ready" : "Pending"}</small>
                    </div>
                    <span className="badge">{goLiveReady ? "Ready" : "Pending"}</span>
                  </div>
                  <div className="grid">
                    <button className="button" type="button" onClick={exportSetupSummary}>
                      Download setup summary
                    </button>
                    <button className="button" type="button" onClick={copyPilotSummary}>
                      Copy pilot summary
                    </button>
                    <button className="ghost-button" type="button" onClick={() => window.print()}>
                      Print checklist
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="wizard-actions">
          <div className="wizard-actions-left">
            {prevStepId && (
              <a className="ghost-button" href={prevStepHref}>
                Back
              </a>
            )}
          </div>
          <div className="wizard-actions-right">
            <button
              className="ghost-button"
              type="button"
              onClick={() => {
                void persistSetupState(buildSetupStatePayload()).then(() => {
                  setStatus("Draft saved.");
                  setStatusAt(new Date().toISOString());
                });
              }}
            >
              Save draft
            </button>
            {["setup-staff", "setup-import", "setup-payments", "setup-comms"].includes(
              initialSectionId || ""
            ) && (
              <button
                className="ghost-button"
                type="button"
                onClick={() => {
                  if (!initialSectionId || !nextStepHref) return;
                  const next = { ...skippedSteps, [initialSectionId]: true };
                  setSkippedSteps(next);
                  window.localStorage.setItem("cp.setup.skipped", JSON.stringify(next));
                  window.location.href = nextStepHref;
                }}
              >
                Skip step
              </button>
            )}
            <button
              className="button primary"
              type="button"
              onClick={() => {
                if (!canGoNext) return;
                if (initialSectionId === "setup-branding") {
                  saveBranding();
                  return;
                }
                if (initialSectionId === "setup-payments") {
                  savePayments();
                  return;
                }
                if (initialSectionId === "setup-comms") {
                  saveCommunications();
                  return;
                }
                if (nextStepHref) {
                  window.location.href = nextStepHref;
                }
              }}
              disabled={!canGoNext}
            >
              Save and continue
            </button>
          </div>
        </div>
      </section>
    </div>
    </main>
  );
}

export default function SetupPage() {
  return <SetupWizard />;
}




