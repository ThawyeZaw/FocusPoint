const DEFAULT_ICON = '/pwa-192.png';

export function getNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return window.Notification.permission;
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (window.Notification.permission !== 'default') return window.Notification.permission;

  try {
    return await window.Notification.requestPermission();
  } catch {
    return window.Notification.permission;
  }
}

export async function showAppNotification(title, options = {}) {
  if (!('Notification' in window) || window.Notification.permission !== 'granted') return false;

  const payload = {
    icon: DEFAULT_ICON,
    badge: DEFAULT_ICON,
    ...options,
  };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((resolve) => window.setTimeout(() => resolve(null), 700)),
      ]);
      if (registration?.showNotification) {
        await registration.showNotification(title, payload);
        return true;
      }
    }
  } catch {
    // Fall back to the page notification API below.
  }

  try {
    new window.Notification(title, payload);
    return true;
  } catch {
    return false;
  }
}
