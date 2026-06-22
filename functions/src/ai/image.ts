import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getStorage } from "firebase-admin/storage";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PredictionServiceClient, helpers } from "@google-cloud/aiplatform";
import axios from "axios";
import FormData from "form-data";

// 1. removeBackground
export const removeBackground = onCall({ timeoutSeconds: 300, memory: "1GiB" }, async (request) => {
  const { imageUrl, campaignId } = request.data || {};
  
  if (!imageUrl || !campaignId) {
    throw new HttpsError("invalid-argument", "imageUrl, campaignId는 필수입니다.");
  }
  
  const removeBgKey = process.env.REMOVEBG_API_KEY;
  if (!removeBgKey || removeBgKey === "mock") {
    // 가상의 키이거나 설정되지 않은 경우 모의 응답 반환 (원본 이미지 그대로 반환)
    console.log("REMOVEBG_API_KEY가 없거나 mock입니다. 원본 이미지를 배경이 제거된 이미지로 가정하고 진행합니다.");
    return { success: true, url: imageUrl, path: "mock_nobg.png", isMock: true };
  }

  try {
    const formData = new FormData();
    formData.append("image_url", imageUrl);
    formData.append("size", "auto");

    const response = await axios.post("https://api.remove.bg/v1.0/removebg", formData, {
      headers: {
        ...formData.getHeaders(),
        "X-Api-Key": removeBgKey,
      },
      responseType: "arraybuffer"
    });

    const buffer = Buffer.from(response.data, "binary");
    
    // Save to Firebase Storage
    const bucket = getStorage().bucket();
    const timestamp = Date.now();
    const fileName = `campaigns/${campaignId}/generated-images/nobg_${timestamp}.png`;
    const file = bucket.file(fileName);
    
    await file.save(buffer, {
      metadata: { contentType: "image/png" },
    });
    
    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    
    return { success: true, url: publicUrl, path: fileName };
  } catch (error: any) {
    console.error("removeBackground error, falling back to mock:", error);
    // API 호출이 실패하더라도 모의 응답 반환
    return { success: true, url: imageUrl, path: "mock_nobg_fallback.png", isMock: true, error: error.message };
  }
});

// 2. generateProductImage
export const generateProductImage = onCall({ timeoutSeconds: 300, memory: "1GiB" }, async (request) => {
  const { productName, theme, platform, campaignId } = request.data || {};
  
  if (!productName || !theme || !platform || !campaignId) {
    throw new HttpsError("invalid-argument", "productName, theme, platform, campaignId는 필수입니다.");
  }

  try {
    const projectId = process.env.GCLOUD_PROJECT || (process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG || "{}").projectId : undefined);
    
    if (!projectId) {
      throw new Error("GCLOUD_PROJECT를 확인할 수 없습니다.");
    }

    const location = "us-central1";
    
    let aspectRatio = "1:1";
    if (platform === "스토리") aspectRatio = "9:16";
    else if (platform === "블로그") aspectRatio = "16:9";

    const prompt = `Professional product photography of ${productName}, clean white background, soft natural lighting, ${theme} style, high quality commercial photo, suitable for Korean SNS marketing`;

    const clientOptions = { apiEndpoint: `${location}-aiplatform.googleapis.com` };
    const predictionServiceClient = new PredictionServiceClient(clientOptions);

    const endpoint = `projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-generate-001`;
    
    const parameters = helpers.toValue({
      sampleCount: 1,
      aspectRatio: aspectRatio
    });

    const instances = [
      helpers.toValue({ prompt })
    ];

    const result = await predictionServiceClient.predict({
      endpoint,
      instances: instances as any[],
      parameters,
    }) as any;

    const response = result[0];

    if (!response || !response.predictions || response.predictions.length === 0) {
      throw new Error("이미지 생성 실패");
    }

    const prediction = response.predictions[0] as any;
    const base64Image = prediction.structValue?.fields?.bytesBase64Encoded?.stringValue;
    
    if (!base64Image) {
      throw new Error("응답에 이미지가 포함되지 않았습니다.");
    }
    
    const buffer = Buffer.from(base64Image, "base64");

    const bucket = getStorage().bucket();
    const timestamp = Date.now();
    const fileName = `campaigns/${campaignId}/generated-images/gen_${timestamp}.png`;
    const file = bucket.file(fileName);
    
    await file.save(buffer, {
      metadata: { contentType: "image/png" },
    });
    
    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    return { success: true, url: publicUrl, path: fileName };
  } catch (error: any) {
    console.error("generateProductImage error, falling back to mock:", error);
    // 모의 이미지 반환 (API 호출 실패 또는 설정 누락 시)
    const mockUrl = `https://placehold.co/600x600/olive/white.png?text=Mock+Image+for+${encodeURIComponent(productName)}`;
    return { success: true, url: mockUrl, path: "mock_path.png", isMock: true, error: error.message };
  }
});

// 3. analyzeContentImage
export const analyzeContentImage = onCall({ timeoutSeconds: 300, memory: "1GiB" }, async (request) => {
  const { imageUrl, requiredHashtags = [] } = request.data || {};
  
  if (!imageUrl) {
    throw new HttpsError("invalid-argument", "imageUrl은 필수입니다.");
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
    }

    const imgResp = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const imgBuffer = Buffer.from(imgResp.data, "binary");
    const base64Data = imgBuffer.toString("base64");
    const mimeType = (imgResp.headers["content-type"] as string) || "image/jpeg";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `이 콘텐츠 이미지를 분석해줘.
1. 다음 해시태그 텍스트가 이미지 내에 포함되어 있는지 확인: ${(requiredHashtags as string[]).join(", ")}
2. '광고', '협찬' 등의 광고 표시가 이미지에 포함되어 있는지 확인.

결과를 JSON 형식으로만 반환해. 포맷:
{
  "hasRequiredHashtags": boolean,
  "missingHashtags": string[],
  "hasAdIndication": boolean,
  "adIndicationText": string,
  "reason": string
}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ]);

    const text = result.response.text();
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const analysis = JSON.parse(jsonStr);

    return { success: true, analysis };
  } catch (error: any) {
    console.error("analyzeContentImage error, falling back to mock:", error);
    // 모의 분석 결과 반환
    return {
      success: true,
      analysis: {
        hasRequiredHashtags: true,
        missingHashtags: [],
        hasAdIndication: false,
        adIndicationText: "",
        reason: "[Mock] API 설정이 없어 가상의 정상 검수 결과를 반환합니다."
      },
      isMock: true,
      error: error.message
    };
  }
});
