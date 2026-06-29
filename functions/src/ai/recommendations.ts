import { onCall, HttpsError } from "firebase-functions/v2/https";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const getPersonalizedRecommendations = onCall({ memory: "512MiB" }, async (request) => {
  const { role, profile, recentActivity, availableCampaigns, pastPerformance } = request.data || {};

  if (!role) {
    throw new HttpsError("invalid-argument", "role is required (influencer or brand).");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    if (role === "influencer") {
      const prompt = `아래 인플루언서 프로필과 활동 이력을 분석해서 가장 적합한 캠페인 3개를 추천하세요.
프로필: ${JSON.stringify(profile)}
최근 활동: ${JSON.stringify(recentActivity)}
후보 캠페인: ${JSON.stringify(availableCampaigns)}
반드시 아래 JSON 형식으로만 응답하세요:
{ "recommended": ["campaignId1", "campaignId2", "campaignId3"], "reasons": ["reason1", "reason2", "reason3"] }`;
      
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(jsonStr);
      return { success: true, data: parsed };
      
    } else if (role === "brand") {
      const prompt = `이전 캠페인 성과를 분석해서 다음 캠페인을 제안하세요.
이전 성과: ${JSON.stringify(pastPerformance)}
반드시 아래 JSON 형식으로만 응답하세요:
{ "suggested_category": "", "recommended_budget": 0, "target_influencer_count": 0, "key_strategy": "" }`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(jsonStr);
      return { success: true, data: parsed };
    } else {
      throw new HttpsError("invalid-argument", "Invalid role");
    }
  } catch (error: any) {
    console.error("getPersonalizedRecommendations error:", error);
    throw new HttpsError("internal", error.message);
  }
});
