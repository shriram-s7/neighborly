import { BookingStatus } from '@neighborly/shared';
import {
  validateBookingTransition,
  BOOKING_TRANSITIONS,
} from './booking.state-machine';

describe('Booking State Machine (Pure Transition Table)', () => {
  it('should allow Provider to accept a REQUESTED booking', () => {
    const res = validateBookingTransition(
      BookingStatus.REQUESTED,
      BookingStatus.ACCEPTED,
      'PROVIDER',
    );
    expect(res.valid).toBe(true);
  });

  it('should forbid Requester from accepting their own booking', () => {
    const res = validateBookingTransition(
      BookingStatus.REQUESTED,
      BookingStatus.ACCEPTED,
      'REQUESTER',
    );
    expect(res.valid).toBe(false);
    expect(res.error).toContain('is not permitted');
  });

  it('should allow full happy path lifecycle: REQUESTED -> ACCEPTED -> SCHEDULED -> IN_PROGRESS -> COMPLETED -> PAID -> REVIEWED', () => {
    expect(
      validateBookingTransition(BookingStatus.REQUESTED, BookingStatus.ACCEPTED, 'PROVIDER').valid,
    ).toBe(true);
    expect(
      validateBookingTransition(BookingStatus.ACCEPTED, BookingStatus.SCHEDULED, 'PROVIDER').valid,
    ).toBe(true);
    expect(
      validateBookingTransition(BookingStatus.SCHEDULED, BookingStatus.IN_PROGRESS, 'PROVIDER').valid,
    ).toBe(true);
    expect(
      validateBookingTransition(BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED, 'PROVIDER').valid,
    ).toBe(true);
    expect(
      validateBookingTransition(BookingStatus.COMPLETED, BookingStatus.PAID, 'REQUESTER').valid,
    ).toBe(true);
    expect(
      validateBookingTransition(BookingStatus.PAID, BookingStatus.REVIEWED, 'REQUESTER').valid,
    ).toBe(true);
  });

  it('should forbid illegal skipping (e.g. REQUESTED -> PAID)', () => {
    const res = validateBookingTransition(
      BookingStatus.REQUESTED,
      BookingStatus.PAID,
      'REQUESTER',
    );
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Illegal state transition');
  });

  it('should allow Requester to dispute a COMPLETED booking before payment', () => {
    const res = validateBookingTransition(
      BookingStatus.COMPLETED,
      BookingStatus.DISPUTED,
      'REQUESTER',
    );
    expect(res.valid).toBe(true);
  });

  it('should only allow ADMIN to resolve a DISPUTED booking to REFUNDED or PAID', () => {
    const nonAdmin = validateBookingTransition(
      BookingStatus.DISPUTED,
      BookingStatus.REFUNDED,
      'REQUESTER',
    );
    expect(nonAdmin.valid).toBe(false);

    const adminResolve = validateBookingTransition(
      BookingStatus.DISPUTED,
      BookingStatus.REFUNDED,
      'ADMIN',
    );
    expect(adminResolve.valid).toBe(true);
  });
});
