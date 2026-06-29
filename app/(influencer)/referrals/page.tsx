"use client";

import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";

const db = getFirestore(app);
const auth = getAuth(app);

export default function ReferralsPage() {
  const [userData, setUserData] = useState<any>(null);
  const [referredUsers, setReferredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      auth.onAuthStateChanged(async (user) => {
        if (user) {
          const docRef = doc(db, "users", user.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            setUserData(data);

            // Fetch referred friends
            // Assuming we query 'users' where 'referredBy' == user.uid
            const q = query(collection(db, "users"), where("referredBy", "==", user.uid));
            const querySnapshot = await getDocs(q);
            const friends = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setReferredUsers(friends);
          }
        }
        setLoading(false);
      });
    };
    fetchData();
  }, []);

  const handleCopy = () => {
    if (userData?.referralCode) {
      navigator.clipboard.writeText(userData.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return <div className="p-8 text-center text-olive-gray">로딩 중...</div>;
  if (!userData) return <div className="p-8 text-center text-olive-gray">로그인이 필요합니다.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-olive-dark mb-2 font-['Pretendard']">추천인 프로그램</h1>
      <p className="text-olive-gray mb-8">친구를 초대하고 함께 5,000P 혜택을 받아보세요!</p>

      {/* 내 추천 코드 카드 */}
      <div className="bg-olive text-white p-8 rounded-3xl shadow-md mb-10 flex flex-col md:flex-row justify-between items-center">
        <div>
          <h2 className="text-xl font-bold mb-2">나의 추천 코드</h2>
          <p className="text-olive-pale text-sm mb-4 md:mb-0">
            친구가 가입할 때 이 코드를 입력하고, 첫 캠페인을 완료하면 두 분 모두에게 5,000P를 드립니다!
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 pl-6 rounded-full w-full md:w-auto">
          <span className="font-['DM_Serif_Display'] text-olive-dark text-2xl font-bold tracking-wider">
            {userData.referralCode || "발급 필요"}
          </span>
          <button 
            onClick={handleCopy}
            className="bg-accent text-white px-5 py-3 rounded-full font-bold text-sm hover:bg-yellow-500 transition-colors shrink-0"
          >
            {copied ? "복사됨!" : "복사하기"}
          </button>
        </div>
      </div>

      {/* 추천 현황 */}
      <div className="bg-white rounded-3xl shadow-sm border border-neutral overflow-hidden">
        <div className="p-6 border-b border-neutral flex justify-between items-center">
          <h3 className="font-bold text-lg text-olive-dark">내가 초대한 친구 ({referredUsers.length}명)</h3>
        </div>
        
        {referredUsers.length === 0 ? (
          <div className="p-10 text-center text-olive-gray">
            아직 초대한 친구가 없습니다.<br/>지금 바로 추천 코드를 공유해보세요!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-neutral text-olive-gray text-xs">
                <tr>
                  <th className="p-4 font-semibold">이름(닉네임)</th>
                  <th className="p-4 font-semibold">가입일</th>
                  <th className="p-4 font-semibold">보상 상태</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {referredUsers.map(friend => {
                  const hasCompleted = friend.campaignCompleteCount > 0;
                  const dateStr = friend.createdAt?.toDate?.() 
                    ? friend.createdAt.toDate().toLocaleDateString('ko-KR') 
                    : '-';
                  return (
                    <tr key={friend.id} className="border-b border-neutral last:border-0">
                      <td className="p-4 text-olive-dark font-medium">{friend.name || friend.nickname}</td>
                      <td className="p-4 text-olive-gray">{dateStr}</td>
                      <td className="p-4">
                        {hasCompleted ? (
                          <span className="bg-olive-pale text-olive-dark px-3 py-1 rounded-full text-xs font-bold">
                            지급 완료 (+5,000P)
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold">
                            진행 중 (첫 캠페인 대기)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
