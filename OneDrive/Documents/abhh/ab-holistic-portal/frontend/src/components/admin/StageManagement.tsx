import React, { useState } from 'react';
import { clsx } from 'clsx';
import Button from '../shared/Button';
import { Application, ApplicationStage } from '../../types/application';
import { stageManagementService } from '../../services/stageManagementService';
import {
  CheckIcon,
  ClockIcon,
  XMarkIcon,
  ArrowRightIcon,
  UserIcon,
  AcademicCapIcon,
  VideoCameraIcon,
  CalendarDaysIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';

interface StageManagementProps {
  applications: (Application & { job?: { title: string } })[];
  onRefresh: () => void;
}

const StageManagement: React.FC<StageManagementProps> = ({ applications, onRefresh }) => {
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [processing, setProcessing] = useState<string[]>([]);

  // Group applications by stage
  const applicationsByStage = applications.reduce((acc, app) => {
    if (!acc[app.currentStage]) {
      acc[app.currentStage] = [];
    }
    acc[app.currentStage].push(app);
    return acc;
  }, {} as Record<ApplicationStage, Application[]>);

  const getStageIcon = (stage: ApplicationStage) => {
    const iconClass = "w-5 h-5";
    switch (stage) {
      case 'applied':
      case 'screening':
        return <DocumentCheckIcon className={iconClass} />;
      case 'written-test':
        return <AcademicCapIcon className={iconClass} />;
      case 'video-test':
        return <VideoCameraIcon className={iconClass} />;
      case 'final-interview':
        return <CalendarDaysIcon className={iconClass} />;
      case 'decision':
        return <ClockIcon className={iconClass} />;
      case 'accepted':
        return <CheckIcon className={iconClass} />;
      case 'rejected':
        return <XMarkIcon className={iconClass} />;
      default:
        return <UserIcon className={iconClass} />;
    }
  };

  const getStageColor = (stage: ApplicationStage) => {
    switch (stage) {
      case 'applied':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'screening':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'written-test':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'video-test':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'final-interview':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'decision':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStageName = (stage: ApplicationStage) => {
    const names = {
      'applied': 'Applied',
      'screening': 'Screening',
      'written-test': 'Written Test',
      'video-test': 'Video Test',
      'final-interview': 'Final Interview',
      'decision': 'Decision',
      'accepted': 'Accepted',
      'rejected': 'Rejected',
      'withdrawn': 'Withdrawn'
    };
    return names[stage] || stage;
  };

  const handleProgressApplication = async (applicationId: string, reason?: string) => {
    setProcessing(prev => [...prev, applicationId]);
    try {
      const result = await stageManagementService.progressApplication(
        applicationId,
        'admin@abholistic.com',
        reason
      );

      if (result.success) {
        onRefresh();
      } else {
        alert(`Failed to progress application: ${result.error}`);
      }
    } catch (error) {
      alert('Error progressing application');
    } finally {
      setProcessing(prev => prev.filter(id => id !== applicationId));
    }
  };

  const handleRejectApplication = async (applicationId: string, reason?: string) => {
    if (!confirm('Are you sure you want to reject this application?')) return;

    setProcessing(prev => [...prev, applicationId]);
    try {
      await stageManagementService.rejectApplication(
        applicationId,
        'admin@abholistic.com',
        reason
      );
      onRefresh();
    } catch (error) {
      alert('Error rejecting application');
    } finally {
      setProcessing(prev => prev.filter(id => id !== applicationId));
    }
  };

  const handleAcceptApplication = async (applicationId: string, notes?: string) => {
    setProcessing(prev => [...prev, applicationId]);
    try {
      await stageManagementService.acceptApplication(
        applicationId,
        'admin@abholistic.com',
        notes
      );
      onRefresh();
    } catch (error) {
      alert('Error accepting application');
    } finally {
      setProcessing(prev => prev.filter(id => id !== applicationId));
    }
  };

  const handleBulkAction = async (action: 'progress' | 'reject') => {
    if (selectedApplications.length === 0) return;

    const confirmMessage = action === 'progress'
      ? `Progress ${selectedApplications.length} selected applications?`
      : `Reject ${selectedApplications.length} selected applications?`;

    if (!confirm(confirmMessage)) return;

    try {
      if (action === 'progress') {
        const result = await stageManagementService.bulkProgressApplications(
          selectedApplications,
          'admin@abholistic.com',
          'Bulk action'
        );

        if (result.failed.length > 0) {
          alert(`${result.successful.length} applications progressed, ${result.failed.length} failed`);
        }
      }

      setSelectedApplications([]);
      onRefresh();
    } catch (error) {
      alert('Error performing bulk action');
    }
  };


  const canProgress = (application: Application) => {
    const nonProgressableStages: ApplicationStage[] = ['accepted', 'rejected', 'withdrawn', 'decision'];
    return !nonProgressableStages.includes(application.currentStage);
  };

  const canReject = (application: Application) => {
    const nonRejectableStages: ApplicationStage[] = ['accepted', 'rejected', 'withdrawn'];
    return !nonRejectableStages.includes(application.currentStage);
  };

  const getNextStageName = (currentStage: ApplicationStage): string => {
    const nextStages: Record<ApplicationStage, string> = {
      'applied': 'Screening',
      'screening': 'Written Test',
      'written-test': 'Video Test',
      'video-test': 'Final Interview',
      'final-interview': 'Decision',
      'decision': 'Final Decision',
      'accepted': 'Completed',
      'rejected': 'Completed',
      'withdrawn': 'Completed'
    };
    return nextStages[currentStage] || 'Next Stage';
  };


  const totalApplications = applications.length;
  const activeApplications = applications.filter(app =>
    !['accepted', 'rejected', 'withdrawn'].includes(app.currentStage)
  ).length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <UserIcon className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Applications</p>
              <p className="text-2xl font-bold text-gray-900">{totalApplications}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <ClockIcon className="w-8 h-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-bold text-gray-900">{activeApplications}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <CheckIcon className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Accepted</p>
              <p className="text-2xl font-bold text-gray-900">
                {applicationsByStage['accepted']?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <XMarkIcon className="w-8 h-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">
                {applicationsByStage['rejected']?.length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedApplications.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedApplications.length} application(s) selected
            </span>
            <div className="flex space-x-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleBulkAction('progress')}
              >
                Progress Selected
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleBulkAction('reject')}
              >
                Reject Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedApplications([])}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Applications by Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Object.entries(applicationsByStage).map(([stage, stageApplications]) => (
          <div key={stage} className="bg-white rounded-lg border border-gray-200">
            {/* Stage Header */}
            <div className={clsx(
              'px-4 py-3 border-b border-gray-200 flex items-center justify-between',
              'bg-gray-50'
            )}>
              <div className="flex items-center space-x-2">
                {getStageIcon(stage as ApplicationStage)}
                <h3 className="font-medium text-gray-900">
                  {getStageName(stage as ApplicationStage)}
                </h3>
                <span className={clsx(
                  'px-2 py-1 text-xs font-medium rounded-full border',
                  getStageColor(stage as ApplicationStage)
                )}>
                  {stageApplications.length}
                </span>
              </div>
            </div>

            {/* Applications List */}
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {stageApplications.map((application) => (
                <div
                  key={application.applicationId}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedApplications.includes(application.applicationId)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedApplications(prev => [...prev, application.applicationId]);
                          } else {
                            setSelectedApplications(prev =>
                              prev.filter(id => id !== application.applicationId)
                            );
                          }
                        }}
                        className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">
                          {application.applicantName}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {(application as any).job?.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Applied: {new Date(application.appliedAt).toLocaleDateString()}
                        </p>

                        {/* Test Scores */}
                        {application.writtenTestScore && (
                          <p className="text-xs text-gray-600 mt-1">
                            Written: {application.writtenTestScore}%
                          </p>
                        )}
                        {application.videoTestScore && (
                          <p className="text-xs text-gray-600">
                            Video: {application.videoTestScore}%
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex space-x-2">
                    {canProgress(application) && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleProgressApplication(application.applicationId)}
                        disabled={processing.includes(application.applicationId)}
                        className="text-xs"
                      >
                        <ArrowRightIcon className="w-3 h-3 mr-1" />
                        {getNextStageName(application.currentStage)}
                      </Button>
                    )}

                    {application.currentStage === 'decision' && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAcceptApplication(application.applicationId)}
                          disabled={processing.includes(application.applicationId)}
                          className="text-xs"
                        >
                          <CheckIcon className="w-3 h-3 mr-1" />
                          Accept
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRejectApplication(application.applicationId)}
                          disabled={processing.includes(application.applicationId)}
                          className="text-xs"
                        >
                          <XMarkIcon className="w-3 h-3 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}

                    {canReject(application) && application.currentStage !== 'decision' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRejectApplication(application.applicationId)}
                        disabled={processing.includes(application.applicationId)}
                        className="text-xs"
                      >
                        <XMarkIcon className="w-3 h-3 mr-1" />
                        Reject
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {stageApplications.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No applications in this stage</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StageManagement;