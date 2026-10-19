import { getVapidPublicKey, subscribePushNotification } from '../api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Initializes service worker and subscribes technician browser to push notifications
 */
export async function initPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    console.log('[WebPush] Push notifications not supported in this browser.');
    return { supported: false };
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;

    if (Notification.permission === 'denied') {
      console.log('[WebPush] Notifications blocked by employee.');
      return { supported: true, granted: false };
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return { supported: true, granted: false };
      }
    }

    const vapidKeyRes = await getVapidPublicKey();
    const vapidPublicKey = vapidKeyRes?.publicKey;
    if (!vapidPublicKey) {
      console.warn('[WebPush] Missing VAPID public key from server');
      return { supported: true, granted: true };
    }

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
    }

    if (subscription) {
      await subscribePushNotification(subscription, 'EMPLOYEE');
      console.log('[WebPush] Employee browser push subscribed successfully.');
    }

    return { supported: true, granted: true, subscribed: true };
  } catch (error) {
    console.warn('[WebPush] Error setting up push notifications for employee:', error);
    return { supported: true, error: error.message };
  }
}
