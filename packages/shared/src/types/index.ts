import { Role, VerificationLevel, BookingStatus, RequestUrgency, RequestType, PricingType } from '../enums';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  isProvider: boolean;
  name: string;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  isProvider: boolean;
  neighborhoodId?: string | null;
  neighborhoodName?: string | null;
  lat?: number | null;
  lng?: number | null;
  avatarUrl?: string | null;
  bio?: string | null;
  verificationLevel: VerificationLevel;
  trustScore?: number;
  joinedAt: string;
}

export interface MatchScoreFactor {
  factor: 'skill' | 'distance' | 'availability' | 'rating' | 'price' | 'reliability';
  weight: number;
  rawValue: number;
  contribution: number;
  explanation: string;
}

export interface MatchResult {
  listingId: string;
  providerId: string;
  providerName: string;
  providerAvatar?: string | null;
  title: string;
  description: string;
  price: number;
  pricingType: PricingType;
  totalScore: number;
  isUrgentMode: boolean;
  distanceKm: number;
  trustScore: number;
  rating: number;
  breakdown: MatchScoreFactor[];
}

export interface ParsedRequestResult {
  categoryId?: string | null;
  categoryName?: string | null;
  urgency: RequestUrgency;
  budgetMax?: number | null;
  preferredTime?: string | null;
  confidence: number;
  matchedKeywords: string[];
  parsedChips: {
    category?: string;
    urgency: string;
    budget?: string;
    time?: string;
  };
}

export interface TrustFactorBreakdown {
  verificationPoints: number;
  ratingPoints: number;
  completionPoints: number;
  reliabilityPoints: number;
  tenurePoints: number;
  authenticityPoints: number;
  penalties: number;
  totalScore: number; // 0 - 100
  tier: 'New' | 'Trusted' | 'Highly Trusted' | 'Pillar of the Community';
  tips: string[];
}

export interface PriceEstimateResult {
  categoryId: string;
  categoryName: string;
  neighborhoodId?: string | null;
  neighborhoodName?: string | null;
  isFallback: boolean;
  sampleSize: number;
  median: number; // in paise
  p25: number;    // in paise
  p75: number;    // in paise
}

export interface ServiceGapItem {
  neighborhoodId: string;
  neighborhoodName: string;
  categoryId: string;
  categoryName: string;
  demandCount: number;
  supplyCount: number;
  unfulfilledCount: number;
  unfulfilledRate: number;
  gapScore: number;
  insight: string;
}

export interface CommunityHealthIndex {
  neighborhoodId: string;
  neighborhoodName: string;
  score: number; // 0 - 100
  activeResidents: number;
  activeProviders: number;
  fulfilmentRate: number;
  medianTimeToAcceptMins: number;
  repeatBookingRate: number;
  disputeRate: number;
  avgTrustScore: number;
  freeHelpCount: number;
  barterCount: number;
  formulaDescription: string;
}
