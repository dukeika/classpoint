// File: src/hooks/useCandidateData.ts
import { useState, useEffect } from "react";
import {
  Job,
  CandidateApplication,
  CandidateStats,
} from "@/components/candidate/types";

// Mock data for candidate portal
const mockJobs: Job[] = [
  {
    id: "1",
    title: "Senior Frontend Developer",
    company: "TechCorp Inc.",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    salary: "$80,000 - $120,000",
    description:
      "We are looking for a skilled Frontend Developer to join our dynamic team and help build the next generation of web applications using React, TypeScript, and modern development practices.",
    requirements: [
      "5+ years of React experience",
      "TypeScript proficiency",
      "Modern CSS frameworks (Tailwind, Styled Components)",
      "API integration experience",
      "Git version control",
      "Agile development experience",
    ],
    responsibilities: [
      "Develop user interfaces using React and TypeScript",
      "Collaborate with design team to implement pixel-perfect designs",
      "Optimize applications for maximum speed and scalability",
      "Mentor junior developers and conduct code reviews",
      "Participate in architecture decisions",
      "Write comprehensive tests for all features",
    ],
    benefits: [
      "Health insurance",
      "Remote work",
      "401k matching",
      "Professional development budget",
      "Flexible PTO",
    ],
    status: "active",
    createdAt: "2024-08-15",
    closingDate: "2024-09-15",
    companyLogo: "https://via.placeholder.com/40x40",
  },
  {
    id: "2",
    title: "Product Manager",
    company: "InnovateLabs",
    department: "Product",
    location: "San Francisco, CA",
    type: "Full-time",
    salary: "$100,000 - $140,000",
    description:
      "Join our product team to drive innovation and user experience across our platform. Lead cross-functional teams to deliver exceptional products that delight our customers.",
    requirements: [
      "3+ years product management experience",
      "Strong analytical and data-driven decision making skills",
      "Experience with agile methodologies (Scrum, Kanban)",
      "Excellent communication and leadership skills",
      "Experience with product analytics tools",
      "Technical background preferred",
    ],
    responsibilities: [
      "Define product roadmap and strategy",
      "Work with engineering and design teams to deliver features",
      "Conduct user research and analyze customer feedback",
      "Manage product launches and go-to-market strategies",
      "Collaborate with stakeholders across the organization",
      "Track and analyze product metrics and KPIs",
    ],
    benefits: [
      "Comprehensive health coverage",
      "Stock options",
      "Learning stipend",
      "Commuter benefits",
    ],
    status: "active",
    createdAt: "2024-08-10",
    closingDate: "2024-09-10",
  },
  {
    id: "3",
    title: "UX Designer",
    company: "DesignStudio",
    department: "Design",
    location: "New York, NY",
    type: "Full-time",
    salary: "$70,000 - $95,000",
    description:
      "Create exceptional user experiences for our digital products and help shape the future of design. Work with a talented team to solve complex design challenges.",
    requirements: [
      "Portfolio showcasing UX design work and process",
      "Proficiency in design tools (Figma, Sketch, Adobe Creative Suite)",
      "User research and usability testing experience",
      "Understanding of design systems and accessibility",
      "Strong communication and presentation skills",
      "Experience with prototyping tools",
    ],
    responsibilities: [
      "Create wireframes, prototypes, and high-fidelity designs",
      "Conduct user research and usability testing",
      "Collaborate with product and engineering teams",
      "Design and maintain design systems",
      "Present design solutions to stakeholders",
      "Stay up-to-date with design trends and best practices",
    ],
    benefits: [
      "Health and dental insurance",
      "Creative workspace",
      "Design conference budget",
      "Flexible schedule",
    ],
    status: "active",
    createdAt: "2024-08-12",
    closingDate: "2024-09-20",
  },
  {
    id: "4",
    title: "Full Stack Developer",
    company: "StartupCo",
    department: "Engineering",
    location: "Austin, TX",
    type: "Full-time",
    salary: "$75,000 - $105,000",
    description:
      "Join our fast-growing startup as a Full Stack Developer. Work on cutting-edge technology and help build products that will impact thousands of users.",
    requirements: [
      "Experience with React and Node.js",
      "Database design and optimization (PostgreSQL, MongoDB)",
      "RESTful API design and development",
      "Cloud platform experience (AWS, GCP, or Azure)",
      "Understanding of DevOps practices",
      "Startup mindset and adaptability",
    ],
    responsibilities: [
      "Develop both frontend and backend features",
      "Design and implement database schemas",
      "Build and maintain APIs",
      "Deploy and monitor applications",
      "Collaborate in a fast-paced startup environment",
      "Contribute to technical architecture decisions",
    ],
    benefits: [
      "Equity package",
      "Health insurance",
      "Unlimited PTO",
      "Latest tech equipment",
    ],
    status: "active",
    createdAt: "2024-08-08",
    closingDate: "2024-09-08",
  },
];

// FIXED: Applications with proper video test stage
const mockApplications: CandidateApplication[] = [
  {
    id: "app1",
    jobId: "1",
    jobTitle: "Senior Frontend Developer",
    company: "TechCorp Inc.",
    appliedAt: "2024-08-18",
    currentStage: 2,
    stageStatus: "pending",
    overallStatus: "active",
    stages: {
      application: { status: "completed", completedAt: "2024-08-18" },
      written_test: { status: "pending" },
      video_test: { status: "not_started" },
      interview: { status: "not_started" },
    },
    nextAction: "Complete written assessment by Aug 25th",
  },
  {
    id: "app2",
    jobId: "2",
    jobTitle: "Product Manager",
    company: "InnovateLabs",
    appliedAt: "2024-08-16",
    currentStage: 3,
    stageStatus: "pending",
    overallStatus: "active",
    stages: {
      application: { status: "completed", completedAt: "2024-08-16" },
      written_test: {
        status: "completed",
        completedAt: "2024-08-19",
        score: 85,
      },
      video_test: { status: "pending" },
      interview: { status: "not_started" },
    },
    nextAction: "Record video responses by Aug 23rd",
  },
  {
    id: "app3",
    jobId: "3",
    jobTitle: "UX Designer",
    company: "DesignStudio",
    appliedAt: "2024-08-14",
    currentStage: 4,
    stageStatus: "pending",
    overallStatus: "active",
    stages: {
      application: { status: "completed", completedAt: "2024-08-14" },
      written_test: {
        status: "completed",
        completedAt: "2024-08-17",
        score: 92,
      },
      video_test: { status: "completed", completedAt: "2024-08-20", score: 88 },
      interview: { status: "scheduled", scheduledAt: "2024-08-25T10:00:00Z" },
    },
    nextAction: "Attend final interview on Aug 25th at 10:00 AM",
  },
  // NEW: Additional application ready for video test
  {
    id: "app4",
    jobId: "4",
    jobTitle: "Full Stack Developer",
    company: "StartupCo",
    appliedAt: "2024-08-12",
    currentStage: 3,
    stageStatus: "pending",
    overallStatus: "active",
    stages: {
      application: { status: "completed", completedAt: "2024-08-12" },
      written_test: {
        status: "completed",
        completedAt: "2024-08-15",
        score: 78,
      },
      video_test: { status: "pending" },
      interview: { status: "not_started" },
    },
    nextAction: "Complete video interview by Aug 24th",
  },
];

export function useCandidateData() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [stats, setStats] = useState<CandidateStats>({
    totalApplications: 0,
    activeApplications: 0,
    completedApplications: 0,
    interviewsScheduled: 0,
    availableJobs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const loadData = async () => {
      setLoading(true);

      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      setJobs(mockJobs);
      setApplications(mockApplications);

      // DEBUG: Log the applications and filter results
      console.log("🎯 CANDIDATE DATA LOADED");
      console.log("📊 Total applications:", mockApplications.length);

      const writtenTestApps = mockApplications.filter(
        (app) =>
          app.currentStage === 2 && app.stages.written_test.status === "pending"
      );
      console.log("📝 Written test applications (Stage 2):", writtenTestApps);

      const videoTestApps = mockApplications.filter(
        (app) =>
          app.currentStage === 3 && app.stages.video_test.status === "pending"
      );
      console.log("🎥 Video test applications (Stage 3):", videoTestApps);

      const interviewApps = mockApplications.filter(
        (app) =>
          app.currentStage === 4 && app.stages.interview.status === "scheduled"
      );
      console.log("💼 Interview applications (Stage 4):", interviewApps);

      // Calculate stats
      const activeApps = mockApplications.filter(
        (app) => app.overallStatus === "active"
      ).length;
      const scheduledInterviews = mockApplications.filter(
        (app) => app.stages.interview.status === "scheduled"
      ).length;

      setStats({
        totalApplications: mockApplications.length,
        activeApplications: activeApps,
        completedApplications: mockApplications.length - activeApps,
        interviewsScheduled: scheduledInterviews,
        availableJobs: mockJobs.filter((job) => job.status === "active").length,
      });

      console.log("📈 Final stats:", {
        total: mockApplications.length,
        active: activeApps,
        writtenTests: writtenTestApps.length,
        videoTests: videoTestApps.length,
        interviews: scheduledInterviews,
        availableJobs: mockJobs.filter((job) => job.status === "active").length,
      });

      setLoading(false);
    };

    loadData();
  }, []);

  const applyToJob = async (jobId: string) => {
    // Mock application submission
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    const newApplication: CandidateApplication = {
      id: `app${Date.now()}`,
      jobId,
      jobTitle: job.title,
      company: job.company,
      appliedAt: new Date().toISOString().split("T")[0],
      currentStage: 1,
      stageStatus: "completed",
      overallStatus: "active",
      stages: {
        application: {
          status: "completed",
          completedAt: new Date().toISOString().split("T")[0],
        },
        written_test: { status: "not_started" },
        video_test: { status: "not_started" },
        interview: { status: "not_started" },
      },
      nextAction: "Wait for written test invitation",
    };

    const updatedApplications = [newApplication, ...applications];
    setApplications(updatedApplications);

    // Update stats
    setStats((prev) => ({
      ...prev,
      totalApplications: prev.totalApplications + 1,
      activeApplications: prev.activeApplications + 1,
    }));

    console.log("✅ Applied to job:", job.title);
    console.log("📋 New application created:", newApplication);
  };

  const hasApplied = (jobId: string) => {
    const applied = applications.some((app) => app.jobId === jobId);
    return applied;
  };

  return {
    jobs,
    applications,
    stats,
    loading,
    applyToJob,
    hasApplied,
  };
}
