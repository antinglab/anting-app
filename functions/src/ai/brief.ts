import { onCall, HttpsError } from "firebase-functions/v2/https";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const generateBrief = onCall({ memory: "512MiB" }, async (request) => {
  const { productName, category, target, highlights } = request.data || {};

  if (!productName || !category || !target || !highlights) {
    throw new HttpsError("invalid-argument", "productName, category, target, highlights are required.");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `아래 정보로 나노인플루언서 체험단 원고 가이드를 작성하세요.
제품명: ${productName}
카테고리: ${category}
타겟: ${target}
강조 포인트: ${highlights}

항목별로 구체적으로 작성:
- 필수 포함 문구 (배열)
- 금지어 (배열)
- 필수 해시태그 (배열)
- 광고 표시 방법 (문자열)
- 이미지 가이드 (문자열)
- 에디터용 가이드 HTML (문자열, 가이드라인 상세 내역을 html 태그로 예쁘게 작성할 것)

JSON으로 응답. 아래의 형식으로 정확히 반환해:
{
  "requiredPhrases": ["문구1", "문구2"],
  "forbiddenWords": ["단어1", "단어2"],
  "requiredHashtags": ["#해시태그1", "#해시태그2"],
  "adDisclosure": "광고 표시 방법 설명",
  "imageGuide": "이미지 가이드 설명",
  "editorHtml": "<h3>원고 작성 가이드</h3><ul><li>...</li></ul>"
}
`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    // 마크다운 제거 처리
    if (text.startsWith("```json")) {
      text = text.replace(/^```json\n/, "").replace(/\n```$/, "");
    }
    if (text.startsWith("```")) {
      text = text.replace(/^```\n/, "").replace(/\n```$/, "");
    }
    text = text.trim();

    const parsedJson = JSON.parse(text);
    return { success: true, data: parsedJson };

  } catch (error: any) {
    console.error("generateBrief error:", error);
    
    // Mock fallback on error
    return {
      success: true,
      data: {
        requiredPhrases: ["[MOCK] " + productName + " 추천", "[MOCK] 올리브영 품절대란"],
        forbiddenWords: ["[MOCK] 타사 제품 언급"],
        requiredHashtags: ["#추천템", "#" + category],
        adDisclosure: "[MOCK] 본문 맨 앞과 맨 뒤에 #협찬 표기",
        imageGuide: "[MOCK] 제품 사용 전후 비교 사진 필수",
        editorHtml: "<h3>[MOCK] 원고 작성 가이드</h3><p>오류가 발생하여 임시 가이드가 생성되었습니다.</p>"
      },
      isMock: true,
      error: error.message
    };
  }
});
