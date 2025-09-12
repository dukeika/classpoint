// File: src/components/candidate/InterviewTab.tsx
import { useState, useEffect } from "react";
import { useCandidateData } from "@/hooks/useCandidateDataReal";
import { useInterviewData } from "@/hooks/useInterviewData";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Phone,
  Users,
  FileText,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Download,
  MessageSquare,
  User,
} from "lucide-react";
import { CandidateApplication } from "./types";
import { Interview, Interviewer, PreparationMaterial } from "./interview-types";

interface InterviewTabProps {
  applicationId?: string;
}

export default function InterviewTab({ applicationId }: InterviewTabProps) {
  const { applications } = useCandidateData();
  const {
    interviews,
    getInterviewForApplication,
    joinInterview,
    confirmAttendance,
    requestReschedule,
    submitFeedback,
  } = useInterviewData();

  const [selectedApplication, setSelectedApplication] =
    useState<CandidateApplication | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");

  // Auto-select application if applicationId is provided
  useEffect(() => {
    if (applicationId) {
      const app = applications.find((a) => a.id === applicationId);
      if (app && app.currentStage === 4) {
        setSelectedApplication(app);
      }
    }
  }, [applicationId, applications]);

  // Filter applications at interview stage
  const interviewApplications = applications.filter(
    (app) => app.currentStage === 4
  );

  const upcomingInterviews = interviewApplications.filter(
    (app) => app.stages.interview.status === "scheduled"
  );

  const completedInterviews = interviewApplications.filter(
    (app) => app.stages.interview.status === "completed"
  );

  const handleJoinInterview = (applicationId: string) => {
    const interview = getInterviewForApplication(applicationId);
    if (interview) {
      joinInterview(interview.id);
    }
  };

  const handleConfirmAttendance = (applicationId: string) => {
    confirmAttendance(applicationId);
  };

  const handleRequestReschedule = (applicationId: string, reason: string) => {
    requestReschedule(applicationId, reason);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const getTimeUntilInterview = (dateString: string) => {
    const now = new Date();
    const interviewDate = new Date(dateString);
    const diffMs = interviewDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays !== 1 ? "s" : ""} away`;
    if (diffHours > 0)
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} away`;
    if (diffMs > 0) return "Starting soon";
    return "Interview time";
  };

  // Interview Details Component
  const InterviewDetails = ({
    application,
  }: {
    application: CandidateApplication;
  }) => {
    const interview = getInterviewForApplication(application.id);
    if (!interview) return null;

    const { date, time } = formatDateTime(interview.scheduledAt);
    const timeUntil = getTimeUntilInterview(interview.scheduledAt);
    const isUpcoming = new Date(interview.scheduledAt) > new Date();

    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {application.jobTitle}
            </h2>
            <p className="text-lg text-gray-600">{application.company}</p>
            <p className="text-sm text-gray-500">Final Interview</p>
          </div>
          <div className="text-right">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                isUpcoming
                  ? "bg-blue-100 text-blue-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {isUpcoming ? timeUntil : "Completed"}
            </span>
          </div>
        </div>

        {/* Interview Schedule */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{date}</p>
                <p className="text-sm text-gray-500">Interview Date</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{time}</p>
                <p className="text-sm text-gray-500">
                  Duration: {interview.duration} minutes
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {interview.type === "video" ? (
                <Video className="w-5 h-5 text-gray-400" />
              ) : interview.type === "phone" ? (
                <Phone className="w-5 h-5 text-gray-400" />
              ) : (
                <MapPin className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium text-gray-900 capitalize">
                  {interview.type} Interview
                </p>
                <p className="text-sm text-gray-500">{interview.location}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {interview.interviewers.map(
              (interviewer: Interviewer, index: number) => (
                <div key={index} className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {interviewer.name}
                    </p>
                    <p className="text-sm text-gray-500">{interviewer.title}</p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Interview Instructions */}
        {interview.instructions && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">
              Interview Instructions
            </h3>
            <p className="text-blue-800 text-sm">{interview.instructions}</p>
          </div>
        )}

        {/* Preparation Materials */}
        {interview.preparationMaterials &&
          interview.preparationMaterials.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">
                Preparation Materials
              </h3>
              <div className="space-y-2">
                {interview.preparationMaterials.map(
                  (material: PreparationMaterial, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {material.title}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          {isUpcoming ? (
            <>
              {interview.type === "video" && (
                <Button
                  onClick={() => handleJoinInterview(application.id)}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={
                    new Date(interview.scheduledAt).getTime() -
                      new Date().getTime() >
                    15 * 60 * 1000
                  }
                >
                  <Video className="w-4 h-4 mr-2" />
                  {new Date(interview.scheduledAt).getTime() -
                    new Date().getTime() >
                  15 * 60 * 1000
                    ? "Join 15 min before"
                    : "Join Interview"}
                </Button>
              )}

              <Button
                onClick={() => handleConfirmAttendance(application.id)}
                variant="outline"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm Attendance
              </Button>

              <Button
                onClick={() => setShowFeedbackForm(true)}
                variant="outline"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Request Reschedule
              </Button>
            </>
          ) : (
            <Button onClick={() => setShowFeedbackForm(true)} variant="outline">
              <MessageSquare className="w-4 h-4 mr-2" />
              Interview Feedback
            </Button>
          )}
        </div>

        {/* Feedback Form Modal */}
        {showFeedbackForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {isUpcoming ? "Request Reschedule" : "Interview Feedback"}
              </h3>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder={
                  isUpcoming
                    ? "Please provide a reason for rescheduling..."
                    : "How was your interview experience?"
                }
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="flex justify-end space-x-3 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowFeedbackForm(false);
                    setFeedbackText("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (isUpcoming) {
                      handleRequestReschedule(application.id, feedbackText);
                    } else {
                      submitFeedback(application.id, feedbackText);
                    }
                    setShowFeedbackForm(false);
                    setFeedbackText("");
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Submit
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Main render
  if (selectedApplication) {
    return <InterviewDetails application={selectedApplication} />;
  }

  return (
    <div className="space-y-6">
      {/* Upcoming Interviews */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Upcoming Interviews
        </h2>

        {upcomingInterviews.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Upcoming Interviews
            </h3>
            <p className="text-gray-500">
              Your scheduled interviews will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingInterviews.map((application) => {
              const interview = getInterviewForApplication(application.id);
              if (!interview) return null;

              const { date, time } = formatDateTime(interview.scheduledAt);
              const timeUntil = getTimeUntilInterview(interview.scheduledAt);

              return (
                <div
                  key={application.id}
                  className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors cursor-pointer"
                  onClick={() => setSelectedApplication(application)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {application.jobTitle}
                      </h3>
                      <p className="text-gray-600">{application.company}</p>

                      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{date}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{time}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {interview.type === "video" ? (
                            <Video className="w-4 h-4 text-gray-400" />
                          ) : interview.type === "phone" ? (
                            <Phone className="w-4 h-4 text-gray-400" />
                          ) : (
                            <MapPin className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="capitalize">{interview.type}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>
                            {interview.interviewers.length} interviewer(s)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                        {timeUntil}
                      </span>
                      <div className="mt-2">
                        <Button size="sm">View Details</Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Interviews */}
      {completedInterviews.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Interview History
          </h3>
          <div className="space-y-3">
            {completedInterviews.map((application) => {
              const interview = getInterviewForApplication(application.id);
              if (!interview) return null;

              const { date, time } = formatDateTime(interview.scheduledAt);

              return (
                <div
                  key={application.id}
                  className="flex justify-between items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300"
                  onClick={() => setSelectedApplication(application)}
                >
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {application.jobTitle}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {application.company}
                    </p>
                    <p className="text-sm text-gray-500">
                      Completed on {date} at {time}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Completed
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {interview.feedback
                        ? "Feedback submitted"
                        : "Awaiting results"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
