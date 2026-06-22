import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

// Gemini API 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const generateVideoScript = onCall({ memory: "512MiB" }, async (request) => {
  const { productName, theme } = request.data || {};

  if (!productName || !theme) {
    throw new HttpsError("invalid-argument", "productName과 theme는 필수입니다.");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `아래 제품 정보로 15초 SNS 릴스/쇼츠 스크립트를 작성하세요.
[제품명] ${productName}
[캠페인 분위기] ${theme}
[슬로건] 최대 20자

출력 형식 (JSON):
{
  "slogan": "메인 문구",
  "scenes": [
    { "second": "0-5", "visual": "화면 설명", "text": "자막" },
    { "second": "5-10", "visual": "", "text": "" },
    { "second": "10-15", "visual": "", "text": "" }
  ],
  "hashtags": ["#해시태그"]
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
      const scriptJson = JSON.parse(text);
      return { success: true, script: scriptJson };
    } catch (e) {
      console.error("Failed to parse JSON:", text);
      throw new Error("Gemini가 유효하지 않은 JSON을 반환했습니다.");
    }
  } catch (error: any) {
    console.error("generateVideoScript error:", error);
    // 에러 발생 시 모의 데이터 반환 (Mock fallback)
    return {
      success: true,
      script: {
        slogan: `[MOCK] ${productName}와 함께하는 완벽한 순간`,
        scenes: [
          { second: "0-5", visual: "제품이 자연스럽게 등장하는 모습", text: "놀라운 변화의 시작" },
          { second: "5-10", visual: "사용 중인 모습 (줌인)", text: `${theme} 무드로 연출` },
          { second: "10-15", visual: "마무리 로고와 슬로건", text: "지금 바로 경험해보세요" }
        ],
        hashtags: ["#앤팅", "#제품테스트", "#릴스", "#모의데이터"]
      },
      isMock: true,
      error: error.message
    };
  }
});

export const generateVideo = onCall({ memory: "1GiB" }, async (request) => {
  const { productImages, script, bgmStyle, duration, campaignId } = request.data || {};

  if (!productImages || productImages.length === 0 || !script || !campaignId) {
    throw new HttpsError("invalid-argument", "필수 파라미터가 누락되었습니다.");
  }

  const db = admin.firestore();
  const apiKey = process.env.CREATOMATE_API_KEY;
  const gcpProject = process.env.GCLOUD_PROJECT || "anting-app-0001";
  const webhookUrl = `https://us-central1-${gcpProject}.cloudfunctions.net/creatomateWebhook`;

  // Firestore에 job 문서 생성
  const jobRef = db.collection("video_jobs").doc();
  const jobId = jobRef.id;

  await jobRef.set({
    campaignId,
    status: "processing",
    progress: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    bgmStyle,
    duration,
  });

  if (!apiKey) {
    console.warn("CREATOMATE_API_KEY가 없습니다. 5초 뒤에 모의 완료 처리합니다.");
    // 모의 처리: 5초 뒤 webhook을 흉내내는 로직 (비동기 처리)
    setTimeout(async () => {
      const mockVideoUrl = "https://www.w3schools.com/html/mov_bbb.mp4"; // 샘플 비디오
      await jobRef.update({
        status: "succeeded",
        progress: 100,
        videoUrl: mockVideoUrl,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      // 텔레그램 모의 알림은 생략 (또는 직접 호출 가능)
      if (process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN) {
         try {
           const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
           const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;
           await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
             chat_id: chatId,
             text: `[Mock] 🎬 영상이 완성됐어요!\n캠페인 ID: ${campaignId}\n확인: ${mockVideoUrl}`
           });
         } catch (e) {
           console.error("Telegram mock notify failed", e);
         }
      }
    }, 5000);

    return { success: true, jobId, isMock: true };
  }

  try {
    // 실제 Creatomate API 호출
    const elements = productImages.map((url: string, index: number) => ({
      type: "image",
      source: url,
      track: 1,
      time: (index * (duration / productImages.length)).toString() + " s",
      duration: (duration / productImages.length).toString() + " s",
    }));

    // 자막 요소 추가 (간단한 예시)
    script.scenes.forEach((scene: any, index: number) => {
      const times = scene.second.split("-").map(Number);
      if (times.length === 2) {
        elements.push({
          type: "text",
          text: scene.text,
          track: 2,
          time: times[0].toString() + " s",
          duration: (times[1] - times[0]).toString() + " s",
          y: "80%",
          fill_color: "#ffffff",
          font_weight: "bold",
        } as any);
      }
    });

    const response = await axios.post("https://api.creatomate.com/v1/renders", {
      output_format: "mp4",
      frame_rate: 30,
      width: 1080,
      height: 1920, // 9:16 세로형
      elements: elements,
      webhook_url: webhookUrl,
      metadata: jobId, // webhook에서 식별하기 위해 jobId 전달
    }, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      }
    });

    const renderData = response.data;
    if (renderData && renderData.length > 0) {
      await jobRef.update({ creatomateRenderId: renderData[0].id });
    }

    return { success: true, jobId };
  } catch (error: any) {
    console.error("Creatomate API 연동 에러:", error?.response?.data || error);
    await jobRef.update({ status: "failed", error: error.message });
    throw new HttpsError("internal", "Creatomate 렌더링 요청 중 오류가 발생했습니다.");
  }
});

export const creatomateWebhook = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];
    const db = admin.firestore();

    for (const event of payload) {
      const jobId = event.metadata;
      if (!jobId) continue;

      const jobRef = db.collection("video_jobs").doc(jobId);
      
      if (event.status === "succeeded") {
        await jobRef.update({
          status: "succeeded",
          progress: 100,
          videoUrl: event.url,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 텔레그램 알림 발송
        const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
        const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;
        if (botToken && chatId) {
          try {
            await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              chat_id: chatId,
              text: `🎬 영상이 완성됐어요!\nJob ID: ${jobId}\n다운로드: ${event.url}`
            });
          } catch (teleError) {
            console.error("텔레그램 발송 실패:", teleError);
          }
        }
      } else if (event.status === "failed") {
        await jobRef.update({
          status: "failed",
          error: event.error_message || "Unknown error",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else if (event.status === "rendering" || event.status === "planned") {
        // 진행 상태 업데이트
        await jobRef.update({
          status: event.status,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).send("Internal Server Error");
  }
});
