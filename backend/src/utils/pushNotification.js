import webpush from 'web-push';
import prisma from '../config/db.js';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'BDGXTu45-Yw1I7mmc3hxA7YW72gJxj_JksIVAj_6c9b0-SGQsm5_fFoH4ImHSmH1VOiNO75WLgNrvdwZdViAxao';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'oIsjeH_rbOfJuN-jD7OiQYoOTrTqOoZjrgEsP-rkr58';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:washmycarorg@gmail.com';

try {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} catch (err) {
  console.error('[WebPush] Failed to initialize VAPID details:', err);
}

export const getVapidPublicKey = () => vapidPublicKey;

/**
 * Register or update browser push subscription
 */
export const registerPushSubscription = async ({ endpoint, keys, userType, userId = null, employeeId = null }) => {
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throw new Error('Invalid push subscription structure');
  }

  const p256dh = keys.p256dh;
  const auth = keys.auth;

  return await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: {
      p256dh,
      auth,
      userType,
      userId: userId ? Number(userId) : null,
      employeeId: employeeId ? Number(employeeId) : null,
      updatedAt: new Date()
    },
    create: {
      endpoint,
      p256dh,
      auth,
      userType,
      userId: userId ? Number(userId) : null,
      employeeId: employeeId ? Number(employeeId) : null
    }
  });
};

/**
 * Unregister browser push subscription
 */
export const unregisterPushSubscription = async (endpoint) => {
  if (!endpoint) return;
  try {
    await prisma.pushSubscription.delete({
      where: { endpoint }
    });
  } catch (e) {
    // Already removed
  }
};

/**
 * Send Web Push notification to user or employee across all their subscribed browsers/devices
 * @param {'USER' | 'EMPLOYEE' | 'ADMIN'} recipientType 
 * @param {number} recipientId 
 * @param {{ title: string, body: string, url?: string, icon?: string, tag?: string }} payload 
 */
export const sendPushNotification = async (recipientType, recipientId, { title, body, url = '/', icon = '/logo.png', tag = 'wash-update' }) => {
  try {
    const whereClause = {
      userType: recipientType
    };

    if (recipientType === 'USER') {
      whereClause.userId = Number(recipientId);
    } else if (recipientType === 'EMPLOYEE') {
      whereClause.employeeId = Number(recipientId);
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: whereClause
    });

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`[WebPush] No push subscriptions found for ${recipientType} #${recipientId}`);
      return { success: false, reason: 'NO_SUBSCRIPTIONS' };
    }

    const pushData = JSON.stringify({
      title: title || 'Wash My Car',
      body: body || '',
      url: url || '/',
      icon: icon || '/logo.png',
      badge: '/favicon.ico',
      tag: tag || 'booking-notification',
      timestamp: Date.now()
    });

    const sendPromises = subscriptions.map(async (sub) => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      try {
        await webpush.sendNotification(pushConfig, pushData);
      } catch (err) {
        // If subscription is expired or unsubscribed (404 or 410 Gone), prune from database
        if (err.statusCode === 404 || err.statusCode === 410) {
          console.log(`[WebPush] Pruning expired subscription for ${sub.endpoint.slice(0, 30)}...`);
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error(`[WebPush] Error sending push to endpoint:`, err.message || err);
        }
      }
    });

    await Promise.all(sendPromises);
    return { success: true, count: subscriptions.length };
  } catch (error) {
    console.error(`[WebPush] Global error dispatching push notification:`, error);
    return { success: false, error: error.message };
  }
};
