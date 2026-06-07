import { Answer, UserType, ResultType } from "@/types";

/**
 * Analyzes the A/B answer pattern of the user to determine their result category.
 * A/B count and positions are used for mapping.
 */
export function analyzeQuizResult(userType: UserType, answers: Answer[]): ResultType {
  const aCount = answers.filter((ans) => ans === "A").length;

  if (userType === "brand") {
    // 5 questions total
    if (aCount >= 4) {
      return "roi_anxiety"; // ROI 불안형 (mostly A)
    } else if (aCount === 3) {
      return "quality_concern"; // 품질 고민형 (balanced, moderate A)
    } else {
      return "operation_burden"; // 운영 부담형 (mostly B, <= 2 A's)
    }
  } else {
    // influencer
    if (aCount >= 4) {
      return "monetization_ready"; // 수익화 준비형
    } else if (aCount === 3) {
      return "content_growth"; // 콘텐츠 성장형
    } else {
      return "beginner"; // 입문 탐색형
    }
  }
}
