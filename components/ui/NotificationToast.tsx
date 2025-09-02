
import React, { useEffect, useState } from 'react';
import { NotificationType, NotificationAction } from '../../types';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '../icons/Icons';

interface NotificationToastProps {
  message: string;
  type: NotificationType;
  onDismiss: () => void;
  action?: NotificationAction;
}

const notificationConfig = {
  [NotificationType.Success]: {
    icon: <CheckCircleIcon className="h-6 w-6 text-green-400" />,
    bgClass: 'bg-slate-800/80 border-green-500',
  },
  [NotificationType.Error]: {
    icon: <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />,
    bgClass: 'bg-slate-800/80 border-red-500',
  },
  [NotificationType.Info]: {
    icon: <InformationCircleIcon className="h-6 w-6 text-blue-400" />,
    bgClass: 'bg-slate-800/80 border-blue-500',
  },
};

const NotificationToast: React.FC<NotificationToastProps> = ({ message, type, onDismiss, action }) => {
  const config = notificationConfig[type];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true); // Trigger fade-in animation
  }, []);

  const handleActionClick = () => {
      if(action) {
          action.onClick();
          onDismiss();
      }
  }

  return (
    <div 
      className={`p-4 rounded-lg shadow-lg text-brand-text w-full backdrop-blur-sm border transition-all duration-300 ease-in-out transform ${config.bgClass} ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{config.icon}</div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{message}</p>
          {action && (
            <div className="mt-2">
                <button onClick={handleActionClick} className="text-sm font-semibold text-brand-accent hover:text-brand-accent-hover">
                    {action.label}
                </button>
            </div>
          )}
        </div>
        <div className="ml-4 flex-shrink-0 flex items-center">
            <button 
                onClick={onDismiss} 
                className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                aria-label="Dismiss notification"
            >
                <XMarkIcon className="h-5 w-5" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;
