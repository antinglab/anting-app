"use client";

import React, { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { PointHistory } from "@/types";

export default function PointsPage() {
  const [balance, setBalance] = useState<number>(0);
  const [history, setHistory] = useState<PointHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);

  // Form states
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
      } else {
        setUid(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!uid) return;

    // Listen to balance
    const pointsRef = doc(db, "points", uid);
    const unsubPoints = onSnapshot(pointsRef, (docSnap) => {
      if (docSnap.exists()) {
        setBalance(docSnap.data().balance || 0);
      } else {
        setBalance(0);
      }
    });

    // Listen to history
    const historyRef = collection(db, "points", uid, "history");
    const q = query(historyRef, orderBy("createdAt", "desc"));
    const unsubHistory = onSnapshot(q, (snapshot) => {
      const hist: PointHistory[] = [];
      snapshot.forEach((doc) => {
        hist.push({ id: doc.id, ...doc.data() } as PointHistory);
      });
      setHistory(hist);
      setLoading(false);
    });

    return () => {
      unsubPoints();
      unsubHistory();
    };
  }, [uid]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;

    const amount = parseInt(withdrawAmount, 10);
    if (isNaN(amount) || amount < 10000) {
      alert("출금은 최소 10,000P부터 가능합니다.");
      return;
    }
    if (amount > balance) {
      alert("보유 포인트가 부족합니다.");
      return;
    }

    try {
      setSubmitting(true);
      await addDoc(collection(db, "withdraw_requests"), {
        uid,
        amount,
        bankName,
        accountNumber,
        accountHolder,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      alert("출금 신청이 완료되었습니다.");
      setWithdrawAmount("");
      setBankName("");
      setAccountNumber("");
      setAccountHolder("");
    } catch (err) {
      const error = err as Error;
      alert("출금 신청 중 오류가 발생했습니다: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-olive-gray">로딩 중...</div>;
  if (!uid) return <div className="p-8 text-center text-olive-gray">로그인이 필요합니다.</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      <h1 className="text-2xl font-bold text-olive-dark">포인트 및 출금 관리</h1>
      
      {/* 잔액 표시 */}
      <div className="bg-white rounded-[24px] shadow-sm p-8 border border-olive-pale flex flex-col items-center justify-center space-y-4">
        <p className="text-olive-gray text-sm">보유 포인트</p>
        <p className="text-[48px] font-bold text-[#C8B84A] font-['DM_Serif_Display']">
          {balance.toLocaleString()}<span className="text-2xl ml-1 text-[#C8B84A]">P</span>
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* 출금 신청 폼 */}
        <div className="bg-white rounded-[24px] shadow-sm p-6 border border-olive-pale">
          <h2 className="text-lg font-bold text-olive-dark mb-4">출금 신청</h2>
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="block text-sm text-olive-gray mb-1">출금 금액 (최소 10,000P)</label>
              <input 
                type="number" 
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="10000"
                className="w-full px-4 py-3 rounded-[12px] border border-olive focus:ring-2 focus:ring-olive-pale outline-none"
                required
                min="10000"
              />
            </div>
            <div>
              <label className="block text-sm text-olive-gray mb-1">은행명</label>
              <input 
                type="text" 
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="예: 국민은행"
                className="w-full px-4 py-3 rounded-[12px] border border-olive focus:ring-2 focus:ring-olive-pale outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-olive-gray mb-1">계좌번호 (- 제외)</label>
              <input 
                type="text" 
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="1234567890"
                className="w-full px-4 py-3 rounded-[12px] border border-olive focus:ring-2 focus:ring-olive-pale outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-olive-gray mb-1">예금주</label>
              <input 
                type="text" 
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="홍길동"
                className="w-full px-4 py-3 rounded-[12px] border border-olive focus:ring-2 focus:ring-olive-pale outline-none"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={submitting}
              className="w-full h-12 bg-olive hover:bg-olive-light text-white rounded-[999px] font-bold transition-colors disabled:opacity-50"
            >
              {submitting ? "처리 중..." : "출금 신청하기"}
            </button>
          </form>
        </div>

        {/* 포인트 내역 */}
        <div className="bg-white rounded-[24px] shadow-sm p-6 border border-olive-pale">
          <h2 className="text-lg font-bold text-olive-dark mb-4">포인트 내역</h2>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {history.length === 0 ? (
              <p className="text-center text-olive-gray text-sm py-8">내역이 없습니다.</p>
            ) : (
              history.map((item) => {
                const date = item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString('ko-KR') : '-';
                const isEarn = item.type === 'earn' || item.type === 'payback';
                return (
                  <div key={item.id} className="flex justify-between items-center py-3 border-b border-neutral last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-olive-dark">{item.description}</p>
                      <p className="text-xs text-olive-gray">{date}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${isEarn ? 'text-olive' : 'text-red-500'}`}>
                        {isEarn ? '+' : '-'}{item.amount.toLocaleString()}P
                      </p>
                      <p className="text-xs text-olive-gray">잔액: {item.balance.toLocaleString()}P</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
