// src/components/admin/ApplicationsTab.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Users, Clock, CheckCircle, XCircle, ArrowRight, Eye, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { applicationService } from '@/services/applicationService';
import { Application, ApplicationStatus, StageStatus } from '@/API';

interface ApplicationsTabProps {
  companyId?: string; // If provided, only show applications for this company's jobs
  onRefresh?: () => void;
}

export default function ApplicationsTab({ companyId, onRefresh }: ApplicationsTabProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('');
  const [stageFilter, setStageFilter] = useState<string>('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      let applicationsData: Application[];
      
      if (companyId) {
        applicationsData = await applicationService.getApplicationsByCompany(companyId);
      } else {
        // For super admin, get all applications
        applicationsData = await applicationService.getAllApplications();
      }
      
      setApplications(applicationsData);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const filteredApplications = applications.filter(app => {
    const candidateName = `${app.candidate?.firstName || ''} ${app.candidate?.lastName || ''}`.toLowerCase();
    const jobTitle = app.job?.title?.toLowerCase() || '';
    const companyName = app.job?.company?.name?.toLowerCase() || '';
    
    const matchesSearch = 
      candidateName.includes(searchTerm.toLowerCase()) ||
      jobTitle.includes(searchTerm.toLowerCase()) ||
      companyName.includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || app.overallStatus === statusFilter;
    const matchesStage = !stageFilter || app.currentStage.toString() === stageFilter;
    
    return matchesSearch && matchesStatus && matchesStage;
  });

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.ACTIVE:
        return 'bg-blue-100 text-blue-800';
      case ApplicationStatus.HIRED:
        return 'bg-green-100 text-green-800';
      case ApplicationStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      case ApplicationStatus.WITHDRAWN:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageStatusColor = (status: StageStatus) => {
    switch (status) {
      case StageStatus.COMPLETED:
        return 'text-green-600';
      case StageStatus.IN_PROGRESS:
        return 'text-blue-600';
      case StageStatus.PENDING:
        return 'text-yellow-600';
      case StageStatus.FAILED:
        return 'text-red-600';
      case StageStatus.SCHEDULED:
        return 'text-purple-600';
      default:
        return 'text-gray-500';
    }
  };

  const getStageIcon = (stage: number, status: StageStatus) => {
    const baseClass = `w-4 h-4 ${getStageStatusColor(status)}`;
    
    if (status === StageStatus.COMPLETED) return <CheckCircle className={baseClass} />;
    if (status === StageStatus.IN_PROGRESS) return <Clock className={baseClass} />;
    if (status === StageStatus.FAILED) return <XCircle className={baseClass} />;
    
    return <Clock className={`w-4 h-4 text-gray-400`} />;
  };

  const handleProgressApplication = async (applicationId: string, currentStage: number) => {
    try {
      await applicationService.progressToNextStage(applicationId, currentStage);
      loadApplications(); // Refresh the list
    } catch (error) {
      console.error('Error progressing application:', error);
    }
  };

  const stageNames = ['Application', 'Written Test', 'Video Test', 'Interview'];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Application Management</h1>
          <p className="text-gray-600 mt-1">
            Review and manage candidate applications through the 4-stage process
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {applications.filter(a => a.overallStatus === ApplicationStatus.ACTIVE).length}
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
              <p className="text-sm font-medium text-gray-600">Hired</p>
              <p className="text-2xl font-bold text-gray-900">
                {applications.filter(a => a.overallStatus === ApplicationStatus.HIRED).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">
                {applications.filter(a => a.overallStatus === ApplicationStatus.REJECTED).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Stage 4</p>
              <p className="text-2xl font-bold text-gray-900">
                {applications.filter(a => a.currentStage === 4).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search candidates, jobs, or companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-abhh-teal-600 focus:border-abhh-teal-600 text-gray-900"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | '')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-abhh-teal-600 focus:border-abhh-teal-600 text-gray-900"
          >
            <option value="">All Statuses</option>
            <option value={ApplicationStatus.ACTIVE}>Active</option>
            <option value={ApplicationStatus.HIRED}>Hired</option>
            <option value={ApplicationStatus.REJECTED}>Rejected</option>
            <option value={ApplicationStatus.WITHDRAWN}>Withdrawn</option>
          </select>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-abhh-teal-600 focus:border-abhh-teal-600 text-gray-900"
          >
            <option value="">All Stages</option>
            <option value="1">Stage 1 - Application</option>
            <option value="2">Stage 2 - Written Test</option>
            <option value="3">Stage 3 - Video Test</option>
            <option value="4">Stage 4 - Interview</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.map((application) => (
          <div key={application.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {application.candidate?.firstName} {application.candidate?.lastName}
                    </h3>
                    <p className="text-gray-600">{application.job?.title}</p>
                    <p className="text-sm text-gray-500">
                      {application.job?.company?.name} • Applied {new Date(application.appliedAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.overallStatus)}`}>
                      {application.overallStatus}
                    </span>
                    <span className="text-sm text-gray-500">
                      Stage {application.currentStage}/4
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stage Progress */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              {stageNames.map((stageName, index) => {
                const stageNum = index + 1;
                let stageStatus: StageStatus;
                
                switch (index) {
                  case 0:
                    stageStatus = application.applicationStatus;
                    break;
                  case 1:
                    stageStatus = application.writtenTestStatus;
                    break;
                  case 2:
                    stageStatus = application.videoTestStatus;
                    break;
                  case 3:
                    stageStatus = application.interviewStatus;
                    break;
                  default:
                    stageStatus = StageStatus.NOT_STARTED;
                }

                return (
                  <div key={stageName} className="text-center">
                    <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                      stageNum < application.currentStage
                        ? 'bg-green-100'
                        : stageNum === application.currentStage
                        ? 'bg-blue-100'
                        : 'bg-gray-100'
                    }`}>
                      {getStageIcon(stageNum, stageStatus)}
                    </div>
                    <p className="text-xs font-medium text-gray-900">{stageName}</p>
                    <p className={`text-xs mt-1 ${getStageStatusColor(stageStatus)}`}>
                      {stageStatus.replace('_', ' ')}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedApplication(application)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View Details
                </Button>
                
                {application.overallStatus === ApplicationStatus.ACTIVE && 
                 application.currentStage < 4 && (
                  <Button
                    size="sm"
                    onClick={() => handleProgressApplication(application.id, application.currentStage)}
                    className="bg-abhh-teal-600 hover:bg-abhh-teal-700"
                  >
                    <ArrowRight className="w-4 h-4 mr-1" />
                    Progress to Stage {application.currentStage + 1}
                  </Button>
                )}
              </div>
              
              <div className="text-xs text-gray-500">
                {application.feedback && (
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                    Has Feedback
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredApplications.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter || stageFilter 
              ? "Try adjusting your search criteria" 
              : "No applications have been submitted yet"}
          </p>
        </div>
      )}

      {/* TODO: Add ApplicationDetailsModal component */}
    </div>
  );
}