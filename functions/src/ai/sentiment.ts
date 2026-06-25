import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * 3. 리뷰 생성 시 Gemini 감성 분석
 * reviews/{productId}/product_reviews/{reviewId}
 */
export const analyzeReviewSentiment = onDocumentCreated(
  {
    document: "reviews/{productId}/product_reviews/{reviewId}",
    region: "asia-northeast3",
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const review = snapshot.data();
    const productId = event.params.productId;
    const reviewId = event.params.reviewId;
    const reviewText = review.text || '';

    if (!genAI || !reviewText.trim()) {
      console.log(`[analyzeReviewSentiment] Skip: No API Key or empty review (${reviewId})`);
      return;
    }

    const prompt = `아래 상품 리뷰를 분석하여 고객의 감성을 평가하세요.
리뷰 내용: "${reviewText}"

반드시 아래 JSON 포맷으로만 응답해야 합니다. 다른 말은 덧붙이지 마세요.
{
  "sentiment": "positive" | "neutral" | "negative",
  "score": 0~100 사이의 긍정 점수 (정수),
  "keywords": ["주요", "언급된", "긍정적키워드", "최대5개"],
  "issues": ["아쉬운점", "개선필요사항", "최대3개"]
}`;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // JSON 파싱 (마크다운 포맷 제거)
      const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const analysis = JSON.parse(jsonStr);

      const db = getFirestore();
      
      // 1. 리뷰 문서에 분석 결과 추가
      await snapshot.ref.update({
        sentiment: analysis,
        analyzedAt: FieldValue.serverTimestamp()
      });

      // 2. 상품 문서의 sentimentSummary 업데이트 (간단한 버전: Transaction 없이 덮어쓰기/배열 추가)
      // 실제 프로덕션에서는 여러 리뷰가 동시 생성될 수 있으므로 Transaction이 필요하지만 여기서는 간단히 처리
      const productRef = db.collection('products').doc(productId);
      const productSnap = await productRef.get();
      
      if (productSnap.exists) {
        const productData = productSnap.data() || {};
        const currentSummary = productData.sentimentSummary || {
          overallScore: 0,
          positiveCount: 0,
          negativeCount: 0,
          neutralCount: 0,
          totalReviews: 0,
          wordCloud: [],
          improvementPoints: []
        };

        const totalReviews = currentSummary.totalReviews + 1;
        const newScore = Math.round(((currentSummary.overallScore * currentSummary.totalReviews) + analysis.score) / totalReviews);
        
        let posCount = currentSummary.positiveCount || 0;
        let negCount = currentSummary.negativeCount || 0;
        let neuCount = currentSummary.neutralCount || 0;
        
        if (analysis.sentiment === 'positive') posCount++;
        else if (analysis.sentiment === 'negative') negCount++;
        else neuCount++;

        const positiveRatio = Math.round((posCount / totalReviews) * 100);
        const negativeRatio = Math.round((negCount / totalReviews) * 100);

        // 워드 클라우드와 이슈 리스트 병합 (중복 제거 및 최신화)
        const combinedKeywords = Array.from(new Set([...(currentSummary.wordCloud || []), ...analysis.keywords])).slice(0, 20);
        const combinedIssues = Array.from(new Set([...(currentSummary.improvementPoints || []), ...analysis.issues])).slice(0, 10);

        await productRef.update({
          sentimentSummary: {
            overallScore: newScore,
            positiveRatio,
            negativeRatio,
            totalReviews,
            positiveCount: posCount,
            negativeCount: negCount,
            neutralCount: neuCount,
            wordCloud: combinedKeywords,
            improvementPoints: combinedIssues,
            lastUpdatedAt: FieldValue.serverTimestamp()
          }
        });
      }
      
      console.log(`[analyzeReviewSentiment] Success for review ${reviewId}`);
    } catch (error) {
      console.error(`[analyzeReviewSentiment] Error for review ${reviewId}:`, error);
    }
  }
);
