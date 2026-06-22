"use client";

import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ReferralEarnings, AppUser } from "@/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function EarningsPage() {
  const [loading, setLoading] = useState(true);
  const [earningsHistory, setEarningsHistory] = useState<ReferralEarnings[]>([]);
  const [user, setUser] = useState<AppUser | null>(null);
  
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setUser(userSnap.data() as AppUser);
          
          // Listen to earnings history
          const earningsRef = collection(db, "referral_earnings");
          const q = query(
            earningsRef, 
            where("influencerId", "==", currentUser.uid),
            orderBy("createdAt", "desc")
          );
          
          const unsubEarnings = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => {
              const d = doc.data();
              return {
                ...d,
                createdAt: d.createdAt?.toDate()
              } as unknown as ReferralEarnings; 
            });
            setEarningsHistory(data);
            setLoading(false);
          });
          
          return () => unsubEarnings();
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="p-8 text-center">로딩 중...</div>;
  }

  // Calculate this month's earnings
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const thisMonthEarnings = earningsHistory.reduce((sum, item) => {
    const d = item.createdAt as unknown as Date;
    if (d && d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      return sum + item.amount;
    }
    return sum;
  }, 0);

  // Group by month for chart
  const monthlyDataMap: Record<string, number> = {};
  earningsHistory.forEach(item => {
    const d = item.createdAt as unknown as Date;
    if (d) {
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyDataMap[monthStr] = (monthlyDataMap[monthStr] || 0) + item.amount;
    }
  });

  const chartData = Object.keys(monthlyDataMap).sort().map(key => ({
    name: key,
    amount: monthlyDataMap[key]
  })).slice(-6); // Last 6 months

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      <h1 className="text-2xl font-bold" style={{ fontFamily: 'Pretendard, sans-serif' }}>수익 대시보드</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col justify-center">
          <p className="text-olive-gray mb-2 font-medium">이번 달 수익</p>
          <div className="text-4xl md:text-5xl font-bold text-[#C8B84A] tracking-wider" style={{ fontFamily: 'DM Serif Display, serif' }}>
            {thisMonthEarnings.toLocaleString()}<span className="text-2xl ml-1 text-gray-500">원</span>
          </div>
        </div>
        
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col justify-center">
          <p className="text-olive-gray mb-2 font-medium">누적 페이백 잔액</p>
          <div className="text-3xl md:text-4xl font-bold text-olive-dark tracking-wider" style={{ fontFamily: 'DM Serif Display, serif' }}>
            {(user?.paybackBalance || 0).toLocaleString()}<span className="text-xl ml-1 text-gray-500">원</span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-6">월별 수익 추이</h2>
        {chartData.length > 0 ? (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B6B6B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B6B6B' }} tickFormatter={(value) => `${value.toLocaleString()}`} />
                <Tooltip 
                  cursor={{ fill: '#F7F6F1' }} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [`${Number(value).toLocaleString()}원`, '수익']}
                />
                <Bar dataKey="amount" fill="#6B7C3F" radius={[6, 6, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-olive-gray">
            데이터가 없습니다.
          </div>
        )}
      </div>

      {/* Details Table */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 overflow-hidden">
        <h2 className="text-xl font-bold mb-6">상세 내역</h2>
        
        {earningsHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-olive-gray text-sm">
                  <th className="pb-4 font-medium px-4">날짜</th>
                  <th className="pb-4 font-medium px-4">구매자</th>
                  <th className="pb-4 font-medium px-4 text-right">발생 페이백 금액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {earningsHistory.map((item) => {
                  const d = item.createdAt as unknown as Date;
                  const dateStr = d ? `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : '-';
                  
                  // Mask buyer ID (first 3 chars + ***)
                  const maskedBuyer = item.buyerId ? `${item.buyerId.substring(0, 3)}***` : '알 수 없음';
                  
                  return (
                    <tr key={item.id} className="hover:bg-neutral transition-colors">
                      <td className="py-4 px-4 text-sm text-gray-600">{dateStr}</td>
                      <td className="py-4 px-4 text-sm font-medium text-olive-dark">{maskedBuyer}</td>
                      <td className="py-4 px-4 text-sm font-bold text-accent text-right">+{item.amount.toLocaleString()}원</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-olive-gray">
            페이백 내역이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
