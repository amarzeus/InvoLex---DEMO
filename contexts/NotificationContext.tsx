
import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import { Notification, NotificationType, NotificationAction } from '../types';
import NotificationToast from '../components/ui/NotificationToast';

interface NotificationContextType {
  addNotification: (message: string, type?: NotificationType, action?: NotificationAction) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((message: string, type: NotificationType = NotificationType.Success, action?: NotificationAction) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type, action }]);
    if (!action) { // Auto-dismiss only if there's no action
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    }
  }, []);

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <div className="fixed top-5 right-5 z-50 space-y-2 w-full max-w-sm">
        {notifications.map(notification => (
          <NotificationToast
            key={notification.id}
            message={notification.message}
            type={notification.type}
            onDismiss={() => removeNotification(notification.id)}
            action={notification.action}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
