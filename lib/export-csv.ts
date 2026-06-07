import { CrewMember } from "@/types";
import { Timestamp } from "firebase/firestore";

/**
 * Exports an array of CrewMember objects to a downloadable CSV spreadsheet.
 * Includes BOM (\uFEFF) to prevent encoding/character issues in Korean version of Excel.
 */
export function exportCrewsToCSV(crews: CrewMember[]): void {
  const headers = [
    "번호",
    "이름",
    "생년월일",
    "성별",
    "연락처",
    "이메일",
    "거주지역",
    "유저유형",
    "진단결과유형",
    "가입일시",
    "상태",
    "메모"
  ];

  const formatTimestamp = (ts: Timestamp | null | undefined) => {
    if (!ts) return "";
    const date = ts instanceof Timestamp ? ts.toDate() : new Date((ts as Timestamp).seconds * 1000);
    return date.toISOString().replace("T", " ").substring(0, 19);
  };

  const rows = crews.map((crew, index) => {
    const number = index + 1;
    const name = crew.name || "";
    const birthDate = crew.birthDate || "";
    const gender = crew.gender === "male" ? "남성" : crew.gender === "female" ? "여성" : "선택안함";
    const phone = crew.phone || "";
    const email = crew.email || "";
    const region = crew.region || "";
    const userType = crew.userType === "brand" ? "광고주" : "인플루언서";
    
    const resultTypeMap: Record<string, string> = {
      roi_anxiety: "ROI 불안형",
      operation_burden: "운영 부담형",
      quality_concern: "품질 고민형",
      monetization_ready: "수익화 준비형",
      content_growth: "콘텐츠 성장형",
      beginner: "입문 탐색형",
      none: "미진단"
    };
    const resultType = resultTypeMap[crew.resultType] || crew.resultType || "미진단";
    
    const createdAt = formatTimestamp(crew.createdAt);
    
    const statusMap: Record<string, string> = {
      active: "대기중",
      contacted: "연락완료",
      converted: "전환완료"
    };
    const status = statusMap[crew.status || "active"] || "대기중";
    const memo = (crew.memo || "").replace(/"/g, '""'); // Escape double quotes

    return [
      number,
      `"${name}"`,
      `"${birthDate}"`,
      `"${gender}"`,
      `"${phone}"`,
      `"${email}"`,
      `"${region}"`,
      `"${userType}"`,
      `"${resultType}"`,
      `"${createdAt}"`,
      `"${status}"`,
      `"${memo}"`
    ].join(",");
  });

  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const filename = `anting-crew-${yyyy}${mm}${dd}.csv`;
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
