'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { crewMemberSchema } from '@/lib/validations';
import { CrewMemberForm } from '@/types';
import { Check, Share2, Home } from 'lucide-react';
import Link from 'next/link';
import { sendWelcomeEmail } from '@/lib/send-welcome';
import { sendTelegramAlert } from '@/lib/send-telegram';

const REGIONS = [
  '서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', 
  '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
];

export default function JoinForm() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  const userType = searchParams.get('type');
  const resultType = searchParams.get('result');

  const {
    register,
    handleSubmit: handleFormSubmit,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm<CrewMemberForm>({
    resolver: zodResolver(crewMemberSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      birthDate: '',
      gender: 'none',
      phone: '',
      email: '',
      region: ''
    }
  });

  const phoneValue = watch('phone');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    let formatted = raw;
    if (raw.length > 3 && raw.length <= 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
    } else if (raw.length > 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
    }
    setValue('phone', formatted, { shouldValidate: true });
  };

  const handleSubmit = async (data: CrewMemberForm) => {
    try {
      setIsLoading(true);
      await addDoc(collection(db, 'crew_members'), {
        name: data.name,
        birthDate: data.birthDate,
        gender: data.gender,
        phone: data.phone,
        email: data.email,
        region: data.region,
        userType: userType || 'unknown',
        resultType: resultType || 'unknown',
        createdAt: serverTimestamp(),
        source: 'mvp_beta',
      });
      
      // 환영 이메일 발송
      await sendWelcomeEmail({
        name: data.name,
        email: data.email,
        userType: userType ?? 'unknown',
        resultType: resultType ?? 'unknown',
      });

      // 텔레그램 관리자 알림 (실패해도 가입 완료)
      sendTelegramAlert({
        name: data.name,
        phone: data.phone,
        email: data.email,
        region: data.region,
        userType: userType || 'unknown',
        resultType: resultType || 'unknown',
      });

      setIsComplete(true);
    } catch (error) {
      console.error('가입 저장 실패:', error);
      alert('가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/landing`;
    navigator.clipboard.writeText(shareUrl);
    alert('앤팅 링크가 복사되었습니다! 친구들에게 공유해 보세요.');
  };

  if (isComplete) {
    return (
      <div className="max-w-xl mx-auto w-full text-center space-y-8 animate-fade-in py-12">
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes popIn {
            0% { transform: scale(0.6); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          .animate-pop-in {
            animation: popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}} />
        
        <div className="flex flex-col items-center space-y-6">
          <div className="w-20 h-20 bg-accent text-olive-dark rounded-full flex items-center justify-center shadow-lg animate-pop-in">
            <Check className="w-10 h-10 stroke-[3]" />
          </div>
          
          <h2 className="text-3xl font-extrabold text-olive-dark tracking-tight leading-tight">
            앤팅크루에 오신 걸 환영해요! 🎉
          </h2>
          
          <p className="text-olive-gray text-base max-w-sm mx-auto font-light leading-relaxed">
            빠른 시일 내에 앤팅 서비스 오픈 소식을 알려드릴게요.
          </p>
        </div>

        <div className="space-y-4 pt-6 max-w-sm mx-auto">
          <button
            onClick={handleShare}
            className="w-full bg-olive text-white font-bold rounded-full h-14 flex items-center justify-center gap-2 hover:bg-olive-dark transition-all duration-300 shadow-md"
          >
            <Share2 className="w-5 h-5" />
            친구에게 앤팅 알리기
          </button>
          
          <Link
            href="/landing"
            className="w-full border-2 border-olive text-olive font-bold rounded-full h-14 flex items-center justify-center gap-2 hover:bg-olive hover:text-white transition-all duration-300"
          >
            <Home className="w-5 h-5" />
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const genderValue = watch('gender');

  return (
    <div className="max-w-xl mx-auto w-full bg-white rounded-[24px] shadow-[0_4px_24px_rgba(107,124,63,0.12)] border border-olive/10 overflow-hidden">
      <div className="bg-olive py-6 px-6 text-center">
        <h2 className="text-xl font-bold text-white tracking-wide">앤팅크루 가입</h2>
      </div>

      <div className="p-8 md:p-10 space-y-8">
        <div className="text-center">
          <h3 className="text-lg font-bold text-olive">기본 정보만 입력하면 가입 완료!</h3>
          <p className="text-xs text-olive-gray mt-1">입력하신 정보는 오픈 소식 알림 및 혜택 제공에만 사용됩니다.</p>
        </div>

        <form onSubmit={handleFormSubmit(handleSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-olive-dark block">이름</label>
            <input
              type="text"
              placeholder="홍길동"
              {...register('name')}
              className="w-full px-4 py-3 border border-olive/30 rounded-xl focus:ring-2 focus:ring-olive focus:border-transparent outline-none transition-all text-sm"
            />
            {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-olive-dark block">생년월일</label>
            <input
              type="date"
              {...register('birthDate')}
              className="w-full px-4 py-3 border border-olive/30 rounded-xl focus:ring-2 focus:ring-olive focus:border-transparent outline-none transition-all text-sm text-olive-dark"
            />
            {errors.birthDate && <p className="text-xs text-red-500 font-medium">{errors.birthDate.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-olive-dark block">성별</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setValue('gender', 'male', { shouldValidate: true })}
                className={`flex-1 py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                  genderValue === 'male'
                    ? 'bg-olive border-olive text-white'
                    : 'bg-white border-olive/30 text-olive-dark hover:bg-olive-pale/20'
                }`}
              >
                남성
              </button>
              <button
                type="button"
                onClick={() => setValue('gender', 'female', { shouldValidate: true })}
                className={`flex-1 py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                  genderValue === 'female'
                    ? 'bg-olive border-olive text-white'
                    : 'bg-white border-olive/30 text-olive-dark hover:bg-olive-pale/20'
                }`}
              >
                여성
              </button>
              <button
                type="button"
                onClick={() => setValue('gender', 'none', { shouldValidate: true })}
                className={`flex-1 py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                  genderValue === 'none'
                    ? 'bg-olive border-olive text-white'
                    : 'bg-white border-olive/30 text-olive-dark hover:bg-olive-pale/20'
                }`}
              >
                선택안함
              </button>
            </div>
            {errors.gender && <p className="text-xs text-red-500 font-medium">{errors.gender.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-olive-dark block">연락처</label>
            <input
              type="tel"
              placeholder="010-0000-0000"
              value={phoneValue}
              onChange={handlePhoneChange}
              className="w-full px-4 py-3 border border-olive/30 rounded-xl focus:ring-2 focus:ring-olive focus:border-transparent outline-none transition-all text-sm"
            />
            {errors.phone && <p className="text-xs text-red-500 font-medium">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-olive-dark block">이메일 주소</label>
            <input
              type="email"
              placeholder="example@anting.com"
              {...register('email')}
              className="w-full px-4 py-3 border border-olive/30 rounded-xl focus:ring-2 focus:ring-olive focus:border-transparent outline-none transition-all text-sm"
            />
            {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-olive-dark block">거주 지역</label>
            <select
              {...register('region')}
              className="w-full px-4 py-3 border border-olive/30 rounded-xl focus:ring-2 focus:ring-olive focus:border-transparent outline-none transition-all text-sm bg-white text-olive-dark"
            >
              <option value="">지역을 선택해 주세요</option>
              {REGIONS.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
            {errors.region && <p className="text-xs text-red-500 font-medium">{errors.region.message}</p>}
          </div>

          <button
            type="submit"
            disabled={!isValid || isLoading}
            className={`w-full font-bold rounded-full h-14 flex items-center justify-center gap-2 transition-all duration-300 shadow-md ${
              !isValid || isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-olive text-white hover:bg-olive-dark cursor-pointer'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                가입 중...
              </span>
            ) : (
              <span>앤팅크루 합류하기 🌿</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
