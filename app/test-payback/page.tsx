"use client";

import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { doc, updateDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppUser } from "@/types";
import { logEvent } from "@/lib/analytics";

export default function TestPaybackPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AppUser | null>(null);
  const [targetInfluencerId, setTargetInfluencerId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [log, setLog] = useState<string[]>([]);
  
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        
        // Listen to user changes in real-time
        const unsubUser = onSnapshot(userRef, (userSnap) => {
          if (userSnap.exists()) {
            setUser(userSnap.data() as AppUser);
          }
          setLoading(false);
        });
        
        return () => unsubUser();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const addLog = (msg: string) => {
    setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const handleSetReferrer = async () => {
    if (!user || !auth.currentUser) return;
    if (!targetInfluencerId.trim()) {
      alert("추천인 ID(UID)를 입력해주세요.");
      return;
    }
    
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, { referredBy: targetInfluencerId });
      addLog(`추천인 ID가 ${targetInfluencerId}로 설정되었습니다.`);
    } catch (e) {
      addLog(`추천인 설정 실패: ${(e as Error).message}`);
    }
  };

  const handleCreateMockOrder = async () => {
    if (!auth.currentUser) return;
    
    try {
      const newOrderId = `test-order-${Date.now()}`;
      const orderRef = doc(db, "orders", newOrderId);
      
      await setDoc(orderRef, {
        id: newOrderId,
        userId: auth.currentUser.uid,
        sellerId: "seller-123",
        totalAmount: 100000, // 100,000원 -> 예상 페이백 5,000원
        status: "pending",
        createdAt: new Date()
      });
      
      setOrderId(newOrderId);
      setOrderStatus("pending");
      addLog(`가상 주문 생성됨: ${newOrderId} (100,000원, pending)`);
    } catch (e) {
      addLog(`주문 생성 실패: ${(e as Error).message}`);
    }
  };

  const handleCompleteOrder = async () => {
    if (!orderId) {
      alert("먼저 가상 주문을 생성해주세요.");
      return;
    }
    
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: "completed"
      });
      
      logEvent('purchase_complete', {
        orderId,
        amount: 100000
      });

      setOrderStatus("completed");
      addLog(`주문 ${orderId} 상태가 'completed'로 변경되었습니다. (Cloud Function이 트리거되어 페이백이 계산되어야 합니다)`);
    } catch (e) {
      addLog(`주문 업데이트 실패: ${(e as Error).message}`);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">로딩 중...</div>;
  }

  if (!user) {
    return (
      <div className="p-8 text-center space-y-4">
        <p>로그인이 필요합니다.</p>
        <a href="/login" className="inline-block bg-olive text-white px-6 py-2 rounded-lg font-medium">
          로그인 페이지로 이동
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-8">
      <h1 className="text-2xl font-bold">페이백 시스템 테스트</h1>
      
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold">1. 내 정보</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">내 UID:</span> {auth.currentUser?.uid}</div>
          <div><span className="text-gray-500">역할:</span> {user.role}</div>
          <div><span className="text-gray-500">현재 추천인(referredBy):</span> {user.referredBy || '없음'}</div>
          <div><span className="text-gray-500">누적 페이백 잔액:</span> <span className="font-bold text-accent text-lg">{user.paybackBalance?.toLocaleString() || 0}원</span></div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold">2. 추천인 설정 (선택)</h2>
        <p className="text-sm text-gray-500">결제 시 누구에게 페이백을 줄지 설정합니다. (테스트를 위해 본인의 UID를 넣으면 본인에게 페이백이 들어옵니다.)</p>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={targetInfluencerId} 
            onChange={(e) => setTargetInfluencerId(e.target.value)}
            placeholder="인플루언서 UID 입력" 
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
          />
          <button 
            onClick={handleSetReferrer}
            className="bg-olive text-white px-6 py-2 rounded-lg font-medium"
          >
            적용
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold">3. 가상 주문 생성 및 완료</h2>
        <p className="text-sm text-gray-500">100,000원짜리 주문을 만들고 완료 처리하여 5,000원의 페이백이 발생하는지 확인합니다.</p>
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleCreateMockOrder}
              className="bg-gray-800 text-white px-6 py-3 rounded-lg font-medium flex-1"
            >
              1. 10만원 주문 생성 (Pending)
            </button>
            <button 
              onClick={handleCompleteOrder}
              disabled={!orderId || orderStatus === 'completed'}
              className="bg-olive text-white px-6 py-3 rounded-lg font-medium flex-1 disabled:opacity-50"
            >
              2. 주문 완료 처리 (Completed)
            </button>
          </div>
          
          {orderId && (
            <div className="p-4 bg-gray-50 rounded-lg text-sm border border-gray-200">
              현재 주문 ID: <span className="font-mono">{orderId}</span> / 
              상태: <span className={`font-bold ml-1 ${orderStatus === 'completed' ? 'text-green-600' : 'text-orange-500'}`}>{orderStatus}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4 h-64 overflow-y-auto">
        <h2 className="text-sm font-bold text-gray-500 sticky top-0 bg-gray-50 py-1">실행 로그</h2>
        <div className="space-y-2 text-sm font-mono text-gray-700">
          {log.map((msg, i) => (
            <div key={i}>{msg}</div>
          ))}
          {log.length === 0 && <div className="text-gray-400">로그가 없습니다.</div>}
        </div>
      </div>
    </div>
  );
}
