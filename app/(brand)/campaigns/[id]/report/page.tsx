'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { Campaign, Application } from '@/types';
import { Download, ArrowLeft, BarChart2, Users, Heart, MessageCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface InfluencerInsight {
  id: string;
  influencerId: string;
  impressions: number;
  likes: number;
  comments: number;
  saves: number;
  reach: number;
  collectedAt: string;
}

export default function CampaignReportPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params?.id as string;
  const reportRef = useRef<HTMLDivElement>(null);

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [insights, setInsights] = useState<InfluencerInsight[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!campaignId) return;

    const fetchData = async () => {
      try {
        // 1. Fetch Campaign
        const docRef = doc(db, 'campaigns', campaignId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCampaign({ id: docSnap.id, ...docSnap.data() } as Campaign);
        }

        // 2. Fetch Applications for this campaign
        const appsQuery = query(collection(db, 'applications'), where('campaignId', '==', campaignId));
        const appsSnap = await getDocs(appsQuery);
        const appsData = appsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Application[];
        setApplications(appsData);

        // 3. Fetch Insights
        const insightsRef = collection(db, `campaign_insights/${campaignId}/influencers`);
        const insightsSnap = await getDocs(insightsRef);
        const insightsData = insightsSnap.docs.map(d => ({
          id: d.id,
          influencerId: d.id,
          ...d.data()
        })) as InfluencerInsight[];
        setInsights(insightsData);
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [campaignId]);

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // 고해상도
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`캠페인_성과리포트_${campaign?.title || campaignId}.pdf`);
    } catch (error) {
      console.error('PDF Download error:', error);
      alert('PDF 다운로드 중 오류가 발생했습니다.');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-olive-gray">데이터를 불러오는 중입니다...</div>;
  }

  if (!campaign) {
    return <div className="p-8 text-center text-red-500">캠페인을 찾을 수 없습니다.</div>;
  }

  // 통계 계산
  const totalImpressions = insights.reduce((sum, item) => sum + item.impressions, 0);
  
  // 인게이지먼트율 = (좋아요 + 댓글 + 저장) / 노출수 * 100
  const totalInteractions = insights.reduce((sum, item) => sum + item.likes + item.comments + item.saves, 0);
  const avgEngagementRate = totalImpressions > 0 ? ((totalInteractions / totalImpressions) * 100).toFixed(2) : '0.00';
  
  const completedCount = applications.filter(a => a.status === 'approved' || a.status === 'submitted').length;
  const targetCount = campaign.recruitCount || 1;
  const completionRate = ((completedCount / targetCount) * 100).toFixed(1);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-olive-gray hover:text-olive transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          뒤로 가기
        </button>
        <button 
          onClick={handleDownloadPdf}
          className="bg-olive text-white px-6 py-2.5 rounded-full font-bold flex items-center gap-2 hover:bg-olive-dark transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          PDF 다운로드
        </button>
      </div>

      {/* Report Content to be printed */}
      <div ref={reportRef} className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-olive/10 space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-4 pb-8 border-b border-gray-100">
          <h1 className="text-3xl font-extrabold text-olive-dark">캠페인 성과 리포트</h1>
          <h2 className="text-xl font-bold text-olive">{campaign.title}</h2>
          <p className="text-olive-gray">기간: {new Date(campaign.createdAt.toDate()).toLocaleDateString()} ~ {campaign.deadline ? new Date(campaign.deadline.toDate()).toLocaleDateString() : '진행중'}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-olive-pale/30 rounded-2xl p-6 text-center space-y-2 border border-olive/10">
            <div className="flex items-center justify-center gap-2 text-olive-dark font-bold mb-4">
              <BarChart2 className="w-5 h-5 text-olive" />
              총 노출수
            </div>
            <p className="text-4xl font-extrabold text-olive-dark">{totalImpressions.toLocaleString()}</p>
            <p className="text-sm text-olive-gray">캠페인 전체 노출 합계</p>
          </div>
          
          <div className="bg-olive-pale/30 rounded-2xl p-6 text-center space-y-2 border border-olive/10">
            <div className="flex items-center justify-center gap-2 text-olive-dark font-bold mb-4">
              <Heart className="w-5 h-5 text-pink-500" />
              평균 인게이지먼트율
            </div>
            <p className="text-4xl font-extrabold text-olive-dark">{avgEngagementRate}%</p>
            <p className="text-sm text-olive-gray">(좋아요+댓글+저장) / 노출수</p>
          </div>

          <div className="bg-olive-pale/30 rounded-2xl p-6 text-center space-y-2 border border-olive/10">
            <div className="flex items-center justify-center gap-2 text-olive-dark font-bold mb-4">
              <Users className="w-5 h-5 text-blue-500" />
              미션 완료율
            </div>
            <p className="text-4xl font-extrabold text-olive-dark">{completionRate}%</p>
            <p className="text-sm text-olive-gray">{completedCount}명 완료 / {targetCount}명 모집</p>
          </div>
        </div>

        {/* Detailed Stats */}
        <div>
          <h3 className="text-xl font-bold text-olive-dark mb-6 flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-olive" />
            인플루언서별 상세 성과
          </h3>
          
          {insights.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-8 text-center text-gray-500">
              아직 수집된 성과 데이터가 없습니다. (완료 후 D+3, D+7에 집계됩니다)
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-bold">
                  <tr>
                    <th className="px-6 py-4">인플루언서 ID</th>
                    <th className="px-6 py-4 text-right">노출수</th>
                    <th className="px-6 py-4 text-right">도달수</th>
                    <th className="px-6 py-4 text-right">좋아요</th>
                    <th className="px-6 py-4 text-right">댓글</th>
                    <th className="px-6 py-4 text-right">저장</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {insights.map((insight) => (
                    <tr key={insight.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-olive-dark">{insight.influencerId.substring(0, 8)}...</td>
                      <td className="px-6 py-4 text-right font-semibold">{insight.impressions.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">{insight.reach.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">{insight.likes.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">{insight.comments.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">{insight.saves.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-gray-100 text-center flex flex-col items-center gap-2">
          <div className="font-dm-serif text-2xl text-olive/30 font-bold tracking-widest">ANTING</div>
          <p className="text-xs text-gray-400">본 리포트는 앤팅(Anting) 플랫폼에서 제공하는 성과 데이터입니다.</p>
        </div>
      </div>
    </div>
  );
}
