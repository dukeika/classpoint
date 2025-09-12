// Enhanced ApplicationsTab for Candidates with Stage-based Flow
import React, { useState, useEffect } from 'react';
import { 
  Clock, CheckCircle, XCircle, AlertCircle, ArrowRight, FileText, 
  Video, Calendar, Play, Eye, MessageSquare, Bell, RefreshCw,
  Award, User, Building, MapPin, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CandidateApplication } from './types';

interface EnhancedApplicationsTabProps {
  applications: CandidateApplication[];
  onTakeTest?: (applicationId: string, testType: 'written' | 'video') => void;
  onViewFeedback?: (applicationId: string) => void;
  onRefresh?: () => void;
}

interface StageInfo {
  stage: number;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  actionText?: string;
}

const STAGES: StageInfo[] = [
  {
    stage: 1,
    name: 'Application Review',
    icon: FileText,
    description: 'Your application is being reviewed by the hiring team',
    actionText: 'Application Submitted'
  },
  {
    stage: 2,
    name: 'Written Assessment',
    icon: FileText,
    description: 'Complete the written test to proceed to the next stage',
    actionText: 'Take Written Test'
  },
  {
    stage: 3,
    name: 'Video Assessment',
    icon: Video,
    description: 'Record your video responses to behavioral questions',
    actionText: 'Take Video Test'
  },
  {
    stage: 4,
    name: 'Final Interview',
    icon: Calendar,
    description: 'Schedule and attend your final interview',
    actionText: 'Schedule Interview'
  }
];

export default function EnhancedApplicationsTab({ 
  applications, 
  onTakeTest,
  onViewFeedback,
  onRefresh
}: EnhancedApplicationsTabProps) {
  const [selectedApplication, setSelectedApplication] = useState<CandidateApplication | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredApplications = applications.filter(app => {
    const matchesSearch = searchTerm === '' || 
      app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.overallStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStageStatus = (application: CandidateApplication, stage: number) => {
    switch (stage) {
      case 1: return application.stages.application.status;
      case 2: return application.stages.written_test.status;
      case 3: return application.stages.video_test.status;
      case 4: return application.stages.interview.status;
      default: return 'not_started';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'in_progress':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'scheduled':
        return 'text-purple-600 bg-purple-100';
      case 'not_started':
        return 'text-gray-500 bg-gray-100';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-blue-600 bg-blue-100';
      case 'hired':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'withdrawn':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStageProgress = (application: CandidateApplication) => {
    return (
      <div className="flex items-center space-x-2">
        {STAGES.map((stage, index) => {
          const status = getStageStatus(application, stage.stage);
          const isCurrentStage = application.currentStage === stage.stage;
          const isCompleted = stage.stage < application.currentStage;
          const Icon = stage.icon;

          return (
            <div key={stage.stage} className="flex items-center">
              <div className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                isCompleted 
                  ? 'bg-green-500 border-green-500 text-white'
                  : isCurrentStage
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'bg-gray-100 border-gray-300 text-gray-400'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
                
                {/* Status indicator dot for current stage */}
                {isCurrentStage && status === 'pending' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white animate-pulse" />
                )}
                {isCurrentStage && status === 'completed' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </div>
              
              {/* Connector line */}
              {index < STAGES.length - 1 && (
                <div className={`w-12 h-0.5 ${
                  stage.stage < application.currentStage ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const getCurrentStageAction = (application: CandidateApplication) => {
    const currentStage = application.currentStage;
    const stageStatus = getStageStatus(application, currentStage);
    
    if (application.overallStatus === 'rejected') {
      return (
        <div className="text-center py-4">
          <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 font-medium">Application Rejected</p>
          {application.feedback && (
            <p className="text-sm text-gray-600 mt-1">{application.feedback}</p>
          )}
        </div>
      );
    }

    if (application.overallStatus === 'hired') {
      return (
        <div className="text-center py-4">
          <Award className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-green-600 font-medium">Congratulations! You've been hired!</p>
        </div>
      );
    }

    switch (currentStage) {
      case 1:
        return (
          <div className="text-center py-4">
            <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-gray-700 font-medium">Application Under Review</p>
            <p className="text-sm text-gray-600 mt-1">
              The hiring team is reviewing your application. You'll be notified when they make a decision.
            </p>
          </div>
        );

      case 2:
        if (stageStatus === 'not_started' || stageStatus === 'pending') {
          return (
            <div className="text-center py-4">
              <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-gray-700 font-medium">Written Assessment Available</p>
              <p className="text-sm text-gray-600 mt-1 mb-3">
                You've been invited to take the written assessment. Complete it to move to the next stage.
              </p>
              <Button 
                onClick={() => onTakeTest && onTakeTest(application.id, 'written')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                Take Written Test
              </Button>
            </div>
          );
        } else if (stageStatus === 'completed') {
          return (
            <div className="text-center py-4">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-green-600 font-medium">Written Test Completed</p>
              <p className="text-sm text-gray-600 mt-1">
                Your test is being reviewed. You'll be notified of the results soon.
              </p>
            </div>
          );
        }
        break;

      case 3:
        if (stageStatus === 'not_started' || stageStatus === 'pending') {
          return (
            <div className="text-center py-4">
              <Video className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-gray-700 font-medium">Video Assessment Available</p>
              <p className="text-sm text-gray-600 mt-1 mb-3">
                Record your video responses to behavioral questions.
              </p>
              <Button 
                onClick={() => onTakeTest && onTakeTest(application.id, 'video')}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Video className="w-4 h-4 mr-2" />
                Start Video Test
              </Button>
            </div>
          );
        } else if (stageStatus === 'completed') {
          return (
            <div className="text-center py-4">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-green-600 font-medium">Video Assessment Completed</p>
              <p className="text-sm text-gray-600 mt-1">
                Your video responses are being reviewed.
              </p>
            </div>
          );
        }
        break;

      case 4:
        if (stageStatus === 'scheduled') {
          return (
            <div className="text-center py-4">
              <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-blue-600 font-medium">Interview Scheduled</p>
              <p className="text-sm text-gray-600 mt-1 mb-3">
                Your final interview is scheduled. Please join at the specified time.
              </p>
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Date:</strong> {application.stages.interview.scheduledAt ? new Date(application.stages.interview.scheduledAt).toLocaleDateString() : 'TBD'}
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Join Interview
                </Button>
              </div>
            </div>
          );
        } else {
          return (
            <div className="text-center py-4">
              <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-gray-700 font-medium">Interview Scheduling</p>
              <p className="text-sm text-gray-600 mt-1">
                The hiring team will contact you soon to schedule your final interview.
              </p>
            </div>
          );
        }
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Applications</h2>
          <p className="text-gray-600">Track the progress of your job applications</p>
        </div>
        {onRefresh && (
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by job title or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="hired">Hired</option>
          <option value="rejected">Rejected</option>
          <option value="withdrawn">Withdrawn</option>
        </select>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Found</h3>
            <p className="text-gray-600">Start browsing jobs to submit your first application!</p>
          </div>
        ) : (
          filteredApplications.map((application) => (
            <div
              key={application.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Application Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Building className="w-5 h-5 text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900">{application.jobTitle}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getOverallStatusColor(application.overallStatus)}`}>
                        {application.overallStatus.charAt(0).toUpperCase() + application.overallStatus.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {application.company}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Applied {new Date(application.appliedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-1">Current Stage</div>
                    <div className="font-medium text-gray-900">
                      Stage {application.currentStage}: {STAGES[application.currentStage - 1]?.name}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stage Progress */}
              <div className="p-6 bg-gray-50">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Application Progress</h4>
                  {getStageProgress(application)}
                </div>
                
                {/* Stage Legend */}
                <div className="grid grid-cols-4 gap-2 text-xs text-gray-600">
                  {STAGES.map((stage) => (
                    <div key={stage.stage} className="text-center">
                      <div className="font-medium">{stage.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Stage Action */}
              <div className="p-6">
                {getCurrentStageAction(application)}
                
                {/* Feedback Section */}
                {application.feedback && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start">
                      <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h5 className="font-medium text-blue-900">Feedback from Hiring Team</h5>
                        <p className="text-sm text-blue-800 mt-1">{application.feedback}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Next Action */}
                {application.nextAction && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                      <Bell className="w-5 h-5 text-yellow-600 mr-3" />
                      <div>
                        <h5 className="font-medium text-yellow-900">Next Steps</h5>
                        <p className="text-sm text-yellow-800">{application.nextAction}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}