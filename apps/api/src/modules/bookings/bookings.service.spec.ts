import { BookingPaymentMode } from '@neighborly/shared';
import { BookingsService } from './bookings.service';

const LISTING = { id: 'listing-1', providerId: 'prov-1', price: 45000, isActive: true, title: 'Fan repair', provider: {} };

const setup = () => {
  const tx: any = {
    booking: { create: jest.fn(async ({ data }) => ({ id: 'booking-1', ...data })) },
    bookingEvent: { create: jest.fn() },
    conversation: { create: jest.fn() },
    auditLog: { create: jest.fn() },
  };
  const prisma: any = {
    serviceListing: { findUnique: jest.fn().mockResolvedValue(LISTING) },
    $transaction: jest.fn((fn) => fn(tx)),
  };
  const wallet: any = { holdEscrowTx: jest.fn() };
  const notifications: any = { create: jest.fn() };
  const gateway: any = { emitBookingUpdate: jest.fn() };
  const service = new BookingsService(prisma, wallet, notifications, gateway);
  return { service, tx, wallet };
};

const SCHEDULED_AT = '2026-10-17T11:30:00.000Z';

describe('Booking creation escrow', () => {
  it('should default a missing paymentMode to WALLET and hold escrow', async () => {
    const { service, tx, wallet } = setup();
    await service.createBooking('req-1', { listingId: LISTING.id, scheduledAt: SCHEDULED_AT } as any);

    expect(tx.booking.create.mock.calls[0][0].data.paymentMode).toBe(BookingPaymentMode.WALLET);
    expect(wallet.holdEscrowTx).toHaveBeenCalledWith(tx, 'req-1', 'booking-1', 45000);
  });

  it('should not hold escrow for a CREDITS booking', async () => {
    const { service, tx, wallet } = setup();
    await service.createBooking('req-1', {
      listingId: LISTING.id,
      scheduledAt: SCHEDULED_AT,
      paymentMode: BookingPaymentMode.CREDITS,
    });

    expect(tx.booking.create.mock.calls[0][0].data.paymentMode).toBe(BookingPaymentMode.CREDITS);
    expect(wallet.holdEscrowTx).not.toHaveBeenCalled();
  });
});
