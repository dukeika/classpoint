// NotificationSystem.tsx - Stage progression notifications
import React, { useState, useEffect } from 'react';
import { 
  Bell, CheckCircle, XCircle, AlertCircle, Info, X, 
  FileText, Video, Calendar, User, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  category: 'stage_progression' | 'test_invitation' | 'interview_scheduled' | 'application_update' | 'system';
  title: string;
  message: string;
  applicationId?: string;
  jobTitle?: string;
  companyName?: string;
  timestamp: string;
  read: boolean;
  actionRequired?: boolean;
  actionText?: string;
  actionUrl?: string;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (notificationId: string) => void;
  onActionClick?: (notification: Notification) => void;
  userRole?: 'candidate' | 'company_admin' | 'super_admin';
}

export default function NotificationSystem({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onActionClick,
  userRole = 'candidate'
}: NotificationSystemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'stage_progression' | 'system'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;
  
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'stage_progression':
        return notification.category === 'stage_progression' || 
               notification.category === 'test_invitation' || 
               notification.category === 'interview_scheduled';
      case 'system':
        return notification.category === 'system';
      default:
        return true;
    }
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getNotificationIcon = (notification: Notification) => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getCategoryIcon = (notification: Notification) => {
    switch (notification.category) {
      case 'stage_progression':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'test_invitation':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'interview_scheduled':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      case 'application_update':
        return <User className="w-4 h-4 text-gray-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return notificationTime.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              {[
                { key: 'all', label: 'All' },
                { key: 'unread', label: `Unread (${unreadCount})` },
                { key: 'stage_progression', label: 'Progress' },
                { key: 'system', label: 'System' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`flex-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    filter === tab.key
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            {/* Actions */}
            {unreadCount > 0 && (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onMarkAllAsRead}
                  className="w-full text-sm"
                >
                  Mark all as read
                </Button>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">No notifications</p>
                <p className="text-sm">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          {getCategoryIcon(notification)}
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        
                        {/* Job/Company Info */}
                        {(notification.jobTitle || notification.companyName) && (
                          <div className="text-xs text-gray-500 mb-2">
                            {notification.jobTitle && (
                              <span className="font-medium">{notification.jobTitle}</span>
                            )}
                            {notification.jobTitle && notification.companyName && ' • '}
                            {notification.companyName && (
                              <span>{notification.companyName}</span>
                            )}
                          </div>
                        )}
                        
                        {/* Action Button */}
                        {notification.actionRequired && notification.actionText && (
                          <Button
                            size="sm"
                            onClick={() => onActionClick && onActionClick(notification)}
                            className="mb-2 bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {notification.actionText}
                          </Button>
                        )}
                        
                        {/* Timestamp and Actions */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">
                            {formatRelativeTime(notification.timestamp)}
                          </span>
                          
                          <div className="flex items-center space-x-2">
                            {!notification.read && (
                              <button
                                onClick={() => onMarkAsRead(notification.id)}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                Mark as read
                              </button>
                            )}
                            <button
                              onClick={() => onDeleteNotification(notification.id)}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Notification Helper Functions
export class NotificationHelper {
  static createStageProgressionNotification(
    applicationId: string,
    jobTitle: string,
    companyName: string,
    fromStage: number,
    toStage: number,
    userRole: 'candidate' | 'company_admin' = 'candidate'
  ): Notification {
    const stageNames = ['Application', 'Written Test', 'Video Test', 'Interview'];
    const newStageName = stageNames[toStage - 1];
    
    const candidateTitle = `Application Advanced to ${newStageName}`;
    const adminTitle = `Candidate progressed to ${newStageName}`;
    
    const candidateMessage = `Great news! Your application for ${jobTitle} has been advanced to the ${newStageName} stage.`;
    const adminMessage = `A candidate's application for ${jobTitle} has progressed to the ${newStageName} stage.`;

    return {
      id: `stage_progression_${applicationId}_${Date.now()}`,
      type: 'success',
      category: 'stage_progression',
      title: userRole === 'candidate' ? candidateTitle : adminTitle,
      message: userRole === 'candidate' ? candidateMessage : adminMessage,
      applicationId,
      jobTitle,
      companyName,
      timestamp: new Date().toISOString(),
      read: false,
      actionRequired: false
    };
  }

  static createTestInvitationNotification(
    applicationId: string,
    jobTitle: string,
    companyName: string,
    testType: 'written' | 'video'
  ): Notification {
    const testName = testType === 'written' ? 'Written Assessment' : 'Video Assessment';
    
    return {
      id: `test_invitation_${applicationId}_${testType}_${Date.now()}`,
      type: 'info',
      category: 'test_invitation',
      title: `${testName} Available`,
      message: `You've been invited to take the ${testName.toLowerCase()} for ${jobTitle}. Complete it to proceed to the next stage.`,
      applicationId,
      jobTitle,
      companyName,
      timestamp: new Date().toISOString(),
      read: false,
      actionRequired: true,
      actionText: `Take ${testName}`,
      actionUrl: `/candidate/test/${testType}/${applicationId}`
    };
  }

  static createApplicationRejectionNotification(
    applicationId: string,
    jobTitle: string,
    companyName: string,
    reason?: string
  ): Notification {
    return {
      id: `rejection_${applicationId}_${Date.now()}`,
      type: 'error',
      category: 'application_update',
      title: 'Application Not Selected',
      message: `Unfortunately, your application for ${jobTitle} at ${companyName} was not selected.${reason ? ` Feedback: ${reason}` : ''}`,
      applicationId,
      jobTitle,
      companyName,
      timestamp: new Date().toISOString(),
      read: false,
      actionRequired: false
    };
  }

  static createInterviewScheduledNotification(
    applicationId: string,
    jobTitle: string,
    companyName: string,
    interviewDate: string,
    meetingUrl?: string
  ): Notification {
    return {
      id: `interview_scheduled_${applicationId}_${Date.now()}`,
      type: 'info',
      category: 'interview_scheduled',
      title: 'Interview Scheduled',
      message: `Your final interview for ${jobTitle} has been scheduled for ${new Date(interviewDate).toLocaleDateString()}.`,
      applicationId,
      jobTitle,
      companyName,
      timestamp: new Date().toISOString(),
      read: false,
      actionRequired: true,
      actionText: 'View Details',
      actionUrl: `/candidate/interview/${applicationId}`
    };
  }

  static createHiredNotification(
    applicationId: string,
    jobTitle: string,
    companyName: string
  ): Notification {
    return {
      id: `hired_${applicationId}_${Date.now()}`,
      type: 'success',
      category: 'application_update',
      title: 'Congratulations - You\'re Hired!',
      message: `Congratulations! You have been selected for the ${jobTitle} position at ${companyName}. Welcome to the team!`,
      applicationId,
      jobTitle,
      companyName,
      timestamp: new Date().toISOString(),
      read: false,
      actionRequired: false
    };
  }
}