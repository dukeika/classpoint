// src/components/candidate/ApplicationsTab.tsx
import { CandidateApplication, TestStage } from "./types";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Play,
  FileText,
  Video,
  Users,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ApplicationsTabProps {
  applications: CandidateApplication[];
}

export default function ApplicationsTab({
  applications,
}: ApplicationsTabProps) {
  const getStageIcon = (stage: number) => {
    const icons = [FileText, FileText, Video, Users];
    const Icon = icons[stage - 1] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "in_progress":
        return "text-blue-600 bg-blue-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "failed":
        return "text-red-600 bg-red-100";
      case "scheduled":
        return "text-purple-600 bg-purple-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-blue-600 bg-blue-100";
      case "hired":
        return "text-green-600 bg-green-100";
      case "rejected":
        return "text-red-600 bg-red-100";
      case "withdrawn":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const stageNames = ["Application", "Written Test", "Video Test", "Interview"];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Applications
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {applications.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  applications.filter((app) => app.overallStatus === "active")
                    .length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Interviews</p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  applications.filter(
                    (app) => app.stages.interview.status === "scheduled"
                  ).length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  applications.filter((app) => app.overallStatus !== "active")
                    .length
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            My Applications
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {applications.map((application) => (
            <div key={application.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {application.jobTitle}
                  </h3>
                  <p className="text-gray-600">{application.company}</p>
                  <p className="text-sm text-gray-500">
                    Applied on {formatDate(application.appliedAt)}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getOverallStatusColor(
                      application.overallStatus
                    )}`}
                  >
                    {application.overallStatus.charAt(0).toUpperCase() +
                      application.overallStatus.slice(1)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>Stage {application.currentStage} of 4</span>
                  <span>
                    {Math.round((application.currentStage / 4) * 100)}% Complete
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-abhh-teal-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${(application.currentStage / 4) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Stages */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                {stageNames.map((stageName, index) => {
                  const stageNum = index + 1;
                  const stageKey = [
                    "application",
                    "written_test",
                    "video_test",
                    "interview",
                  ][index] as keyof typeof application.stages;
                  const stage = application.stages[stageKey];

                  return (
                    <div key={stageName} className="text-center">
                      <div
                        className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                          stageNum < application.currentStage
                            ? "bg-green-100 text-green-600"
                            : stageNum === application.currentStage
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {getStageIcon(stageNum)}
                      </div>
                      <p className="text-xs font-medium text-gray-900">
                        {stageName}
                      </p>
                      <p
                        className={`text-xs px-2 py-1 rounded-full mt-1 ${getStatusColor(
                          stage.status
                        )}`}
                      >
                        {stage.status.replace("_", " ")}
                      </p>
                      {stage.completedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(stage.completedAt)}
                        </p>
                      )}
                      {(stage as TestStage).score && (
                        <p className="text-xs text-green-600 font-medium mt-1">
                          Score: {(stage as TestStage).score}%
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Next Action */}
              {application.nextAction && (
                <div className="bg-abhh-yellow-50 border border-abhh-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-abhh-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-abhh-yellow-800">
                        Next Action Required
                      </p>
                      <p className="text-sm text-abhh-yellow-700">
                        {application.nextAction}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                {application.currentStage === 2 &&
                  application.stages.written_test.status === "pending" && (
                    <Button size="sm">
                      <Play className="w-4 h-4 mr-2" />
                      Start Written Test
                    </Button>
                  )}

                {application.currentStage === 3 &&
                  application.stages.video_test.status === "pending" && (
                    <Button size="sm">
                      <Video className="w-4 h-4 mr-2" />
                      Record Video
                    </Button>
                  )}

                {application.stages.interview.status === "scheduled" && (
                  <Button size="sm" variant="secondary">
                    <Calendar className="w-4 h-4 mr-2" />
                    Join Interview
                  </Button>
                )}

                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>

              {/* Feedback */}
              {application.feedback && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    Feedback
                  </p>
                  <p className="text-sm text-gray-600">
                    {application.feedback}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {applications.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Applications Yet
            </h3>
            <p className="text-gray-500 mb-4">
              Start browsing jobs and submit your first application!
            </p>
            <Button>Browse Jobs</Button>
          </div>
        )}
      </div>
    </div>
  );
}
