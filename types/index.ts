import { Timestamp } from "firebase/firestore";

/**
 * Campaign Status Badge types
 */
export type CampaignStatus = 'recruiting' | 'selected' | 'delivering' | 'reviewing' | 'completed';

/**
 * Campaign Entity Schema
 */
export interface Campaign {
  id: string;
  title: string;
  description: string;
  brandId: string;
  brandName: string;
  status: CampaignStatus;
  category: string;
  recruitsCount: number;
  selectedCount: number;
  recruitingPeriod: {
    start: Timestamp;
    end: Timestamp;
  };
  productImageUrls: string[];
  productInfo: string;
  rewardInfo: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Brand Profile Entity Schema
 */
export interface BrandProfile {
  uid: string;
  email: string;
  companyName: string;
  representativeName: string;
  businessRegistrationNumber: string;
  phoneNumber: string;
  logoUrl?: string;
  websiteUrl?: string;
  createdAt: Timestamp;
}

/**
 * Influencer Profile Entity Schema
 */
export interface InfluencerProfile {
  uid: string;
  email: string;
  name: string;
  phoneNumber: string;
  socialChannels: {
    instagram?: string;
    naverBlog?: string;
    youtube?: string;
    tiktok?: string;
  };
  followerCount: number;
  categories: string[];
  profileImageUrl?: string;
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  createdAt: Timestamp;
}

export interface QuizQuestion {
  id: number;
  question: string;
  optionA: { label: string; typeCode: string };
  optionB: { label: string; typeCode: string };
}
export type UserType = 'brand' | 'influencer';
export type Answer = 'A' | 'B';
export interface QuizState {
  currentIndex: number;
  answers: Answer[];
  userType: UserType;
}

export type ResultType = 'roi_anxiety' | 'operation_burden' | 'quality_concern'
| 'monetization_ready' | 'content_growth' | 'beginner';

export interface ResultData {
  type: ResultType;
  userType: UserType;
  emoji: string;
  title: string;
  description: string;
  solutions: string[];
}

export interface CrewMemberForm {
  name: string;
  birthDate: string;
  gender: 'male' | 'female' | 'none';
  phone: string;
  email: string;
  region: string;
}

export interface CrewMember {
  id: string;
  name: string;
  birthDate: string;
  gender: 'male' | 'female' | 'none';
  phone: string;
  email: string;
  region: string;
  userType: 'brand' | 'influencer';
  resultType: string;
  createdAt: Timestamp;
  source: string;
  memo?: string;
  status?: 'active' | 'contacted' | 'converted';
}

export type UserRole = 'brand' | 'influencer' | 'admin';

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  profileComplete: boolean;
  createdAt: Timestamp;
}

export interface Brand extends AppUser {
  companyName: string;
  businessNumber: string;
  categories: string[];
  logoUrl?: string;
}

export interface Influencer extends AppUser {
  nickname: string;
  channels: {
    instagram?: { handle: string; followerCount: number };
    blog?: { url: string };
    tiktok?: { handle: string };
  };
  followerCount: number;
  region: string;
  categories: string[];
  qualityScore: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  referralCode?: string;
  totalEarnings: number;
}
