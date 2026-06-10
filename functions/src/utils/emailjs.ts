// functions/src/utils/emailjs.ts

export async function sendEmailJSNudge(templateId: string, toEmail: string, message: string) {
  // Extract keys from environment or use hardcoded if not set in functions env
  const serviceId = process.env.EMAILJS_SERVICE_ID || 'service_Anting Gmail';
  const publicKey = process.env.EMAILJS_PUBLIC_KEY || 'obIJwnfu1eIk3rYGH';

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: {
      to_email: toEmail,
      message: message,
    }
  };

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('EmailJS 발송 실패:', response.status, errorText);
    }
  } catch (error) {
    console.error('EmailJS 발송 에러:', error);
  }
}
