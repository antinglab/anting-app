import { onCall, HttpsError } from "firebase-functions/v2/https";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const parseGuidelines = onCall({ memory: "512MiB" }, async (request) => {
  const { guidelineText } = request.data || {};

  if (!guidelineText || typeof guidelineText !== "string") {
    throw new HttpsError("invalid-argument", "guidelineText가 누락되었거나 형식이 잘못되었습니다.");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `아래 체험단 원고 가이드를 분석해서
인플루언서가 반드시 지켜야 할 핵심 항목을 추출하세요.

[가이드 원문]
${guidelineText}

JSON 형식으로 응답:
{
  "required_phrases": ["반드시 포함할 문구"],
  "forbidden_words": ["사용 금지 단어"],
  "required_hashtags": ["#필수해시태그"],
  "must_include": ["꼭 해야 할 것"],
  "must_not_include": ["하면 안 되는 것"],
  "ad_disclosure": "#광고 또는 #협찬 필수 여부"
}

반드시 위 형식에 맞는 유효한 JSON 문자열만 반환해주세요. 백틱이나 json 코드 블록 마크다운을 제외하고 순수 JSON 객체만 반환하세요.`;

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

    try {
      const parsedJson = JSON.parse(text);
      return { success: true, data: parsedJson };
    } catch (e) {
      console.error("Failed to parse JSON:", text);
      throw new Error("Gemini가 유효하지 않은 JSON을 반환했습니다.");
    }
  } catch (error: any) {
    console.error("parseGuidelines error:", error);
    
    // 에러 발생 시 모의 데이터 반환 (Mock fallback)
    return {
      success: true,
      data: {
        required_phrases: ["[MOCK] 제품명 언급", "[MOCK] 올리브영 1위"],
        forbidden_words: ["[MOCK] 부작용", "[MOCK] 타사 제품명"],
        required_hashtags: ["#앤팅", "#모의테스트"],
        must_include: ["[MOCK] 얼굴 사용 전후 사진 비교", "[MOCK] 제형을 보여주는 영상"],
        must_not_include: ["[MOCK] 과장된 효과 표현"],
        ad_disclosure: "[MOCK] 제목과 본문 맨 앞에 #협찬 필수 기재"
      },
      isMock: true,
      error: error.message
    };
  }
});
