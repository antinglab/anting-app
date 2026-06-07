import emailjs from '@emailjs/browser';

// EmailJS 설정값 (직접 입력)
const SERVICE_ID = 'Anting Gmail';
const TEMPLATE_ID = 'template_ldawy7n';
const PUBLIC_KEY = 'obIJwnfu1eIk3rYGH';

// EmailJS 초기화
emailjs.init(PUBLIC_KEY);

// 오픈톡 링크 (기존 링크 유지)
const OPENTALK_URL = 'https://open.kakao.com/o/s2ErNXwi';

const USER_TYPE_LABEL: Record<string, string> = {
  brand: '광고주',
  influencer: '인플루언서',
  unknown: '크루 멤버',
};

const RESULT_TYPE_LABEL: Record<string, string> = {
  roi_anxiety: 'ROI 불안형',
  operation_burden: '운영 부담형',
  quality_concern: '품질 고민형',
  monetization_ready: '수익화 준비형',
  content_growth: '콘텐츠 성장형',
  beginner: '입문 탐색형',
};

interface WelcomeEmailParams {
  name: string;
  email: string;
  userType: string;
  resultType: string;
}

export async function sendWelcomeEmail(
  params: WelcomeEmailParams
): Promise<void> {
  console.log('[EmailJS] 발송 시작 →', params.email);

  const now = new Date().toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  try {
    const result = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_name: params.name,
        to_email: params.email,
        user_type: USER_TYPE_LABEL[params.userType] ?? params.userType,
        result_type: RESULT_TYPE_LABEL[params.resultType] ?? params.resultType,
        join_date: now,
        opentalk_url: OPENTALK_URL,
      },
      PUBLIC_KEY
    );
    console.log('[EmailJS] 발송 성공 ✓', result.status);
  } catch (err) {
    console.error('[EmailJS] 발송 실패:', err);
  }
}
