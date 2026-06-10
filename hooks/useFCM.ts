'use client';

import { useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import app from '@/lib/firebase';

export function useFCM(uid: string | null) {
  useEffect(() => {
    if (!uid) return;

    const requestPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const messaging = getMessaging(app);
          const currentToken = await getToken(messaging, {
            // Replace with your VAPID key if you have one.
            // vapidKey: "YOUR_VAPID_KEY"
          });
          
          if (currentToken) {
            // Save token to Firestore
            await setDoc(doc(db, 'users', uid), { fcmToken: currentToken }, { merge: true });
          }
        }
      } catch (error) {
        console.error('An error occurred while retrieving token. ', error);
      }
    };

    requestPermission();

    // Foreground message listener
    try {
      const messaging = getMessaging(app);
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Message received. ', payload);
        // You could trigger a toast notification here
      });
      return () => unsubscribe();
    } catch (e) {
      console.log('Messaging not supported', e);
    }
  }, [uid]);
}
