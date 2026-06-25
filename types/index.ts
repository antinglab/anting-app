import { Timestamp } from "firebase/firestore";

/**
 * Campaign Status Badge types
 */
export type CampaignStatus = 'draft' | 'recruiting' | 'selection_pending' | 'delivering' | 'reviewing' | 'completed' | 'cancelled';

/**
 * Campaign Entity Schema
 */
export interface Campaign {
  id: string;
  brandId: string;
  title: string;
  productName: string;
  category: string;
  productImages: string[];
  description: string;
  benefit: string;
  recruitCount: number;
  currentApplicants: number;
  conditions: {
    minFollowers: number;
    regions: string[];
    genders: string[];
  };
  guidelines: string;
  requiredPhrases: string[];
  forbiddenWords: string[];
  requiredHashtags: string[];
  status: CampaignStatus;
  deadline: Timestamp;
  pointReward?: number;
  createdAt: Timestamp;
}

/**
 * Application Entity Schema
 */
export type ApplicationStatus = 'pending' | 'selected' | 'rejected' | 'delivered' | 'submitted' | 'approved' | 'revision_requested';

export interface Application {
  id: string;
  campaignId: string;
  influencerId: string;
  brandId: string;
  status: ApplicationStatus;
  trackingNumber?: string;
  carrier?: string;
  contentUrl?: string;
  contentPlatform?: 'instagram' | 'blog' | 'tiktok';
  revisionReason?: string;
  submittedAt?: Timestamp;
  approvedAt?: Timestamp;
  createdAt: Timestamp;
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
  instagramConnected?: boolean;
  instagramHandle?: string;
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
  instagramConnected?: boolean;
  instagramHandle?: string;
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
  referralCode?: string;
  referredBy?: string;
  paybackBalance?: number;
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

export interface PointHistory {
  id: string;
  uid: string;
  type: 'earn' | 'withdraw' | 'deduct' | 'payback';
  amount: number;
  balance: number;
  description: string;
  campaignId?: string;
  createdAt: Timestamp;
}

export interface WithdrawRequest {
  id: string;
  uid: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  status: 'pending' | 'completed' | 'rejected';
  createdAt: Timestamp;
}

export interface ReferralCode {
  code: string;
  influencerId: string;
  totalEarnings: number;
  totalOrders: number;
  referredUsers: number;
  createdAt: Timestamp;
}

export interface Order {
  id: string;
  userId: string;
  sellerId: string;
  totalAmount: number;
  status: 'pending' | 'paid' | 'completed';
  createdAt: Timestamp;
}

export interface ReferralEarnings {
  id: string;
  orderId: string;
  influencerId: string;
  amount: number;
  buyerId: string;
  createdAt: Timestamp;
}
