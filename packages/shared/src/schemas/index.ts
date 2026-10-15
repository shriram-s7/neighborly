import { z } from 'zod';
import {
  Role,
  VerificationLevel,
  PricingType,
  RequestUrgency,
  RequestType,
  BookingPaymentMode,
  BookingStatus,
  DisputeResolution,
} from '../enums';

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 digits').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(Role).optional().default(Role.USER),
  isProvider: z.boolean().default(false),
  neighborhoodId: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  bio: z.string().max(500).optional(),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginDto = z.infer<typeof LoginSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;

export const CreateListingSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  pricingType: z.nativeEnum(PricingType).default(PricingType.FIXED),
  price: z.number().int().min(0, 'Price must be non-negative in paise'),
  acceptsBarter: z.boolean().default(false),
});

export type CreateListingDto = z.infer<typeof CreateListingSchema>;

export const ParseRequestSchema = z.object({
  text: z.string().min(5, 'Request text must be at least 5 characters'),
});

export type ParseRequestDto = z.infer<typeof ParseRequestSchema>;

export const CreateServiceRequestSchema = z.object({
  rawText: z.string().min(5, 'Request text is required'),
  parsedCategoryId: z.string().optional(),
  urgency: z.nativeEnum(RequestUrgency).default(RequestUrgency.NORMAL),
  budgetMax: z.number().int().positive().optional(),
  preferredTime: z.string().datetime().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  type: z.nativeEnum(RequestType).default(RequestType.PAID),
});

export type CreateServiceRequestDto = z.infer<typeof CreateServiceRequestSchema>;

export const CreateBookingSchema = z.object({
  listingId: z.string().min(1, 'Listing ID is required'),
  requestId: z.string().optional(),
  scheduledAt: z.string().datetime('Must be a valid ISO date'),
  paymentMode: z.nativeEnum(BookingPaymentMode).default(BookingPaymentMode.WALLET),
});

export type CreateBookingDto = z.infer<typeof CreateBookingSchema>;

export const TransitionBookingSchema = z.object({
  to: z.nativeEnum(BookingStatus),
  note: z.string().max(300).optional(),
  cancelReason: z.string().max(300).optional(),
});

export type TransitionBookingDto = z.infer<typeof TransitionBookingSchema>;

export const CreateReviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(3, 'Comment must be at least 3 characters').max(500),
});

export type CreateReviewDto = z.infer<typeof CreateReviewSchema>;

export const CreateDisputeSchema = z.object({
  bookingId: z.string().min(1),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  evidenceText: z.string().min(10, 'Evidence must be at least 10 characters'),
});

export type CreateDisputeDto = z.infer<typeof CreateDisputeSchema>;

export const ResolveDisputeSchema = z.object({
  resolution: z.nativeEnum(DisputeResolution),
  splitPercent: z.number().int().min(1).max(99).optional(),
  adminNote: z.string().min(5, 'Admin note required'),
});

export type ResolveDisputeDto = z.infer<typeof ResolveDisputeSchema>;

export const TopupWalletSchema = z.object({
  amount: z.number().int().positive('Amount must be positive in paise'),
});

export type TopupWalletDto = z.infer<typeof TopupWalletSchema>;

export const ProposeExchangeSchema = z.object({
  receiverId: z.string().min(1),
  offeredListingId: z.string().min(1),
  requestedListingId: z.string().min(1),
  offeredHours: z.number().positive(),
  requestedHours: z.number().positive(),
});

export type ProposeExchangeDto = z.infer<typeof ProposeExchangeSchema>;
