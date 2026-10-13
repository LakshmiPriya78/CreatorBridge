import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../api/client';
import type { NotificationItem } from '../types';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  latestAlert: { title: string; message: string; link?: string } | null;
  clearLatestAlert: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [latestAlert, setLatestAlert] = useState<{ title: string; message: string; link?: string } | null>(null);

  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {}
  }, [user]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Connect to SSE when user is authenticated
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('creatorbridge_token');
    if (!token) return;

    const eventSource = new EventSource(`/api/events?token=${encodeURIComponent(token)}`);

    const handleEvent = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        setLatestAlert({
          title: data.title || 'New Notification',
          message: data.message || '',
          link: data.link,
        });
        refreshNotifications();

        // Dispatch app-wide event for real-time dashboard updates without page refresh
        window.dispatchEvent(new CustomEvent('creatorbridge:event', { detail: data }));
      } catch (err) {
        console.error('Error handling SSE notification:', err);
      }
    };

    eventSource.addEventListener('INVITATION_RECEIVED', handleEvent);
    eventSource.addEventListener('INVITATION_ACCEPTED', handleEvent);
    eventSource.addEventListener('INVITATION_COUNTER', handleEvent);
    eventSource.addEventListener('INVITATION_DECLINED', handleEvent);
    eventSource.addEventListener('COUNTERPROPOSAL_RECEIVED', handleEvent);
    eventSource.addEventListener('AGREEMENT_FINALIZED', handleEvent);
    eventSource.addEventListener('PROJECT_CONFIRMED', handleEvent);
    eventSource.addEventListener('PROJECT_STATUS_UPDATE', handleEvent);
    eventSource.addEventListener('DELIVERABLE_SUBMITTED', handleEvent);
    eventSource.addEventListener('REVISION_REQUESTED', handleEvent);
    eventSource.addEventListener('DELIVERABLE_APPROVED', handleEvent);
    eventSource.addEventListener('PAYMENT_INITIATED', handleEvent);
    eventSource.addEventListener('PAYMENT_COMPLETED', handleEvent);
    eventSource.addEventListener('PAYMENT_DISPUTED', handleEvent);
    eventSource.addEventListener('REVIEW_RECEIVED', handleEvent);

    return () => {
      eventSource.close();
    };
  }, [user, refreshNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch {}
  };

  const clearLatestAlert = () => setLatestAlert(null);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        latestAlert,
        clearLatestAlert,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
