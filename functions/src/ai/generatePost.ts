import { onCall, HttpsError } from "firebase-functions/v2/https";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const generatePostDraft = onCall({ region: "asia-northeast3" }, async (request) => {
  const { auth, data } = request;

  // Check auth
  if (!auth) {
    throw new HttpsError("unauthenticated", "인증이 필요합니다.");
  }

  const { campaignGuide, productName, requiredPhrases, requiredHashtags } = data;

  if (!campaignGuide || !productName) {
    throw new HttpsError("invalid-argument", "필수 데이터가 누락되었습니다.");
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `당신은 나노인플루언서입니다.
아래 체험단 가이드로 자연스럽고 진정성 있는 리뷰를 작성하세요.

[가이드] ${campaignGuide}
[제품명] ${productName}
[필수문구] ${requiredPhrases || ""}
[필수해시태그] ${requiredHashtags || ""}

규칙:
- 반드시 #광고 또는 #협찬 포함
- 인스타그램: 600자 이내, 이모지 자연스럽게 포함
- 블로그: 800~1000자, 소제목 포함, 구어체
- JSON으로만 응답:
  { "instagram": { "caption": "", "hashtags": [] },
    "blog": { "title": "", "content": "" } }`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    return JSON.parse(responseText);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new HttpsError("internal", "초안 생성에 실패했습니다: " + error.message);
  }
});
