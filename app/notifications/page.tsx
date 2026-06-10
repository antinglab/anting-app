'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card'; // fallback if they have it, else regular div

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  createdAt: any;
  read: boolean;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'notifications', user.uid, 'items'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: NotificationItem[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as NotificationItem);
      });
      setNotifications(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) return <div className="p-4">로딩 중...</div>;
  if (!user) return <div className="p-4">로그인이 필요합니다.</div>;

  return (
    <div className="max-w-3xl mx-auto p-4 py-8">
      <h1 className="text-2xl font-bold font-pretendard mb-6 text-olive-dark">알림 내역</h1>
      {notifications.length === 0 ? (
        <div className="text-center text-gray-500 py-10 bg-white rounded-2xl shadow-sm">
          새로운 알림이 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`p-4 bg-white rounded-2xl shadow-sm border ${item.read ? 'border-gray-100' : 'border-olive-light'} transition-all`}
            >
              <h3 className="font-semibold text-lg text-olive-dark">{item.title}</h3>
              <p className="text-gray-600 mt-1">{item.body}</p>
              <span className="text-xs text-gray-400 mt-2 block">
                {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
