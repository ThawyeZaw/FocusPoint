import { useEffect, useRef } from 'react';
import { scheduleTimetableNotifications } from '../utils/timetableNotifications.js';

export default function TimetableNotificationScheduler() {
  const cleanupRef = useRef(null);

  useEffect(() => {
    const refreshSchedule = () => {
      cleanupRef.current?.();
      cleanupRef.current = scheduleTimetableNotifications();
    };

    refreshSchedule();

    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshSchedule();
    };

    window.addEventListener('focus', refreshSchedule);
    window.addEventListener('storage', refreshSchedule);
    window.addEventListener('focuspoint-db-change', refreshSchedule);
    document.addEventListener('visibilitychange', onVisible);
    const intervalId = window.setInterval(refreshSchedule, 15 * 60 * 1000);

    return () => {
      cleanupRef.current?.();
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshSchedule);
      window.removeEventListener('storage', refreshSchedule);
      window.removeEventListener('focuspoint-db-change', refreshSchedule);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return null;
}
