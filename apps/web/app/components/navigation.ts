export type NavItem = {
  label: string;
  href: string;
  icon: string;
  roles: string[];
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const adminNav: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: "DB", roles: ["APP_ADMIN", "SCHOOL_ADMIN"] },
      { label: "Setup Wizard", href: "/admin/setup", icon: "SU", roles: ["APP_ADMIN", "SCHOOL_ADMIN"] }
    ]
  },
  {
    title: "People",
    items: [
      { label: "Students", href: "/admin/students", icon: "ST", roles: ["APP_ADMIN", "SCHOOL_ADMIN", "BURSAR"] },
      { label: "Parents", href: "/admin/parents", icon: "PR", roles: ["APP_ADMIN", "SCHOOL_ADMIN", "BURSAR"] },
      { label: "Staff", href: "/admin/staff", icon: "SF", roles: ["APP_ADMIN", "SCHOOL_ADMIN"] },
      { label: "Roles", href: "/admin/roles", icon: "RL", roles: ["APP_ADMIN", "SCHOOL_ADMIN"] }
    ]
  },
  {
    title: "Academics",
    items: [
      { label: "Structure", href: "/admin/academics", icon: "AC", roles: ["APP_ADMIN", "SCHOOL_ADMIN"] },
      { label: "Attendance", href: "/admin/attendance", icon: "AT", roles: ["APP_ADMIN", "SCHOOL_ADMIN", "TEACHER"] },
      { label: "Results", href: "/admin/results", icon: "RS", roles: ["APP_ADMIN", "SCHOOL_ADMIN"] }
    ]
  },
  {
    title: "Finance",
    items: [
      { label: "Fees", href: "/admin/fees", icon: "FE", roles: ["APP_ADMIN", "SCHOOL_ADMIN", "BURSAR"] },
      { label: "Invoices", href: "/admin/invoices", icon: "IN", roles: ["APP_ADMIN", "SCHOOL_ADMIN", "BURSAR"] },
      { label: "Collections", href: "/admin/collections", icon: "CO", roles: ["APP_ADMIN", "SCHOOL_ADMIN", "BURSAR"] }
    ]
  },
  {
    title: "Communication",
    items: [
      { label: "Branding", href: "/admin/branding", icon: "BR", roles: ["APP_ADMIN", "SCHOOL_ADMIN"] },
      { label: "Announcements", href: "/admin/comms/announcements", icon: "AN", roles: ["APP_ADMIN", "SCHOOL_ADMIN"] },
      { label: "Support Queue", href: "/admin/support", icon: "SQ", roles: ["APP_ADMIN", "SCHOOL_ADMIN", "BURSAR"] }
    ]
  },
  {
    title: "Settings",
    items: [
      { label: "School Profile", href: "/admin/settings", icon: "SP", roles: ["APP_ADMIN", "SCHOOL_ADMIN"] },
      { label: "Providers", href: "/admin/settings/providers", icon: "PV", roles: ["APP_ADMIN", "SCHOOL_ADMIN"] },
      { label: "Plan Catalog", href: "/admin/settings/catalog", icon: "PL", roles: ["APP_ADMIN"] },
      { label: "Audit Logs", href: "/admin/settings/audit", icon: "AU", roles: ["APP_ADMIN", "SCHOOL_ADMIN"] }
    ]
  }
];

export const teacherNav: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/teacher", icon: "DB", roles: ["TEACHER", "SCHOOL_ADMIN"] },
      { label: "My Classes", href: "/teacher/classes", icon: "CL", roles: ["TEACHER", "SCHOOL_ADMIN"] }
    ]
  },
  {
    title: "Attendance",
    items: [
      { label: "Take Attendance", href: "/teacher/attendance", icon: "TA", roles: ["TEACHER", "SCHOOL_ADMIN"] },
      { label: "History", href: "/teacher/attendance/history", icon: "HI", roles: ["TEACHER", "SCHOOL_ADMIN"] }
    ]
  },
  {
    title: "Assessments",
    items: [
      { label: "Assessments", href: "/teacher/assessments", icon: "AS", roles: ["TEACHER", "SCHOOL_ADMIN"] },
      { label: "Score Entry", href: "/teacher/assessments/score-entry", icon: "SE", roles: ["TEACHER", "SCHOOL_ADMIN"] }
    ]
  },
  {
    title: "Communication",
    items: [
      { label: "Announcements", href: "/teacher/comms/announcements", icon: "AN", roles: ["TEACHER", "SCHOOL_ADMIN"] }
    ]
  }
];

export const portalNav: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/portal", icon: "DB", roles: ["PARENT", "STUDENT"] },
      { label: "Children", href: "/portal/children", icon: "CH", roles: ["PARENT", "STUDENT"] }
    ]
  },
  {
    title: "Fees",
    items: [
      { label: "Invoices", href: "/portal/children/fees", icon: "IN", roles: ["PARENT", "STUDENT"] },
      { label: "Receipts", href: "/portal/children/fees/receipts", icon: "RC", roles: ["PARENT", "STUDENT"] }
    ]
  },
  {
    title: "Updates",
    items: [
      { label: "Announcements", href: "/portal/announcements", icon: "AN", roles: ["PARENT", "STUDENT"] },
      { label: "Calendar", href: "/portal/calendar", icon: "CA", roles: ["PARENT", "STUDENT"] },
      { label: "Messages", href: "/portal/messages", icon: "MS", roles: ["PARENT", "STUDENT"] },
      { label: "Support", href: "/portal/support", icon: "SP", roles: ["PARENT", "STUDENT"] }
    ]
  }
];

export const globalNav: NavSection[] = [
  ...adminNav,
  ...teacherNav,
  ...portalNav,
  {
    title: "Account",
    items: [
      { label: "Notifications", href: "/notifications", icon: "NT", roles: ["APP_ADMIN", "SCHOOL_ADMIN", "BURSAR", "TEACHER", "PARENT", "STUDENT"] },
      { label: "Profile", href: "/profile", icon: "PF", roles: ["APP_ADMIN", "SCHOOL_ADMIN", "BURSAR", "TEACHER", "PARENT", "STUDENT"] },
      { label: "Help", href: "/help", icon: "HP", roles: ["APP_ADMIN", "SCHOOL_ADMIN", "BURSAR", "TEACHER", "PARENT", "STUDENT"] }
    ]
  }
];
