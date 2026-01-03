'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function NotificationBanner() {
  const searchParams = useSearchParams();
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    // Check for verification status
    const verified = searchParams.get('verified');
    if (verified === 'success') {
      setNotification({
        type: 'success',
        message: 'Email verified successfully! You will now receive birthday reminders for this paper.',
      });
    } else if (verified === 'error') {
      const errorMessage = searchParams.get('message') || 'Verification failed';
      setNotification({
        type: 'error',
        message: decodeURIComponent(errorMessage),
      });
    }

    // Check for unsubscribe status
    const unsubscribed = searchParams.get('unsubscribed');
    if (unsubscribed === 'success') {
      setNotification({
        type: 'success',
        message: 'You have been unsubscribed successfully. You will no longer receive birthday reminders for this paper.',
      });
    } else if (unsubscribed === 'error') {
      const errorMessage = searchParams.get('message') || 'Unsubscribe failed';
      setNotification({
        type: 'error',
        message: decodeURIComponent(errorMessage),
      });
    }

    // Auto-dismiss after 10 seconds
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, notification]);

  if (!notification) {
    return null;
  }

  return (
    <div
      className={`mb-6 p-4 rounded-lg border ${
        notification.type === 'success'
          ? 'bg-green-50 text-green-800 border-green-200'
          : 'bg-red-50 text-red-800 border-red-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <p className="font-body text-sm flex-1">{notification.message}</p>
        <button
          onClick={() => setNotification(null)}
          className="text-gray-400 hover:text-gray-600 ml-4"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
