'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { Timestamp } from 'firebase/firestore';

export default function ReviewDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 임시 목업 데이터 렌더링
    const mockProducts: Product[] = [
      {
        id: 'prod-1',
        brandId: 'brand-1',
        name: '올리브 프리미엄 비건 세럼',
        description: '자연 유래 성분 99%',
        price: 32000,
        imageUrl: 'https://via.placeholder.com/300?text=Vegan+Serum',
        sentimentSummary: {
          overallScore: 85,
          positiveRatio: 75,
          negativeRatio: 15,
          wordCloud: ['촉촉해요', '흡수가빠름', '비건', '향이좋아요', '순하다', '트러블없음', '재구매각', '산뜻함'],
          improvementPoints: ['용기가 불편함', '가격이 비쌈', '펌프 고장'],
          lastUpdatedAt: Timestamp.now()
        },
        createdAt: Timestamp.now()
      },
      {
        id: 'prod-2',
        brandId: 'brand-1',
        name: '올리브 모이스처라이징 크림',
        description: '24시간 보습 지속',
        price: 28000,
        imageUrl: 'https://via.placeholder.com/300?text=Moisture+Cream',
        sentimentSummary: {
          overallScore: 65,
          positiveRatio: 45,
          negativeRatio: 40,
          wordCloud: ['보습력', '겨울용', '쫀쫀함'],
          improvementPoints: ['유분기 많음', '무겁다', '트러블 발생'],
          lastUpdatedAt: Timestamp.now()
        },
        createdAt: Timestamp.now()
      }
    ];

    setTimeout(() => {
      setProducts(mockProducts);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) return <div className="text-center py-20 font-pretendard">리뷰 데이터를 분석 중입니다...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 font-pretendard">
      <h1 className="text-2xl font-bold text-olive-dark mb-8">AI 리뷰 분석 대시보드</h1>

      <div className="space-y-12">
        {products.map((product) => {
          const summary = product.sentimentSummary;
          if (!summary) return null;

          return (
            <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center gap-6">
                <img src={product.imageUrl} alt={product.name} className="w-24 h-24 object-cover rounded-xl bg-gray-50" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
                  <p className="text-gray-500 mt-1">{product.description}</p>
                  <p className="text-sm text-gray-400 mt-2">최근 분석: 오늘</p>
                </div>
                
                <div className="ml-auto flex gap-8">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-500 mb-1">AI 긍정 지수</p>
                    <div className="text-3xl font-bold text-olive">{summary.overallScore}<span className="text-lg text-gray-400">/100</span></div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-500 mb-1">긍정 리뷰 비율</p>
                    <div className="text-3xl font-bold text-blue-500">{summary.positiveRatio}<span className="text-lg text-gray-400">%</span></div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-500 mb-1">부정 리뷰 비율</p>
                    <div className="text-3xl font-bold text-red-500">{summary.negativeRatio}<span className="text-lg text-gray-400">%</span></div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 p-6 gap-8 bg-neutral/30">
                {/* 긍정 키워드 워드 클라우드 (단순 뱃지 나열로 구현) */}
                <div>
                  <h3 className="text-lg font-bold text-olive-dark mb-4 flex items-center">
                    <span className="bg-olive/10 text-olive px-2 py-1 rounded-md text-xs mr-2">장점</span>
                    고객들이 자주 언급한 키워드
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {summary.wordCloud.map((word, i) => (
                      <span 
                        key={i} 
                        className="px-4 py-2 rounded-full font-bold"
                        style={{
                          backgroundColor: i < 3 ? '#6B7C3F' : '#D4DBA8',
                          color: i < 3 ? 'white' : '#3D4A22',
                          fontSize: i < 3 ? '1.1rem' : '0.9rem'
                        }}
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 부정 이슈 및 개선 필요 사항 */}
                <div>
                  <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center">
                    <span className="bg-red-100 text-red-600 px-2 py-1 rounded-md text-xs mr-2">개선필요</span>
                    주요 불만 및 이슈 리스트
                  </h3>
                  <ul className="space-y-3">
                    {summary.improvementPoints.map((issue, i) => (
                      <li key={i} className="flex items-start gap-3 bg-white p-3 rounded-xl border border-red-100 shadow-sm">
                        <span className="text-red-500 mt-0.5">⚠️</span>
                        <span className="text-gray-700 font-medium">{issue}</span>
                      </li>
                    ))}
                  </ul>
                  {summary.improvementPoints.length === 0 && (
                    <div className="text-gray-500 italic bg-white p-4 rounded-xl border">발견된 주요 이슈가 없습니다. 완벽하네요! 🎉</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
