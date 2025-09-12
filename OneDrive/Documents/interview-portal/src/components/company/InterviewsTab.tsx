// File: src/components/company/InterviewsTab.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Plus,
  Video,
  Phone,
  MapPin,
  Users,
  Search,
  Filter,
  Eye,
  Edit,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  MessageSquare,
} from "lucide-react";
import {
  Interview,
  InterviewSlot,
} from "@/components/candidate/interview-types";
import { Application } from "./types";
import { useInterviewData } from "@/hooks/useInterviewData";

interface InterviewsTabProps {
  // Add props as needed
}

export default function InterviewsTab({}: InterviewsTabProps) {
  const {
    interviews,
    scheduleInterview,
    cancelInterview,
    rescheduleInterview,
    getInterviewStats,
    generateMeetingLink,
  } = useInterviewData();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(
    null
  );
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const stats = getInterviewStats();

  const filteredInterviews = interviews.filter(
    (interview) =>
      interview.candidateName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      interview.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: Interview["status"]) => {
    switch (status) {
      case "scheduled":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "in-progress":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: Interview["status"]) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  // Schedule Interview Modal Component
  const ScheduleInterviewModal = () => {
    const [formData, setFormData] = useState<{
      applicationId: string;
      candidateName: string;
      candidateEmail: string;
      jobTitle: string;
      scheduledAt: string;
      duration: number;
      type: "video" | "phone" | "in-person";
      interviewers: string[];
      instructions: string;
      location: string;
    }>({
      applicationId: "",
      candidateName: "",
      candidateEmail: "",
      jobTitle: "",
      scheduledAt: "",
      duration: 60,
      type: "video",
      interviewers: [],
      instructions: "",
      location: "",
    });

    const [availableInterviewers] = useState([
      {
        id: "int1",
        name: "Sarah Johnson",
        title: "Design Director",
        email: "sarah@company.com",
      },
      {
        id: "int2",
        name: "Mike Chen",
        title: "Senior Developer",
        email: "mike@company.com",
      },
      {
        id: "int3",
        name: "Alex Rodriguez",
        title: "Engineering Manager",
        email: "alex@company.com",
      },
      {
        id: "int4",
        name: "Lisa Park",
        title: "Product Manager",
        email: "lisa@company.com",
      },
    ]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await scheduleInterview(
          formData.applicationId,
          formData.scheduledAt,
          formData.interviewers,
          formData.type,
          formData.duration
        );
        setShowScheduleModal(false);
        // Reset form
        setFormData({
          applicationId: "",
          candidateName: "",
          candidateEmail: "",
          jobTitle: "",
          scheduledAt: "",
          duration: 60,
          type: "video",
          interviewers: [],
          instructions: "",
          location: "",
        });

        // Show success message
        alert("Interview scheduled successfully!");
      } catch (error) {
        console.error("Failed to schedule interview:", error);
        alert("Failed to schedule interview. Please try again.");
      }
    };

    const handleInterviewerToggle = (interviewerId: string) => {
      setFormData((prev) => ({
        ...prev,
        interviewers: prev.interviewers.includes(interviewerId)
          ? prev.interviewers.filter((id) => id !== interviewerId)
          : [...prev.interviewers, interviewerId],
      }));
    };

    // Auto-populate location based on type
    const handleTypeChange = (newType: "video" | "phone" | "in-person") => {
      let defaultLocation = "";
      switch (newType) {
        case "video":
          defaultLocation = "Video Call (Zoom link will be generated)";
          break;
        case "phone":
          defaultLocation = "Phone Call";
          break;
        case "in-person":
          defaultLocation = "Office Conference Room";
          break;
      }

      setFormData((prev) => ({
        ...prev,
        type: newType,
        location: defaultLocation,
      }));
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Schedule New Interview
            </h2>
            <Button
              variant="ghost"
              onClick={() => setShowScheduleModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Candidate Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Application ID *
                </label>
                <input
                  type="text"
                  value={formData.applicationId}
                  onChange={(e) =>
                    setFormData({ ...formData, applicationId: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter application ID"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={formData.jobTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, jobTitle: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Position title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Candidate Name *
                </label>
                <input
                  type="text"
                  value={formData.candidateName}
                  onChange={(e) =>
                    setFormData({ ...formData, candidateName: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Candidate Email *
                </label>
                <input
                  type="email"
                  value={formData.candidateEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, candidateEmail: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="candidate@email.com"
                  required
                />
              </div>
            </div>

            {/* Interview Schedule */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledAt: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration *
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: parseInt(e.target.value),
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
            </div>

            {/* Interview Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Interview Type *
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  {
                    value: "video",
                    label: "Video Call",
                    icon: Video,
                    description: "Zoom/Teams meeting",
                  },
                  {
                    value: "phone",
                    label: "Phone Call",
                    icon: Phone,
                    description: "Audio only",
                  },
                  {
                    value: "in-person",
                    label: "In Person",
                    icon: MapPin,
                    description: "Office meeting",
                  },
                ].map(({ value, label, icon: Icon, description }) => (
                  <label
                    key={value}
                    className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.type === value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={value}
                      checked={formData.type === value}
                      onChange={(e) => handleTypeChange(e.target.value as any)}
                      className="sr-only"
                    />
                    <Icon className="w-6 h-6 mb-2" />
                    <span className="font-medium text-sm">{label}</span>
                    <span className="text-xs text-gray-500 text-center">
                      {description}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location/Meeting Details *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Meeting room, Zoom link, or phone number"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.type === "video" &&
                  "Meeting link will be auto-generated if not specified"}
                {formData.type === "phone" &&
                  "Include phone number and dial-in details"}
                {formData.type === "in-person" &&
                  "Specify office location and room number"}
              </p>
            </div>

            {/* Interviewers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Interviewers *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableInterviewers.map((interviewer) => (
                  <label
                    key={interviewer.id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.interviewers.includes(interviewer.id)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.interviewers.includes(interviewer.id)}
                      onChange={() => handleInterviewerToggle(interviewer.id)}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {interviewer.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {interviewer.title}
                      </div>
                    </div>
                    {formData.interviewers.includes(interviewer.id) && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </label>
                ))}
              </div>
              {formData.interviewers.length === 0 && (
                <p className="text-sm text-red-500 mt-1">
                  Please select at least one interviewer
                </p>
              )}
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instructions for Candidate
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) =>
                  setFormData({ ...formData, instructions: e.target.value })
                }
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Special instructions, what to prepare, what to expect during the interview..."
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowScheduleModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={formData.interviewers.length === 0}
              >
                Schedule Interview
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Scheduled</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalScheduled}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.completed}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.averageRating.toFixed(1)}/5
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Duration</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(stats.averageDuration)}m
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              Interview Management
            </h2>
            <Button
              onClick={() => setShowScheduleModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Schedule Interview
            </Button>
          </div>
        </div>

        <div className="p-6">
          {/* Search and Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search interviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>

          {/* Interviews Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Interviewers
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInterviews.map((interview) => {
                  const { date, time } = formatDateTime(interview.scheduledAt);
                  return (
                    <tr key={interview.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {interview.candidateName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {interview.candidateEmail}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {interview.jobTitle}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{date}</div>
                        <div className="text-sm text-gray-500">{time}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {interview.type === "video" && (
                            <Video className="h-4 w-4 mr-2 text-blue-500" />
                          )}
                          {interview.type === "phone" && (
                            <Phone className="h-4 w-4 mr-2 text-green-500" />
                          )}
                          {interview.type === "in-person" && (
                            <MapPin className="h-4 w-4 mr-2 text-purple-500" />
                          )}
                          <span className="text-sm text-gray-900 capitalize">
                            {interview.type}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {interview.duration} min
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(interview.status)}
                          <span
                            className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              interview.status
                            )}`}
                          >
                            {interview.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {interview.interviewers.length} interviewer(s)
                        </div>
                        <div className="text-xs text-gray-500">
                          {interview.interviewers.map((i) => i.name).join(", ")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedInterview(interview)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredInterviews.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No interviews found
              </h3>
              <p className="text-gray-500">
                {searchTerm
                  ? "No interviews match your search."
                  : "Schedule your first interview to get started."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Interview Modal */}
      {showScheduleModal && <ScheduleInterviewModal />}

      {/* Interview Details Modal */}
      {selectedInterview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Interview Details
                </h2>
                <p className="text-gray-600">
                  {selectedInterview.jobTitle} -{" "}
                  {selectedInterview.candidateName}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedInterview(null)}
              >
                ×
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Date & Time
                  </label>
                  <p className="text-gray-900">
                    {formatDateTime(selectedInterview.scheduledAt).date} at{" "}
                    {formatDateTime(selectedInterview.scheduledAt).time}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Duration
                  </label>
                  <p className="text-gray-900">
                    {selectedInterview.duration} minutes
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Type
                  </label>
                  <p className="text-gray-900 capitalize">
                    {selectedInterview.type}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Status
                  </label>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                      selectedInterview.status
                    )}`}
                  >
                    {selectedInterview.status}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Candidate
                  </label>
                  <p className="text-gray-900">
                    {selectedInterview.candidateName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedInterview.candidateEmail}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Interviewers
                  </label>
                  <div className="space-y-1">
                    {selectedInterview.interviewers.map(
                      (interviewer, index) => (
                        <div key={index}>
                          <p className="text-gray-900">{interviewer.name}</p>
                          <p className="text-sm text-gray-600">
                            {interviewer.title}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {selectedInterview.instructions && (
              <div className="mt-6">
                <label className="text-sm font-medium text-gray-500">
                  Instructions
                </label>
                <p className="text-gray-900 mt-1">
                  {selectedInterview.instructions}
                </p>
              </div>
            )}

            {selectedInterview.meetingLink && (
              <div className="mt-6">
                <label className="text-sm font-medium text-gray-500">
                  Meeting Link
                </label>
                <p className="text-blue-600 mt-1">
                  <a
                    href={selectedInterview.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {selectedInterview.meetingLink}
                  </a>
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setSelectedInterview(null)}
              >
                Close
              </Button>
              {selectedInterview.status === "scheduled" && (
                <>
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-600"
                  >
                    Cancel Interview
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Edit Interview
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
