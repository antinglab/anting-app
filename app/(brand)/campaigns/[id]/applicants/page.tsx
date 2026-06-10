'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Application, ApplicationStatus } from '@/types';
import * as XLSX from 'xlsx';

export default function ApplicantsManagePage() {
  const params = useParams();
  const campaignId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [applications, setApplications] = useState<(Application & { nickname?: string, followerCount?: number, region?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (campaignId) {
      fetchApplicants();
    }
  }, [campaignId]);

  const fetchApplicants = async () => {
    try {
      const q = query(collection(db, 'applications'), where('campaignId', '==', campaignId));
      const snap = await getDocs(q);
      const apps = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
      
      // MOCK: In a real app we would fetch the influencer profile here to get nickname, etc.
      // For demonstration, we just augment the objects with mock data.
      const augmentedApps = apps.map((app, index) => ({
        ...app,
        nickname: `인플루언서_${index + 1}`,
        followerCount: 5000 + (index * 1000),
        region: index % 2 === 0 ? '서울' : '부산'
      }));

      setApplications(augmentedApps);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appId: string, status: ApplicationStatus) => {
    try {
      await updateDoc(doc(db, 'applications', appId), { status });
      setApplications(prev => prev.map(app => app.id === appId ? { ...app, status } : app));
    } catch (error) {
      console.error(error);
      alert('상태 업데이트에 실패했습니다.');
    }
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as Record<string, string>[];

        // Expected Columns: 인플루언서ID, 택배사, 운송장번호
        let updatedCount = 0;
        for (const row of json) {
          const infId = row['인플루언서ID'];
          const carrier = row['택배사'];
          const trackingNumber = row['운송장번호'];

          if (infId && carrier && trackingNumber) {
            // Find application
            const app = applications.find(a => a.influencerId === infId);
            if (app) {
              await updateDoc(doc(db, 'applications', app.id), {
                status: 'delivered',
                carrier,
                trackingNumber
              });
              updatedCount++;
            }
          }
        }
        alert(`${updatedCount}건의 배송 정보가 업데이트 되었습니다.`);
        fetchApplicants();
      } catch (error) {
        console.error(error);
        alert('엑셀 처리 중 오류가 발생했습니다.');
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  if (loading) return <div className="text-center py-20">로딩 중...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 font-pretendard">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-olive-dark">신청자 관리</h1>
          <p className="text-sm text-olive-gray mt-1">캠페인에 지원한 인플루언서를 선발하고 배송 정보를 등록하세요.</p>
        </div>
        <div>
          <input
            type="file"
            accept=".xlsx, .xls"
            className="hidden"
            ref={fileInputRef}
            onChange={handleExcelUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-accent text-olive-dark px-4 py-2 rounded-lg font-semibold text-sm hover:bg-white hover:text-olive shadow-sm transition-colors"
          >
            {uploading ? '처리 중...' : '배송 정보 엑셀 업로드'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral text-olive-gray text-sm border-b border-gray-100">
              <th className="px-6 py-4 font-medium">인플루언서</th>
              <th className="px-6 py-4 font-medium">지역</th>
              <th className="px-6 py-4 font-medium">신청일</th>
              <th className="px-6 py-4 font-medium">상태</th>
              <th className="px-6 py-4 font-medium text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {applications.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">아직 신청자가 없습니다.</td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr key={app.id} className="hover:bg-neutral/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-olive-dark">{app.nickname}</div>
                    <div className="text-xs text-olive-gray">팔로워 {app.followerCount?.toLocaleString()}명 · ID: {app.influencerId}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">{app.region}</td>
                  <td className="px-6 py-4 text-sm text-olive-gray">
                    {app.createdAt ? app.createdAt.toDate().toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      app.status === 'pending' ? 'bg-gray-100 text-gray-600' :
                      app.status === 'selected' ? 'bg-blue-100 text-blue-600' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-600' :
                      app.status === 'delivered' ? 'bg-orange-100 text-orange-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {app.status === 'pending' ? '대기중' :
                       app.status === 'selected' ? '선발됨' :
                       app.status === 'rejected' ? '탈락' :
                       app.status === 'delivered' ? '배송됨' : app.status}
                    </span>
                    {app.trackingNumber && (
                      <div className="text-xs text-gray-500 mt-1">{app.carrier} {app.trackingNumber}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {app.status === 'pending' && (
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => handleUpdateStatus(app.id, 'selected')} className="text-xs px-3 py-1 bg-olive text-white rounded hover:bg-olive-dark">선발</button>
                        <button onClick={() => handleUpdateStatus(app.id, 'rejected')} className="text-xs px-3 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300">탈락</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


