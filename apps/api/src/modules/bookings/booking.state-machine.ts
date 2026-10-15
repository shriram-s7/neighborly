import { BookingStatus, Role } from '@neighborly/shared';

export type ActorRole = 'REQUESTER' | 'PROVIDER' | 'ADMIN' | 'SYSTEM';

export interface TransitionRule {
  from: BookingStatus | BookingStatus[];
  to: BookingStatus;
  allowedActors: ActorRole[];
  description: string;
}

/**
 * Explicit state transition table for the pure booking state machine.
 */
export const BOOKING_TRANSITIONS: TransitionRule[] = [
  // REQUESTED -> ACCEPTED (by Provider)
  {
    from: BookingStatus.REQUESTED,
    to: BookingStatus.ACCEPTED,
    allowedActors: ['PROVIDER', 'ADMIN'],
    description: 'Provider accepts the booking request',
  },
  // REQUESTED -> DECLINED (by Provider) -> triggers escrow refund
  {
    from: BookingStatus.REQUESTED,
    to: BookingStatus.DECLINED,
    allowedActors: ['PROVIDER', 'ADMIN'],
    description: 'Provider declines the booking request, full refund released',
  },
  // REQUESTED -> CANCELLED (by Requester) -> triggers escrow refund
  {
    from: BookingStatus.REQUESTED,
    to: BookingStatus.CANCELLED,
    allowedActors: ['REQUESTER', 'ADMIN'],
    description: 'Requester cancels before acceptance, full refund released',
  },
  // ACCEPTED -> SCHEDULED (by Provider)
  {
    from: BookingStatus.ACCEPTED,
    to: BookingStatus.SCHEDULED,
    allowedActors: ['PROVIDER', 'ADMIN'],
    description: 'Provider confirms the specific arrival appointment',
  },
  // ACCEPTED / SCHEDULED -> CANCELLED (by either party before job starts)
  {
    from: [BookingStatus.ACCEPTED, BookingStatus.SCHEDULED],
    to: BookingStatus.CANCELLED,
    allowedActors: ['REQUESTER', 'PROVIDER', 'ADMIN'],
    description: 'Booking cancelled prior to commencement, full refund released',
  },
  // SCHEDULED / ACCEPTED -> IN_PROGRESS (by Provider)
  {
    from: [BookingStatus.SCHEDULED, BookingStatus.ACCEPTED],
    to: BookingStatus.IN_PROGRESS,
    allowedActors: ['PROVIDER', 'ADMIN'],
    description: 'Provider arrives and starts the job',
  },
  // IN_PROGRESS -> COMPLETED (by Provider) -> sets autoReleaseAt = now + 48h
  {
    from: BookingStatus.IN_PROGRESS,
    to: BookingStatus.COMPLETED,
    allowedActors: ['PROVIDER', 'ADMIN'],
    description: 'Provider marks work finished, 48-hour escrow auto-release countdown begins',
  },
  // IN_PROGRESS or COMPLETED -> DISPUTED (by Requester before payment release)
  {
    from: [BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED],
    to: BookingStatus.DISPUTED,
    allowedActors: ['REQUESTER', 'ADMIN'],
    description: 'Requester raises an issue, escrow frozen pending admin resolution',
  },
  // COMPLETED -> PAID (by Requester confirm OR by System 48h cron auto-release)
  {
    from: BookingStatus.COMPLETED,
    to: BookingStatus.PAID,
    allowedActors: ['REQUESTER', 'SYSTEM', 'ADMIN'],
    description: 'Payment released from escrow to provider (minus 5% platform fee)',
  },
  // DISPUTED -> REFUNDED (by Admin resolving dispute in favor of requester)
  {
    from: BookingStatus.DISPUTED,
    to: BookingStatus.REFUNDED,
    allowedActors: ['ADMIN'],
    description: 'Dispute settled: escrow refunded to requester',
  },
  // DISPUTED -> PAID (by Admin resolving dispute in favor of provider or split)
  {
    from: BookingStatus.DISPUTED,
    to: BookingStatus.PAID,
    allowedActors: ['ADMIN'],
    description: 'Dispute settled: escrow released (or split) to provider',
  },
  // PAID -> REVIEWED (after review submission)
  {
    from: BookingStatus.PAID,
    to: BookingStatus.REVIEWED,
    allowedActors: ['REQUESTER', 'PROVIDER', 'ADMIN'],
    description: 'Review submitted, mutual trust score recalculated',
  },
];

/**
 * Validates whether a transition from `currentStatus` to `nextStatus` is legal
 * for the given actor role.
 */
export function validateBookingTransition(
  currentStatus: BookingStatus,
  nextStatus: BookingStatus,
  actorRole: ActorRole,
): { valid: boolean; error?: string } {
  const match = BOOKING_TRANSITIONS.find((rule) => {
    const fromMatches = Array.isArray(rule.from)
      ? rule.from.includes(currentStatus)
      : rule.from === currentStatus;
    return fromMatches && rule.to === nextStatus;
  });

  if (!match) {
    return {
      valid: false,
      error: `Illegal state transition from ${currentStatus} to ${nextStatus}`,
    };
  }

  if (!match.allowedActors.includes(actorRole)) {
    return {
      valid: false,
      error: `Actor role ${actorRole} is not permitted to transition booking from ${currentStatus} to ${nextStatus}`,
    };
  }

  return { valid: true };
}
