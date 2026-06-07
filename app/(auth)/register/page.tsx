'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerWithEmail, RegisterData } from '@/lib/auth';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 폼 상태
  const [formData, setFormData] = useState<Partial<RegisterData>>({
    role: 'influencer',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await registerWithEmail(formData as RegisterData);
      
      // 가입 성공 시 대시보드로 이동
      if (formData.role === 'brand') {
        router.push('/brand/dashboard');
      } else {
        router.push('/influencer/dashboard');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('회원가입에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-center mb-6 text-olive-dark">회원가입</h1>
        
        {/* Step Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className={`w-3 h-3 rounded-full ${step >= num ? 'bg-olive' : 'bg-gray-200'}`}
            />
          ))}
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <form onSubmit={step === 3 ? handleSubmit : handleNext} className="flex flex-col gap-4">
          
          {/* Step 1: 역할 선택 */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold">어떤 회원으로 가입하시나요?</h2>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, role: 'influencer' }))}
                  className={`flex-1 p-4 rounded-xl border-2 ${
                    formData.role === 'influencer' ? 'border-olive bg-olive-pale' : 'border-gray-200'
                  }`}
                >
                  인플루언서
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, role: 'brand' }))}
                  className={`flex-1 p-4 rounded-xl border-2 ${
                    formData.role === 'brand' ? 'border-olive bg-olive-pale' : 'border-gray-200'
                  }`}
                >
                  브랜드(광고주)
                </button>
              </div>
            </div>
          )}

          {/* Step 2: 계정 기본 정보 */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold">계정 정보를 입력해주세요</h2>
              <input
                type="email"
                name="email"
                placeholder="이메일"
                value={formData.email || ''}
                onChange={handleChange}
                className="border border-olive rounded-xl p-3 focus:ring-olive outline-none"
                required
              />
              <input
                type="password"
                name="password"
                placeholder="비밀번호"
                value={formData.password || ''}
                onChange={handleChange}
                className="border border-olive rounded-xl p-3 focus:ring-olive outline-none"
                required
              />
              <input
                type="text"
                name="name"
                placeholder="이름 (실명)"
                value={formData.name || ''}
                onChange={handleChange}
                className="border border-olive rounded-xl p-3 focus:ring-olive outline-none"
                required
              />
              <input
                type="tel"
                name="phone"
                placeholder="전화번호 (- 없이 입력)"
                value={formData.phone || ''}
                onChange={handleChange}
                className="border border-olive rounded-xl p-3 focus:ring-olive outline-none"
                required
              />
            </div>
          )}

          {/* Step 3: 역할별 추가 정보 */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold">추가 정보를 입력해주세요</h2>
              
              {formData.role === 'brand' ? (
                <>
                  <input
                    type="text"
                    name="companyName"
                    placeholder="회사명"
                    value={formData.companyName || ''}
                    onChange={handleChange}
                    className="border border-olive rounded-xl p-3 focus:ring-olive outline-none"
                    required
                  />
                  <input
                    type="text"
                    name="businessNumber"
                    placeholder="사업자번호"
                    value={formData.businessNumber || ''}
                    onChange={handleChange}
                    className="border border-olive rounded-xl p-3 focus:ring-olive outline-none"
                    required
                  />
                  {/* 여러 카테고리를 텍스트로 임시로 받음 */}
                  <input
                    type="text"
                    name="categories"
                    placeholder="관심 카테고리 (쉼표로 구분)"
                    onChange={(e) => setFormData(prev => ({ ...prev, categories: e.target.value.split(',').map(s => s.trim()) }))}
                    className="border border-olive rounded-xl p-3 focus:ring-olive outline-none"
                  />
                </>
              ) : (
                <>
                  <input
                    type="text"
                    name="nickname"
                    placeholder="활동 닉네임"
                    value={formData.nickname || ''}
                    onChange={handleChange}
                    className="border border-olive rounded-xl p-3 focus:ring-olive outline-none"
                    required
                  />
                  <input
                    type="text"
                    name="instagramHandle"
                    placeholder="인스타그램 아이디 (@ 제외)"
                    value={formData.instagramHandle || ''}
                    onChange={handleChange}
                    className="border border-olive rounded-xl p-3 focus:ring-olive outline-none"
                  />
                  <input
                    type="number"
                    name="followerCount"
                    placeholder="총 팔로워 수"
                    value={formData.followerCount || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, followerCount: parseInt(e.target.value) }))}
                    className="border border-olive rounded-xl p-3 focus:ring-olive outline-none"
                  />
                  <input
                    type="text"
                    name="region"
                    placeholder="주요 활동 지역"
                    value={formData.region || ''}
                    onChange={handleChange}
                    className="border border-olive rounded-xl p-3 focus:ring-olive outline-none"
                  />
                  <input
                    type="text"
                    name="categories"
                    placeholder="관심 카테고리 (쉼표로 구분)"
                    onChange={(e) => setFormData(prev => ({ ...prev, categories: e.target.value.split(',').map(s => s.trim()) }))}
                    className="border border-olive rounded-xl p-3 focus:ring-olive outline-none"
                  />
                </>
              )}
            </div>
          )}

          <div className="flex gap-4 mt-6">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="flex-1 py-3 px-4 border border-olive text-olive rounded-full hover:bg-olive-pale transition"
              >
                이전
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-3 px-4 bg-olive text-white rounded-full hover:bg-olive-light transition ${loading ? 'opacity-50' : ''}`}
            >
              {step === 3 ? (loading ? '가입 중...' : '완료') : '다음'}
            </button>
          </div>
        </form>

        {step === 1 && (
          <div className="mt-6 text-center text-sm text-olive-gray">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-olive font-bold hover:underline">
              로그인
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
