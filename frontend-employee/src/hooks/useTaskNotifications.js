import { useEffect, useRef, useState } from 'react';
import { getAssignedBookings } from '../api';

const NOTIFIED_KEY = 'employee_notified_task_ids';

const playChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (err) {
    // Audio context may be restricted by autoplay policy
  }
};

export const useTaskNotifications = (enabled = true) => {
  const [newTasksAlert, setNewTasksAlert] = useState([]);
  const isPollingRef = useRef(false);

  // Request notification permission once on mount if supported
  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, [enabled]);

  const checkForNewTasks = async () => {
    if (!enabled || isPollingRef.current) return;
    const token = localStorage.getItem('employeeToken');
    if (!token) return;

    isPollingRef.current = true;
    try {
      const bookings = await getAssignedBookings();
      if (!Array.isArray(bookings)) return;

      const storedNotified = JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '[]');
      const assignedTasks = bookings.filter(b => b.status === 'ASSIGNED');

      const newlyAssigned = assignedTasks.filter(b => !storedNotified.includes(b.id));

      if (newlyAssigned.length > 0) {
        // Trigger sound
        playChime();

        // Trigger browser notification for each new task
        newlyAssigned.forEach(task => {
          const title = `🚗 New Task Assigned: #${task.id}`;
          const body = `${task.washType?.name || 'Wash Service'} (${task.carType?.name || 'Car'}) scheduled for ${task.timeSlot} on ${new Date(task.date).toLocaleDateString()}. Tap to view.`;

          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              const notif = new Notification(title, {
                body,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: `task-${task.id}`,
                renotify: true
              });
              notif.onclick = () => {
                window.focus();
                window.location.href = '/schedule';
              };
            } catch (err) {
              console.warn('Native notification failed:', err);
            }
          }
        });

        // Set in-app notification banner
        setNewTasksAlert(prev => [...prev, ...newlyAssigned]);

        // Save into localStorage
        const updatedNotified = Array.from(new Set([...storedNotified, ...newlyAssigned.map(t => t.id)]));
        localStorage.setItem(NOTIFIED_KEY, JSON.stringify(updatedNotified));
      }
    } catch (err) {
      // If offline, fetch will fail silently and resume when online
      console.log('Background task check skipped or offline:', err.message);
    } finally {
      isPollingRef.current = false;
    }
  };

  useEffect(() => {
    if (!enabled) return;

    // Check immediately on mount
    checkForNewTasks();

    // Check whenever device comes back online (handles offline-to-online scenario)
    const handleOnline = () => {
      console.log('Internet connected! Checking for assigned tasks...');
      checkForNewTasks();
    };

    window.addEventListener('online', handleOnline);

    // Also poll every 20 seconds while app is active
    const interval = setInterval(checkForNewTasks, 20000);

    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, [enabled]);

  const dismissAlert = (taskId) => {
    setNewTasksAlert(prev => prev.filter(t => t.id !== taskId));
  };

  return { newTasksAlert, dismissAlert, requestPermission: () => {
    if ('Notification' in window) Notification.requestPermission();
  }};
};
