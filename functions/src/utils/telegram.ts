export async function sendTelegramMessage(text: string) {
  // Use environment variables for bot token and chat ID
  const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID || process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn("텔레그램 설정이 없어 알림을 건너뜁니다.");
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });
    
    if (!response.ok) {
      console.error("텔레그램 발송 실패:", await response.text());
    }
  } catch (error) {
    console.error("텔레그램 발송 중 오류:", error);
  }
}
