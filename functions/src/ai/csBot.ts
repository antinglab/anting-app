import { onCall, HttpsError } from "firebase-functions/v2/https";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const SYSTEM_PROMPT = `당신은 앤팅 플랫폼의 친절한 CS 담당자입니다.
아래 FAQ를 바탕으로 사용자 질문에 답변하세요.
브랜드 질문: 캠페인 등록, 선발, 결제
인플루언서 질문: 신청, 포인트, 코드
모르는 내용: "담당자에게 연결해드릴게요" 후 이메일 안내

해결 불가 시: "contact@anting.kr 또는 오픈톡으로 문의해주세요"를 반드시 안내해주세요.`;

export const askGemini = onCall(async (request) => {
  const { question } = request.data || {};

  if (!question) {
    throw new HttpsError("invalid-argument", "질문이 필요합니다.");
  }

  if (!genAI) {
    console.error("GEMINI_API_KEY is not set.");
    throw new HttpsError("internal", "AI 서비스 설정 오류입니다.");
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContent(question);
    const text = result.response.text();

    return { answer: text };
  } catch (error: any) {
    console.error("askGemini error:", error);
    throw new HttpsError("internal", "답변 생성 중 오류가 발생했습니다.");
  }
});
