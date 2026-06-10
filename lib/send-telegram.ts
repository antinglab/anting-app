interface TelegramAlertParams {
  name: string;
  phone: string;
  email: string;
  region: string;
  userType: string;
  resultType: string;
}

const USER_TYPE_LABEL: Record<string, string> = {
  brand: '광고주',
  influencer: '인플루언서',
};

const RESULT_TYPE_LABEL: Record<string, string> = {
  roi_anxiety: 'ROI 불안형',
  operation_burden: '운영 부담형',
  quality_concern: '품질 고민형',
  monetization_ready: '수익화 준비형',
  content_growth: '콘텐츠 성장형',
  beginner: '입문 탐색형',
};

export async function sendTelegramAlert(params: TelegramAlertParams) {
  const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
  const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn('텔레그램 설정 없음 — 알림 건너뜀');
    return;
  }

  const now = new Date().toLocaleString('ko-KR');
  const typeLabel = USER_TYPE_LABEL[params.userType] || params.userType;
  const resultLabel = RESULT_TYPE_LABEL[params.resultType] || params.resultType;

  const message = `
🌿 *새 앤팅크루 가입!*

👤 이름: ${params.name}
📱 유형: ${typeLabel}
🎯 진단유형: ${resultLabel}
📍 지역: ${params.region}
📞 연락처: ${params.phone}
📧 이메일: ${params.email}
🕐 가입일시: ${now}
`.trim();

  try {
    await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      }
    );
    console.log('텔레그램 알림 발송 완료');
  } catch (error) {
    console.error('텔레그램 알림 실패:', error);
    // 알림 실패해도 가입은 완료
  }
}

export async function sendCampaignAlert(campaignTitle: string, brandName: string) {
  const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
  const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) return;

  const message = `📣 새 캠페인: ${campaignTitle} (${brandName})`;

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });
  } catch (error) {
    console.error('새 캠페인 알림 실패:', error);
  }
}

export async function sendContentSubmissionAlert(influencerName: string, campaignTitle: string) {
  const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
  const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) return;

  const message = `📝 콘텐츠 제출: ${influencerName} → ${campaignTitle}`;

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });
  } catch (error) {
    console.error('콘텐츠 제출 알림 실패:', error);
  }
}
