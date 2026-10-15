import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RequestUrgency,
  MatchResult,
  MatchScoreFactor,
  ParsedRequestResult,
  PriceEstimateResult,
  haversineDistanceKm,
} from '@neighborly/shared';

@Injectable()
export class MatchingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Rule-based natural language request parser.
   * Extracts category, urgency, budget, time, and confidence.
   */
  async parseRequest(rawText: string): Promise<ParsedRequestResult> {
    const textLower = rawText.toLowerCase();

    // 1. Fetch all categories and their keywords
    const categories = await this.prisma.category.findMany();

    let bestCategory: any = null;
    let highestMatches = 0;
    const matchedKeywords: string[] = [];

    for (const cat of categories) {
      let matches = 0;
      // Check category name itself
      if (textLower.includes(cat.name.toLowerCase()) || textLower.includes(cat.slug.toLowerCase())) {
        matches += 3;
        matchedKeywords.push(cat.name);
      }

      // Check keywords array
      for (const kw of cat.keywords) {
        if (textLower.includes(kw.toLowerCase())) {
          matches += 1;
          if (!matchedKeywords.includes(kw)) {
            matchedKeywords.push(kw);
          }
        }
      }

      if (matches > highestMatches) {
        highestMatches = matches;
        bestCategory = cat;
      }
    }

    // 2. Extract Urgency
    let urgency: RequestUrgency = RequestUrgency.NORMAL;
    const urgentTerms = [
      'urgent',
      'emergency',
      'asap',
      'immediately',
      'quick',
      'right now',
      'now',
      'sparking',
      'flooding',
      'burst',
      'today',
    ];
    const lowTerms = ['flexible', 'next week', 'anytime', 'when free', 'not urgent'];

    if (urgentTerms.some((term) => textLower.includes(term))) {
      urgency = RequestUrgency.URGENT;
    } else if (lowTerms.some((term) => textLower.includes(term))) {
      urgency = RequestUrgency.LOW;
    }

    // 3. Extract Budget (Regex for ₹ or Rs or numbers)
    let budgetMax: number | null = null;
    let budgetChip: string | undefined = undefined;

    const budgetMatch =
      textLower.match(/(?:rs\.?|₹|inr)\s*(\d{2,6})/i) ||
      textLower.match(/(\d{2,6})\s*(?:rs|rupees|inr|bucks)/i) ||
      textLower.match(/budget\s*(?:of|is|around|max)?\s*(?:rs\.?|₹)?\s*(\d{2,6})/i);

    if (budgetMatch && budgetMatch[1]) {
      const rupees = parseInt(budgetMatch[1], 10);
      if (rupees > 0 && rupees < 50000) {
        budgetMax = rupees * 100; // in paise
        budgetChip = `₹${rupees}`;
      }
    }

    // 4. Extract Preferred Time
    let preferredTime: string | null = null;
    let timeChip: string | undefined = undefined;

    if (textLower.includes('today')) {
      timeChip = 'Today';
      preferredTime = new Date().toISOString();
    } else if (textLower.includes('tomorrow')) {
      timeChip = 'Tomorrow';
      preferredTime = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    }

    const hourMatch = textLower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
    if (hourMatch) {
      timeChip = `${timeChip ? `${timeChip} at ` : ''}${hourMatch[0].toUpperCase()}`;
    }

    // Confidence estimation
    let confidence = 0.5;
    if (bestCategory) confidence += 0.3;
    if (urgency === RequestUrgency.URGENT) confidence += 0.1;
    if (budgetMax) confidence += 0.1;

    return {
      categoryId: bestCategory ? bestCategory.id : null,
      categoryName: bestCategory ? bestCategory.name : null,
      urgency,
      budgetMax,
      preferredTime,
      confidence: Math.min(1.0, confidence),
      matchedKeywords,
      parsedChips: {
        category: bestCategory ? bestCategory.name : undefined,
        urgency: urgency,
        budget: budgetChip,
        time: timeChip,
      },
    };
  }

  /**
   * 6-Factor Explainable Matching Algorithm
   * Weights (Standard): Skill 30%, Distance 20%, Availability 15%, Bayesian Rating 15%, Price Fit 10%, Reliability 10%
   * Weights (Urgent): Distance 35%, Skill 20%, Availability 20%, Rating 10%, Reliability 10%, Price Fit 5%
   */
  async findMatches(params: {
    categoryId?: string;
    requesterLat?: number;
    requesterLng?: number;
    budgetMax?: number; // integer paise
    urgency?: RequestUrgency;
    isUrgentMode?: boolean;
    neighborhoodId?: string;
  }): Promise<MatchResult[]> {
    const isUrgent = params.isUrgentMode || params.urgency === RequestUrgency.URGENT;

    // Default reference coordinates: Ramapuram center if not provided
    const userLat = params.requesterLat ?? 13.0315;
    const userLng = params.requesterLng ?? 80.1815;

    // Fetch active listings
    const listings = await this.prisma.serviceListing.findMany({
      where: {
        isActive: true,
        ...(params.categoryId ? { categoryId: params.categoryId } : {}),
      },
      include: {
        category: true,
        provider: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            lat: true,
            lng: true,
            neighborhood: true,
            providerProfile: true,
            availabilitySlots: true,
          },
        },
      },
    });

    const results: MatchResult[] = [];

    // Weights setup
    const weights = isUrgent
      ? {
          distance: 0.35,
          skill: 0.20,
          availability: 0.20,
          rating: 0.10,
          reliability: 0.10,
          price: 0.05,
        }
      : {
          skill: 0.30,
          distance: 0.20,
          availability: 0.15,
          rating: 0.15,
          price: 0.10,
          reliability: 0.10,
        };

    for (const listing of listings) {
      const provider = listing.provider;
      const profile = provider.providerProfile;

      // 1. Skill Fit Factor (0 - 1)
      let skillRaw = 1.0;
      let skillExplanation = `Exact match for ${listing.category.name}`;
      if (params.categoryId && listing.categoryId !== params.categoryId) {
        skillRaw = 0.5;
        skillExplanation = `Related category: ${listing.category.name}`;
      }

      // 2. Geospatial Distance Factor (0 - 1)
      const pLat = provider.lat ?? 13.0382;
      const pLng = provider.lng ?? 80.1565;
      const distanceKm = haversineDistanceKm(userLat, userLng, pLat, pLng);

      // Decay curve: 1.0 if <= 1km, linear decay down to 0 at 10km
      let distanceRaw = Math.max(0, 1 - (distanceKm - 0.5) / 8.5);
      if (distanceKm <= 1.0) distanceRaw = 1.0;
      distanceRaw = Math.min(1.0, Math.max(0, distanceRaw));

      const distanceExplanation = `${distanceKm} km away in ${
        provider.neighborhood?.name || 'Chennai'
      }`;

      // 3. Availability Fit Factor (0 - 1)
      const slotsCount = provider.availabilitySlots.length;
      let availabilityRaw = slotsCount > 0 ? 0.95 : 0.6;
      let availabilityExplanation =
        slotsCount > 0
          ? `${slotsCount} weekly open slots configured`
          : 'Standard dispatch availability';

      // 4. Bayesian Rating & Trust Score Factor (0 - 1)
      const trustScore = profile?.trustScore ?? 50;
      const ratingRaw = Math.min(1.0, Math.max(0.2, trustScore / 100));
      const ratingExplanation = `Trust Score ${trustScore}/100 • Bayesian prior C=3`;

      // 5. Price Fit Factor (0 - 1)
      let priceRaw = 1.0;
      let priceExplanation = `₹${listing.price / 100} (${listing.pricingType})`;

      if (params.budgetMax && params.budgetMax > 0) {
        if (listing.price <= params.budgetMax) {
          priceRaw = 1.0;
          priceExplanation = `₹${listing.price / 100} is within your ₹${
            params.budgetMax / 100
          } budget`;
        } else {
          // Linear decay above budget
          const excess = listing.price - params.budgetMax;
          priceRaw = Math.max(0.1, 1.0 - excess / params.budgetMax);
          priceExplanation = `₹${listing.price / 100} is slightly above your ₹${
            params.budgetMax / 100
          } budget`;
        }
      }

      // 6. Reliability & On-Time Factor (0 - 1)
      const completionRate = (profile?.completionRate ?? 95) / 100;
      const onTimeRate = profile?.onTimeRate ?? 0.95;
      const reliabilityRaw = completionRate * 0.6 + onTimeRate * 0.4;
      const reliabilityExplanation = `${Math.round(
        completionRate * 100,
      )}% completion rate, ${Math.round(onTimeRate * 100)}% on-time`;

      // Build breakdown
      const breakdown: MatchScoreFactor[] = [
        {
          factor: 'skill',
          weight: weights.skill,
          rawValue: Math.round(skillRaw * 100) / 100,
          contribution: Math.round(skillRaw * weights.skill * 100 * 10) / 10,
          explanation: skillExplanation,
        },
        {
          factor: 'distance',
          weight: weights.distance,
          rawValue: Math.round(distanceRaw * 100) / 100,
          contribution: Math.round(distanceRaw * weights.distance * 100 * 10) / 10,
          explanation: distanceExplanation,
        },
        {
          factor: 'availability',
          weight: weights.availability,
          rawValue: Math.round(availabilityRaw * 100) / 100,
          contribution: Math.round(availabilityRaw * weights.availability * 100 * 10) / 10,
          explanation: availabilityExplanation,
        },
        {
          factor: 'rating',
          weight: weights.rating,
          rawValue: Math.round(ratingRaw * 100) / 100,
          contribution: Math.round(ratingRaw * weights.rating * 100 * 10) / 10,
          explanation: ratingExplanation,
        },
        {
          factor: 'price',
          weight: weights.price,
          rawValue: Math.round(priceRaw * 100) / 100,
          contribution: Math.round(priceRaw * weights.price * 100 * 10) / 10,
          explanation: priceExplanation,
        },
        {
          factor: 'reliability',
          weight: weights.reliability,
          rawValue: Math.round(reliabilityRaw * 100) / 100,
          contribution: Math.round(reliabilityRaw * weights.reliability * 100 * 10) / 10,
          explanation: reliabilityExplanation,
        },
      ];

      const totalScore =
        Math.round(breakdown.reduce((sum, f) => sum + f.contribution, 0) * 10) / 10;

      results.push({
        listingId: listing.id,
        providerId: provider.id,
        providerName: provider.name,
        providerAvatar: provider.avatarUrl,
        title: listing.title,
        description: listing.description,
        price: listing.price,
        pricingType: listing.pricingType as any,
        totalScore,
        isUrgentMode: isUrgent,
        distanceKm,
        trustScore,
        rating: Math.round(((trustScore / 100) * 4 + 1) * 10) / 10,
        breakdown,
      });
    }

    // Sort by totalScore descending
    results.sort((a, b) => b.totalScore - a.totalScore);
    return results;
  }

  /**
   * Fair-Price Estimator:
   * Median, P25, P75 computed from completed bookings in DB.
   */
  async getFairPriceEstimate(
    categoryId: string,
    neighborhoodId?: string,
  ): Promise<PriceEstimateResult> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Local bookings query
    let bookings = await this.prisma.booking.findMany({
      where: {
        listing: { categoryId },
        status: { in: ['COMPLETED', 'PAID', 'REVIEWED'] },
        ...(neighborhoodId ? { requester: { neighborhoodId } } : {}),
      },
      select: { agreedPrice: true },
    });

    let isFallback = false;

    // If fewer than 3 samples in neighborhood, fallback to city-wide data
    if (bookings.length < 3 && neighborhoodId) {
      bookings = await this.prisma.booking.findMany({
        where: {
          listing: { categoryId },
          status: { in: ['COMPLETED', 'PAID', 'REVIEWED'] },
        },
        select: { agreedPrice: true },
      });
      isFallback = true;
    }

    // If still < 3, use active listings prices as baseline
    let prices = bookings.map((b) => b.agreedPrice).sort((a, b) => a - b);
    if (prices.length < 3) {
      const listings = await this.prisma.serviceListing.findMany({
        where: { categoryId, isActive: true },
        select: { price: true },
      });
      prices = listings.map((l) => l.price).sort((a, b) => a - b);
      isFallback = true;
    }

    if (prices.length === 0) {
      // Default baseline for newly added category
      prices = [40000, 50000, 60000];
      isFallback = true;
    }

    const n = prices.length;
    const p25 = prices[Math.floor(n * 0.25)];
    const median = prices[Math.floor(n * 0.5)];
    const p75 = prices[Math.floor(n * 0.75)];

    let neighborhoodName: string | null = null;
    if (neighborhoodId) {
      const nHood = await this.prisma.neighborhood.findUnique({
        where: { id: neighborhoodId },
      });
      neighborhoodName = nHood?.name || null;
    }

    return {
      categoryId: category.id,
      categoryName: category.name,
      neighborhoodId,
      neighborhoodName,
      isFallback,
      sampleSize: n,
      median,
      p25,
      p75,
    };
  }
}
