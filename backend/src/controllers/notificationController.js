import { getVapidPublicKey, registerPushSubscription, unregisterPushSubscription } from '../utils/pushNotification.js';

export const getVapidKey = (req, res) => {
  res.json({ publicKey: getVapidPublicKey() });
};

export const subscribePush = async (req, res) => {
  try {
    const { subscription, userType } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Valid push subscription is required.' });
    }

    let determinedUserType = userType || 'USER';
    let userId = null;
    let employeeId = null;

    if (req.user) {
      // req.user could be user, employee, or admin
      if (req.user.role === 'employee' || req.user.status !== undefined || req.user.onDuty !== undefined || determinedUserType === 'EMPLOYEE') {
        determinedUserType = 'EMPLOYEE';
        employeeId = req.user.id;
      } else if (req.user.role === 'admin' || req.user.email?.includes('admin')) {
        determinedUserType = 'ADMIN';
      } else {
        determinedUserType = 'USER';
        userId = req.user.id;
      }
    }

    const saved = await registerPushSubscription({
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      userType: determinedUserType,
      userId,
      employeeId
    });

    res.json({ message: 'Subscribed to browser push notifications successfully.', subscription: saved });
  } catch (error) {
    console.error('Push subscribe error:', error);
    res.status(500).json({ error: error.message || 'Failed to subscribe to push notifications.' });
  }
};

export const unsubscribePush = async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      await unregisterPushSubscription(endpoint);
    }
    res.json({ message: 'Unsubscribed from push notifications.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
