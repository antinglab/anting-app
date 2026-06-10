'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Application } from '@/types';

export default function ContentsReviewPage() {
  const params = useParams();
  const campaignId = params.id as string;

  const [applications, setApplications] = useState<(Application & { nickname?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [revisionReason, setRevisionReason] = useState<Record<string, string>>({});

  useEffect(() => {
    if (campaignId) {
      fetchContents();
    }
  }, [campaignId]);

  const fetchContents = async () => {
    try {
      const q = query(
        collection(db, 'applications'),
        where('campaignId', '==', campaignId),
        // Only fetch those that submitted or were requested revision
        where('status', 'in', ['submitted', 'approved', 'revision_requested'])
      );
      const snap = await getDocs(q);
      const apps = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
      
      const augmentedApps = apps.map((app) => ({
        ...app,
        nickname: `인플루언서_${app.influencerId.slice(-4)}`
      }));

      setApplications(augmentedApps);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (appId: string) => {
    try {
      await updateDoc(doc(db, 'applications', appId), {
        status: 'approved',
        approvedAt: Timestamp.now()
      });
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'approved' } : a));
      alert('콘텐츠가 승인되었습니다.');
    } catch (error) {
      console.error(error);
      alert('승인 처리 중 오류가 발생했습니다.');
    }
  };

  const handleRevisionRequest = async (appId: string) => {
    const reason = revisionReason[appId];
    if (!reason || reason.trim() === '') {
      alert('수정 요청 사유를 입력해주세요.');
      return;
    }
    try {
      await updateDoc(doc(db, 'applications', appId), {
        status: 'revision_requested',
        revisionReason: reason
      });
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'revision_requested', revisionReason: reason } : a));
      alert('수정 요청이 완료되었습니다.');
    } catch (error) {
      console.error(error);
      alert('요청 처리 중 오류가 발생했습니다.');
    }
  };

  if (loading) return <div className="text-center py-20">로딩 중...</div>;

  const submittedApps = applications.filter(a => a.status === 'submitted');
  const otherApps = applications.filter(a => a.status !== 'submitted');

  return (
    <div className="max-w-6xl mx-auto p-6 font-pretendard">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-olive-dark">콘텐츠 검수</h1>
        <p className="text-sm text-olive-gray mt-1">인플루언서가 제출한 콘텐츠를 확인하고 승인 또는 수정 요청을 진행하세요.</p>
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="text-lg font-bold text-olive-dark mb-4">새로 제출된 콘텐츠 ({submittedApps.length})</h2>
          {submittedApps.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400 border border-gray-100 shadow-sm">
              새로 제출된 콘텐츠가 없습니다.
            </div>
          ) : (
            <div className="grid gap-6">
              {submittedApps.map(app => (
                <div key={app.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-olive-dark">{app.nickname}</span>
                      <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded uppercase font-semibold">
                        {app.contentPlatform}
                      </span>
                    </div>
                    <div className="mb-4">
                      <a href={app.contentUrl} target="_blank" rel="noreferrer" className="text-olive hover:underline font-medium break-all">
                        {app.contentUrl}
                      </a>
                    </div>
                    <div className="text-xs text-gray-400">
                      제출일: {app.submittedAt ? app.submittedAt.toDate().toLocaleString() : '-'}
                    </div>
                  </div>
                  
                  <div className="md:w-72 bg-neutral p-4 rounded-xl flex flex-col gap-3">
                    <button onClick={() => handleApprove(app.id)} className="w-full bg-olive text-white py-2 rounded-lg font-bold hover:bg-olive-dark transition-colors">
                      승인하기
                    </button>
                    <div className="h-px bg-gray-200 w-full my-1"></div>
                    <div>
                      <textarea
                        placeholder="수정 요청 사유 입력"
                        className="w-full text-sm border-gray-300 rounded-lg p-2 focus:ring-olive border mb-2 h-20"
                        value={revisionReason[app.id] || ''}
                        onChange={(e) => setRevisionReason(prev => ({ ...prev, [app.id]: e.target.value }))}
                      />
                      <button onClick={() => handleRevisionRequest(app.id)} className="w-full bg-white border border-olive text-olive py-2 rounded-lg font-semibold hover:bg-olive hover:text-white transition-colors text-sm">
                        수정 요청하기
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-bold text-olive-dark mb-4">처리 완료 ({otherApps.length})</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral text-olive-gray text-sm border-b border-gray-100">
                  <th className="px-6 py-4 font-medium">인플루언서</th>
                  <th className="px-6 py-4 font-medium">콘텐츠 링크</th>
                  <th className="px-6 py-4 font-medium">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {otherApps.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-400">처리 완료된 내역이 없습니다.</td>
                  </tr>
                ) : (
                  otherApps.map(app => (
                    <tr key={app.id} className="hover:bg-neutral/30">
                      <td className="px-6 py-4 font-medium text-olive-dark">{app.nickname}</td>
                      <td className="px-6 py-4">
                        <a href={app.contentUrl} target="_blank" rel="noreferrer" className="text-sm text-olive hover:underline truncate inline-block max-w-[200px] md:max-w-[400px]">
                          {app.contentUrl}
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        {app.status === 'approved' ? (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">승인 완료</span>
                        ) : (
                          <div className="text-xs">
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full font-medium">수정 대기중</span>
                            <div className="text-gray-500 mt-1 line-clamp-1">{app.revisionReason}</div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}


