// File: src/hooks/useInterviewData.ts
import { useState, useEffect, useCallback } from "react";
import {
  Interview,
  InterviewSlot,
  InterviewFeedback,
  InterviewStats,
} from "@/components/candidate/interview-types";

// Mock interview data
const mockInterviews: Interview[] = [
  {
    id: "interview_1",
    applicationId: "app3", // UX Designer application
    jobTitle: "UX Designer",
    company: "DesignStudio",
    candidateId: "current_user",
    candidateName: "John Candidate",
    candidateEmail: "candidate@abhh.com",
    scheduledAt: "2024-08-25T10:00:00Z",
    duration: 60,
    type: "video",
    status: "scheduled",
    location: "Zoom Meeting",
    interviewers: [
      {
        id: "int_1",
        name: "Sarah Johnson",
        title: "Design Director",
        email: "sarah.johnson@designstudio.com",
      },
      {
        id: "int_2",
        name: "Mike Chen",
        title: "Senior UX Designer",
        email: "mike.chen@designstudio.com",
      },
    ],
    instructions:
      "Please join the meeting 5 minutes early. Have your portfolio ready to share screen. We'll discuss your design process and review 2-3 of your recent projects.",
    preparationMaterials: [
      {
        id: "prep_1",
        title: "Design Challenge Brief",
        type: "document",
        url: "/documents/design-challenge.pdf",
        description:
          "Review this design challenge we'll discuss during the interview",
      },
      {
        id: "prep_2",
        title: "Company Design Principles",
        type: "link",
        url: "https://designstudio.com/principles",
        description: "Familiarize yourself with our design approach",
      },
    ],
    meetingLink: "https://zoom.us/j/123456789",
    meetingId: "123 456 789",
    createdAt: "2024-08-20T09:00:00Z",
    updatedAt: "2024-08-20T09:00:00Z",
  },
  {
    id: "interview_2",
    applicationId: "app5", // Mock completed interview
    jobTitle: "Frontend Developer",
    company: "TechCorp Inc.",
    candidateId: "current_user",
    candidateName: "John Candidate",
    candidateEmail: "candidate@abhh.com",
    scheduledAt: "2024-08-15T14:00:00Z",
    duration: 45,
    type: "video",
    status: "completed",
    location: "Google Meet",
    interviewers: [
      {
        id: "int_3",
        name: "Alex Rodriguez",
        title: "Engineering Manager",
        email: "alex@techcorp.com",
      },
    ],
    instructions:
      "Technical interview focusing on React and TypeScript. Be prepared to share your screen for coding exercises.",
    meetingLink: "https://meet.google.com/abc-defg-hij",
    feedback:
      "Great experience! The interview was well-structured and the team was very welcoming.",
    rating: 5,
    createdAt: "2024-08-10T09:00:00Z",
    updatedAt: "2024-08-15T15:00:00Z",
  },
];

export function useInterviewData() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInterviews(mockInterviews);
    console.log("Interview data loaded:", mockInterviews.length, "interviews");
  }, []);

  const getInterviewForApplication = useCallback(
    (applicationId: string): Interview | null => {
      const interview = interviews.find(
        (interview) => interview.applicationId === applicationId
      );
      console.log(
        `Looking for interview for application ${applicationId}:`,
        interview ? "FOUND" : "NOT FOUND"
      );
      return interview || null;
    },
    [interviews]
  );

  const getUpcomingInterviews = useCallback(() => {
    const now = new Date();
    return interviews.filter(
      (interview) =>
        interview.status === "scheduled" &&
        new Date(interview.scheduledAt) > now
    );
  }, [interviews]);

  const getCompletedInterviews = useCallback(() => {
    return interviews.filter((interview) => interview.status === "completed");
  }, [interviews]);

  const joinInterview = useCallback(
    async (interviewId: string) => {
      const interview = interviews.find((i) => i.id === interviewId);
      if (!interview) {
        throw new Error("Interview not found");
      }

      console.log("Joining interview:", interviewId);

      // Update interview status to in-progress
      setInterviews((prev) =>
        prev.map((i) =>
          i.id === interviewId ? { ...i, status: "in-progress" as const } : i
        )
      );

      // In a real app, this would:
      // 1. Open the meeting link (Zoom, Teams, etc.)
      // 2. Send analytics event
      // 3. Update interview status in backend

      if (interview.meetingLink) {
        window.open(interview.meetingLink, "_blank");
      }

      return interview;
    },
    [interviews]
  );

  const confirmAttendance = useCallback(async (applicationId: string) => {
    console.log("Confirming attendance for application:", applicationId);

    // In real app, this would send confirmation to backend
    // For now, just show success message
    alert("Attendance confirmed! You'll receive a calendar invite shortly.");

    return true;
  }, []);

  const requestReschedule = useCallback(
    async (applicationId: string, reason: string) => {
      console.log(
        "Requesting reschedule for application:",
        applicationId,
        "Reason:",
        reason
      );

      setInterviews((prev) =>
        prev.map((interview) =>
          interview.applicationId === applicationId
            ? {
                ...interview,
                rescheduleReason: reason,
                rescheduleRequestedAt: new Date().toISOString(),
                rescheduleRequestedBy: "candidate" as const,
              }
            : interview
        )
      );

      // In real app, this would:
      // 1. Send reschedule request to backend
      // 2. Notify company admin
      // 3. Trigger email notifications

      alert(
        "Reschedule request submitted. The company will contact you with new options."
      );

      return true;
    },
    []
  );

  const submitFeedback = useCallback(
    async (applicationId: string, feedback: string, rating?: number) => {
      console.log("Submitting feedback for application:", applicationId);

      setInterviews((prev) =>
        prev.map((interview) =>
          interview.applicationId === applicationId
            ? {
                ...interview,
                feedback,
                rating: rating || interview.rating,
                updatedAt: new Date().toISOString(),
              }
            : interview
        )
      );

      // In real app, this would save feedback to backend
      alert("Thank you for your feedback!");

      return true;
    },
    []
  );

  // Company admin functions (for future use)
  const scheduleInterview = useCallback(
    async (
      applicationId: string,
      scheduledAt: string,
      interviewers: string[],
      type: "video" | "phone" | "in-person",
      duration: number = 60
    ) => {
      console.log("Scheduling interview for application:", applicationId);

      const newInterview: Interview = {
        id: `interview_${Date.now()}`,
        applicationId,
        jobTitle: "New Position", // Would be fetched from application
        company: "Company Name", // Would be fetched from application
        candidateId: "candidate_id", // Would be fetched from application
        candidateName: "Candidate Name", // Would be fetched from application
        candidateEmail: "candidate@example.com", // Would be fetched from application
        scheduledAt,
        duration,
        type,
        status: "scheduled",
        location:
          type === "video"
            ? "Video Call"
            : type === "phone"
            ? "Phone Call"
            : "Office",
        interviewers: [], // Would be populated with interviewer details
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setInterviews((prev) => [...prev, newInterview]);

      // In real app:
      // 1. Save to backend
      // 2. Send calendar invites
      // 3. Notify candidate
      // 4. Create meeting links

      return newInterview;
    },
    []
  );

  const cancelInterview = useCallback(
    async (interviewId: string, reason: string) => {
      console.log("Cancelling interview:", interviewId, "Reason:", reason);

      setInterviews((prev) =>
        prev.map((interview) =>
          interview.id === interviewId
            ? {
                ...interview,
                status: "cancelled" as const,
                notes: reason,
                updatedAt: new Date().toISOString(),
              }
            : interview
        )
      );

      // In real app:
      // 1. Update backend
      // 2. Cancel calendar events
      // 3. Notify all participants
      // 4. Update application status

      return true;
    },
    []
  );

  const rescheduleInterview = useCallback(
    async (interviewId: string, newScheduledAt: string, reason?: string) => {
      console.log(
        "Rescheduling interview:",
        interviewId,
        "New time:",
        newScheduledAt
      );

      setInterviews((prev) =>
        prev.map((interview) =>
          interview.id === interviewId
            ? {
                ...interview,
                scheduledAt: newScheduledAt,
                status: "scheduled" as const,
                rescheduleReason: reason,
                rescheduleRequestedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : interview
        )
      );

      // In real app:
      // 1. Update backend
      // 2. Send new calendar invites
      // 3. Notify all participants
      // 4. Generate new meeting links if needed

      return true;
    },
    []
  );

  const getInterviewStats = useCallback((): InterviewStats => {
    const total = interviews.length;
    const completed = interviews.filter((i) => i.status === "completed").length;
    const cancelled = interviews.filter((i) => i.status === "cancelled").length;
    const scheduled = interviews.filter((i) => i.status === "scheduled").length;

    const completedWithRating = interviews.filter(
      (i) => i.status === "completed" && i.rating
    );
    const averageRating =
      completedWithRating.length > 0
        ? completedWithRating.reduce((sum, i) => sum + (i.rating || 0), 0) /
          completedWithRating.length
        : 0;

    const averageDuration =
      completed > 0
        ? interviews
            .filter((i) => i.status === "completed")
            .reduce((sum, i) => sum + i.duration, 0) / completed
        : 0;

    return {
      totalScheduled: scheduled,
      completed,
      cancelled,
      averageRating,
      averageDuration,
      noShowRate: total > 0 ? (cancelled / total) * 100 : 0,
    };
  }, [interviews]);

  // Calendar integration functions (placeholder for future implementation)
  const generateCalendarEvent = useCallback((interview: Interview) => {
    // Would generate .ics file or calendar integration
    const event = {
      title: `Interview: ${interview.jobTitle} at ${interview.company}`,
      start: interview.scheduledAt,
      duration: interview.duration,
      location: interview.location,
      description: interview.instructions,
      attendees: interview.interviewers.map((i) => i.email),
    };

    console.log("Generated calendar event:", event);
    return event;
  }, []);

  const generateMeetingLink = useCallback(async (interview: Interview) => {
    // Would integrate with Zoom/Teams/Google Meet APIs
    if (interview.type === "video") {
      // Mock meeting link generation
      const mockMeetingLink = `https://zoom.us/j/${Math.random()
        .toString()
        .substr(2, 9)}`;

      setInterviews((prev) =>
        prev.map((i) =>
          i.id === interview.id
            ? {
                ...i,
                meetingLink: mockMeetingLink,
                meetingId: mockMeetingLink.split("/").pop(),
              }
            : i
        )
      );

      return mockMeetingLink;
    }

    return null;
  }, []);

  return {
    interviews,
    loading,

    // Candidate functions
    getInterviewForApplication,
    getUpcomingInterviews,
    getCompletedInterviews,
    joinInterview,
    confirmAttendance,
    requestReschedule,
    submitFeedback,

    // Company admin functions
    scheduleInterview,
    cancelInterview,
    rescheduleInterview,
    getInterviewStats,

    // Utility functions
    generateCalendarEvent,
    generateMeetingLink,
  };
}
