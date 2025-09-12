// src/components/candidate/NotificationsTab.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Mail, 
  Calendar, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Trash2,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  type: 'application_status' | 'interview_scheduled' | 'test_reminder' | 'general';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
  priority: 'low' | 'medium' | 'high';
  metadata?: {
    applicationId?: string;
    jobTitle?: string;
    companyName?: string;
    interviewDate?: string;
  };
}

export interface NotificationsTabProps {
  className?: string;
}

// Mock notifications data - in real app, this would come from backend
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'application_status',
    title: 'Application Status Updated',
    message: 'Your application for Senior Frontend Developer at TechCorp Solutions has been moved to the next stage.',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    actionUrl: '/candidate/dashboard?tab=applications',
    actionLabel: 'View Application',
    priority: 'high',
    metadata: {
      jobTitle: 'Senior Frontend Developer',
      companyName: 'TechCorp Solutions'
    }
  },
  {
    id: '2',
    type: 'interview_scheduled',
    title: 'Interview Scheduled',
    message: 'Your video interview for Product Manager position at InnovateLabs has been scheduled.',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    actionUrl: '/candidate/dashboard?tab=interview',
    actionLabel: 'View Interview',
    priority: 'high',
    metadata: {
      jobTitle: 'Product Manager',
      companyName: 'InnovateLabs',
      interviewDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString() // 2 days from now
    }
  },
  {
    id: '3',
    type: 'test_reminder',
    title: 'Test Reminder',
    message: 'You have a pending written test for DevOps Engineer position. Please complete it within 48 hours.',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    actionUrl: '/candidate/dashboard?tab=test',
    actionLabel: 'Take Test',
    priority: 'medium',
    metadata: {
      jobTitle: 'DevOps Engineer',
      companyName: 'InnovateLabs'
    }
  },
  {
    id: '4',
    type: 'general',
    title: 'Profile Completion',
    message: 'Complete your profile by uploading a resume to increase your chances of getting hired.',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    actionUrl: '/candidate/dashboard?tab=profile',
    actionLabel: 'Complete Profile',
    priority: 'low'
  }
];

export const NotificationsTab: React.FC<NotificationsTabProps> = ({ className }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const getNotificationIcon = (type: string, priority: string) => {
    switch (type) {
      case 'application_status':
        return <FileText className={`w-5 h-5 ${priority === 'high' ? 'text-blue-600' : 'text-blue-500'}`} />;
      case 'interview_scheduled':
        return <Calendar className={`w-5 h-5 ${priority === 'high' ? 'text-green-600' : 'text-green-500'}`} />;
      case 'test_reminder':
        return <AlertCircle className={`w-5 h-5 ${priority === 'high' ? 'text-orange-600' : 'text-orange-500'}`} />;
      default:
        return <Bell className={`w-5 h-5 ${priority === 'high' ? 'text-gray-600' : 'text-gray-500'}`} />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return `${diffInDays}d ago`;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, isRead: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.isRead;
    if (filter === 'read') return notif.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className={className}>
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-6 h-6 text-gray-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
                {unreadCount > 0 && (
                  <p className="text-sm text-gray-500">
                    {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark all as read
              </Button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-4 mt-4">
            {(['all', 'unread', 'read'] as const).map(filterType => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === filterType
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {filterType === 'all' ? 'All' : filterType === 'unread' ? 'Unread' : 'Read'}
                {filterType === 'unread' && unreadCount > 0 && (
                  <span className="ml-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'all' ? 'No notifications' : `No ${filter} notifications`}
              </h3>
              <p className="text-gray-500">
                {filter === 'all' 
                  ? "You're all caught up! Notifications will appear here when there are updates."
                  : `You don't have any ${filter} notifications.`
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type, notification.priority)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className={`text-sm font-medium ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              getPriorityBadge(notification.priority)
                            }`}>
                              {notification.priority}
                            </span>
                          </div>
                          
                          <p className="mt-1 text-sm text-gray-600">
                            {notification.message}
                          </p>
                          
                          {notification.metadata?.interviewDate && (
                            <p className="mt-1 text-xs text-blue-600">
                              📅 {new Date(notification.metadata.interviewDate).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}
                          
                          <div className="mt-2 flex items-center space-x-4">
                            <span className="text-xs text-gray-500">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                            
                            {notification.actionUrl && (
                              <a
                                href={notification.actionUrl}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                              >
                                {notification.actionLabel || 'View Details'}
                              </a>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="Mark as read"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Delete notification"
                          >
                            <Trash2 className="w-4 h-4" />
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
    </div>
  );
};

export default NotificationsTab;