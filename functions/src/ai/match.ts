import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const scoreInfluencerMatch = onCall({ memory: "512MiB" }, async (request) => {
  const { campaignId } = request.data || {};

  if (!campaignId) {
    throw new HttpsError("invalid-argument", "campaignId is required.");
  }

  const db = getFirestore();

  try {
    // 1. Fetch Campaign
    const campaignDoc = await db.collection("campaigns").doc(campaignId).get();
    if (!campaignDoc.exists) {
      throw new HttpsError("not-found", "Campaign not found.");
    }
    const campaign = campaignDoc.data();
    if (!campaign) throw new HttpsError("not-found", "Campaign data is empty.");

    // 2. Fetch all Influencers
    // For large scale, we should optimize this. For now, fetch all or a subset.
    const influencersSnapshot = await db.collection("users").where("role", "==", "influencer").get();
    const influencers = influencersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // 3. Scoring
    const scoredInfluencers = await Promise.all(influencers.map(async (influencer: any) => {
      let score = 0;
      let breakdown: any = {};

      // Category Match (30 pts)
      const infCategories = influencer.categories || [];
      if (infCategories.includes(campaign.category)) {
        score += 30;
        breakdown.category = 30;
      } else {
        breakdown.category = 0;
      }

      // Follower Count Range (20 pts)
      const followerCount = influencer.followerCount || (influencer.channels?.instagram?.followerCount) || 0;
      const minFollowers = campaign.conditions?.minFollowers || 0;
      if (followerCount >= minFollowers) {
        score += 20;
        breakdown.followerCount = 20;
      } else if (followerCount >= minFollowers * 0.8) {
        score += 10;
        breakdown.followerCount = 10;
      } else {
        breakdown.followerCount = 0;
      }

      // Region Match (15 pts)
      const targetRegions = campaign.conditions?.regions || [];
      const infRegion = influencer.region || "";
      if (targetRegions.length === 0 || targetRegions.includes("전국") || targetRegions.some((r: string) => infRegion.includes(r))) {
        score += 15;
        breakdown.region = 15;
      } else {
        breakdown.region = 0;
      }

      // Completion Rate (20 pts) - Mocking for now based on qualityScore
      const qualityScore = influencer.qualityScore || 0; 
      const completionScore = Math.min(20, Math.round((qualityScore / 100) * 20));
      score += completionScore;
      breakdown.completionRate = completionScore;

      // Engagement Rate (15 pts) - Mocking for now
      const engagementScore = 10; // Default 10
      score += engagementScore;
      breakdown.engagementRate = engagementScore;

      // Gemini Vision - Tone fit analysis
      let toneScore = 0;
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const prompt = `Brand Campaign Category: ${campaign.category}. Product: ${campaign.productName}. 
Evaluate the brand tone fit for an influencer with Categories: ${infCategories.join(", ")}. 
Return a single integer score between 0 and 10 based on how well this profile fits the brand category. Output nothing but the number.`;
        
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        toneScore = parseInt(text) || 0;
        if (toneScore > 10) toneScore = 10;
        if (toneScore < 0) toneScore = 0;
      } catch (e) {
        console.error("Gemini Vision Tone Analysis failed:", e);
        toneScore = 5; // Fallback
      }

      score += toneScore;
      breakdown.toneFit = toneScore;

      return {
        influencerId: influencer.id,
        influencerInfo: {
          nickname: influencer.nickname || influencer.name,
          followerCount,
          categories: infCategories,
          region: infRegion,
          profileImageUrl: influencer.profileImageUrl || ""
        },
        score,
        breakdown
      };
    }));

    // Sort by score descending
    scoredInfluencers.sort((a, b) => b.score - a.score);

    // Return top 20
    return { success: true, data: scoredInfluencers.slice(0, 20) };

  } catch (error: any) {
    console.error("scoreInfluencerMatch error:", error);
    throw new HttpsError("internal", error.message);
  }
});
