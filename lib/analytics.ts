import { getAnalytics, isSupported, logEvent as firebaseLogEvent } from 'firebase/analytics';
import app from './firebase';

let analytics: ReturnType<typeof getAnalytics> | null = null;

// Initialize analytics only on client side and if supported
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(err => console.error('Analytics not supported', err));
}

export const logEvent = (eventName: string, eventParams?: Record<string, string | number | boolean>) => {
  if (analytics) {
    firebaseLogEvent(analytics, eventName, eventParams);
  } else {
    // Analytics is not initialized yet or not supported, maybe log to console in dev mode
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Analytics - Not Initialized] ${eventName}`, eventParams);
    }
  }
};
