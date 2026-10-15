export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum VerificationLevel {
  NONE = 'NONE',
  PHONE = 'PHONE',
  ID = 'ID',
  ADDRESS = 'ADDRESS',
}

export enum PricingType {
  FIXED = 'FIXED',
  HOURLY = 'HOURLY',
  FREE = 'FREE',
}

export enum RequestUrgency {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  URGENT = 'URGENT',
}

export enum RequestType {
  PAID = 'PAID',
  FREE_HELP = 'FREE_HELP',
  BARTER = 'BARTER',
}

export enum RequestStatus {
  OPEN = 'OPEN',
  MATCHED = 'MATCHED',
  CLOSED = 'CLOSED',
  EXPIRED = 'EXPIRED',
}

export enum BookingPaymentMode {
  WALLET = 'WALLET',
  CREDITS = 'CREDITS',
  FREE = 'FREE',
}

export enum BookingStatus {
  REQUESTED = 'REQUESTED',
  ACCEPTED = 'ACCEPTED',
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  PAID = 'PAID',
  REVIEWED = 'REVIEWED',
  DECLINED = 'DECLINED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
  REFUNDED = 'REFUNDED',
}

export enum LedgerEntryType {
  TOPUP = 'TOPUP',
  ESCROW_HOLD = 'ESCROW_HOLD',
  ESCROW_RELEASE = 'ESCROW_RELEASE',
  REFUND = 'REFUND',
  PLATFORM_FEE = 'PLATFORM_FEE',
  CREDIT_EARN = 'CREDIT_EARN',
  CREDIT_SPEND = 'CREDIT_SPEND',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
}

export enum DisputeResolution {
  REFUND = 'REFUND',
  RELEASE = 'RELEASE',
  SPLIT = 'SPLIT',
}

export enum SkillExchangeStatus {
  PROPOSED = 'PROPOSED',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DECLINED = 'DECLINED',
  CANCELLED = 'CANCELLED',
}
