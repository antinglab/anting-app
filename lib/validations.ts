import { z } from "zod";

/**
 * Zod validation schema for the CrewMember join form.
 */
export const crewMemberSchema = z.object({
  name: z.string().min(2, "이름은 2자 이상 입력해주세요"),
  birthDate: z
    .string()
    .min(1, "생년월일을 입력해주세요")
    .refine((val) => {
      const birthDate = new Date(val);
      const today = new Date();
      return birthDate < today;
    }, "생년월일은 과거 날짜여야 합니다")
    .refine((val) => {
      const birth = new Date(val);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age >= 14;
    }, "만 14세 이상만 가입 가능합니다"),
  gender: z.enum(["male", "female", "none"]),
  phone: z
    .string()
    .min(1, "연락처를 입력해주세요")
    .refine((val) => {
      // Strip hyphens to validate digits and prefix
      const rawNum = val.replace(/-/g, "");
      const isStartValid = rawNum.startsWith("010") || rawNum.startsWith("011");
      const isLengthValid = rawNum.length === 10 || rawNum.length === 11;
      return isStartValid && isLengthValid;
    }, "연락처는 010 또는 011로 시작하며, 10-11자리의 숫자여야 합니다"),
  email: z.string().min(1, "이메일을 입력해주세요").email("올바른 이메일 형식이 아닙니다"),
  region: z.string().min(1, "거주 지역을 선택해주세요"),
  instagramConnected: z.boolean().optional(),
  instagramHandle: z.string().optional(),
});
