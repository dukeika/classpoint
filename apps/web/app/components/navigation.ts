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
      { label: "Dashboard", href: "/admin", icon: "D", roles: ["APP_ADMIN", "SCHOOL_ADMIN"] },
      { label: "Setup Wizard", href: "/admin/setup", icon: "W", roles: ["APP_ADMIN", "SCHOOL_ADMIN"] }
    ]
  },
  {
    title: "People",
    items: [
      { label: "Students", href: "/admin/students", icon: "S", roles: ["APP_ADMIN", "SCHOOL_ADMIN", "BURSAR"] },
      { label: "Parents", href: "/admin/parents", icon: "P", roles: ["APP_ADMIN", "SCHOOL_ADMIN", "BURSAR"] },
      { label: "Staff", href: "/admin/staff", icon: "T", roles: ["APP_ADMIN", "SCHOOL_ADMIN"] },
      { label: "Roles", href: "/admin/roles", icon: "R", roles: ["APP_ADMIN", "SCHOOL_ADMIN"] }
    ]
  },
  {
    title: "Academics",
    items: [
      { label: "Structure", href: "/admin/academics", icon: "A", roles: ["APP_ADMIN", "SCHOOL_ADMIN"] },
      { label: "Attendance", href: "/admin/attendance", icon: "N", roles: ["APP_ADMIN", "SCHOOL_ADMIN", "TEACHER"] },
      { label: "Results", href: "/admin/results", icon: "K", roles: ["APP_ADMIN", "SCHOOL_ADMIN"] }
    ]
  },
  {
    title: "Finance",
    items: [
      { label: "Fees", href: "/admin/fees", icon: "F", roles: ["APP_ADMIN", "SCHOOL_ADMIN", "BURSAR"] },
      { label: "Invoices", href: "/admin/invoices", icon: "I", roles: ["APP_ADMIN", "SCHOOL_ADMIN", "BURSAR"] },
      { label: "Collections", href: "/admin/collections", icon: "C", roles: ["APP_ADMIN", "SCHOOL_ADMIN", "BURSAR"] }
    ]
  },
  {
    title: "Communication",
    items: [
      { label: "Branding", href: "/admin/branding", icon: "B", roles: ["APP_ADMIN", "SCHOOL_ADMIN"] },
      { label: "Announcements", href: "/admin/comms/announcements", icon: "M", roles: ["APP_ADMIN", "SCHOOL_ADMIN"] },
      { label: "Support Queue", href: "/admin/support", icon: "Q", roles: ["APP_ADMIN", "SCHOOL_ADMIN", "BURSAR"] }
    ]
  },
  {
    title: "Settings",
    items: [
      { label: "School Profile", href: "/admin/settings", icon: "G", roles: ["APP_ADMIN", "SCHOOL_ADMIN"] },
      { label: "Providers", href: "/admin/settings/providers", icon: "V", roles: ["APP_ADMIN", "SCHOOL_ADMIN"] },
      { label: "Plan Catalog", href: "/admin/settings/catalog", icon: "K", roles: ["APP_ADMIN"] },
      { label: "Audit Logs", href: "/admin/settings/audit", icon: "L", roles: ["APP_ADMIN", "SCHOOL_ADMIN"] }
    ]
  }
];

export const teacherNav: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/teacher", icon: "D", roles: ["TEACHER", "SCHOOL_ADMIN"] },
      { label: "My Classes", href: "/teacher/classes", icon: "C", roles: ["TEACHER", "SCHOOL_ADMIN"] }
    ]
  },
  {
    title: "Attendance",
    items: [
      { label: "Take Attendance", href: "/teacher/attendance", icon: "A", roles: ["TEACHER", "SCHOOL_ADMIN"] },
      { label: "History", href: "/teacher/attendance/history", icon: "H", roles: ["TEACHER", "SCHOOL_ADMIN"] }
    ]
  },
  {
    title: "Assessments",
    items: [
      { label: "Assessments", href: "/teacher/assessments", icon: "S", roles: ["TEACHER", "SCHOOL_ADMIN"] },
      { label: "Score Entry", href: "/teacher/assessments/score-entry", icon: "E", roles: ["TEACHER", "SCHOOL_ADMIN"] }
    ]
  },
  {
    title: "Communication",
    items: [
      { label: "Announcements", href: "/teacher/comms/announcements", icon: "N", roles: ["TEACHER", "SCHOOL_ADMIN"] }
    ]
  }
];

export const portalNav: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/portal", icon: "D", roles: ["PARENT", "STUDENT"] },
      { label: "Children", href: "/portal/children", icon: "C", roles: ["PARENT", "STUDENT"] }
    ]
  },
  {
    title: "Fees",
    items: [
      { label: "Invoices", href: "/portal/children/fees", icon: "I", roles: ["PARENT", "STUDENT"] },
      { label: "Receipts", href: "/portal/children/fees/receipts", icon: "R", roles: ["PARENT", "STUDENT"] }
    ]
  },
  {
    title: "Updates",
    items: [
      { label: "Announcements", href: "/portal/announcements", icon: "A", roles: ["PARENT", "STUDENT"] },
      { label: "Calendar", href: "/portal/calendar", icon: "K", roles: ["PARENT", "STUDENT"] },
      { label: "Messages", href: "/portal/messages", icon: "M", roles: ["PARENT", "STUDENT"] },
      { label: "Support", href: "/portal/support", icon: "S", roles: ["PARENT", "STUDENT"] }
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
      { label: "Notifications", href: "/notifications", icon: "N", roles: ["APP_ADMIN", "SCHOOL_ADMIN", "BURSAR", "TEACHER", "PARENT", "STUDENT"] },
      { label: "Profile", href: "/profile", icon: "P", roles: ["APP_ADMIN", "SCHOOL_ADMIN", "BURSAR", "TEACHER", "PARENT", "STUDENT"] },
      { label: "Help", href: "/help", icon: "H", roles: ["APP_ADMIN", "SCHOOL_ADMIN", "BURSAR", "TEACHER", "PARENT", "STUDENT"] }
    ]
  }
];
