import { RequestUrgency, haversineDistanceKm } from '@neighborly/shared';
import { MatchingService } from './matching.service';
import { resolveTimeWindow } from './time-window';

const ELECTRICAL = { id: 'cat-elec', name: 'Electrical & Repairs', slug: 'electrical-repairs', keywords: ['fan', 'ceiling fan', 'switch'] };

// Requester at Ramapuram centre (the service's default reference point)
const REQ_LAT = 13.0315, REQ_LNG = 80.1815;

const listing = (id: string, lat: number, serviceRadiusKm: number) => ({
  id: `listing-${id}`,
  categoryId: ELECTRICAL.id,
  title: `Fan repair ${id}`,
  description: 'Ceiling fan repair',
  price: 45000,
  pricingType: 'FIXED',
  category: ELECTRICAL,
  provider: {
    id: `prov-${id}`,
    name: `Provider ${id}`,
    avatarUrl: null,
    lat,
    lng: REQ_LNG,
    neighborhood: { name: 'Ramapuram' },
    providerProfile: { trustScore: 80, completionRate: 95, onTimeRate: 0.9, serviceRadiusKm },
    availabilitySlots: [],
  },
});

describe('Request parser time windows', () => {
  afterEach(() => jest.useRealTimers());

  it('should turn "tomorrow evening" into 17:00–21:00 IST on the next day', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-16T06:30:00.000Z')); // 12:00 IST, 16 Oct
    const prisma: any = { category: { findMany: jest.fn().mockResolvedValue([ELECTRICAL]) } };
    const result = await new MatchingService(prisma).parseRequest(
      'fix my ceiling fan urgently tomorrow evening, budget 500',
    );

    expect(result.categoryName).toBe('Electrical & Repairs');
    expect(result.urgency).toBe(RequestUrgency.URGENT);
    expect(result.budgetMax).toBe(50000);
    expect(result.preferredTime).toBe('2026-10-17T11:30:00.000Z'); // 17:00 IST
    expect(result.preferredTimeEnd).toBe('2026-10-17T15:30:00.000Z'); // 21:00 IST
    expect(result.parsedChips.time).toBe('Tomorrow evening (17:00–21:00)');
  });

  it('should map morning to 08:00–12:00 and afternoon to 12:00–17:00 (today when no day is given)', () => {
    const now = new Date('2026-10-16T02:00:00.000Z'); // 07:30 IST
    const morning = resolveTimeWindow('need tutoring this morning', now)!;
    const afternoon = resolveTimeWindow('tomorrow afternoon please', now)!;
    expect([morning.start.toISOString(), morning.end.toISOString()]).toEqual(['2026-10-16T02:30:00.000Z', '2026-10-16T06:30:00.000Z']);
    expect([afternoon.start.toISOString(), afternoon.end.toISOString()]).toEqual(['2026-10-17T06:30:00.000Z', '2026-10-17T11:30:00.000Z']);
    expect(resolveTimeWindow('fix my fan tomorrow', now)).toBeNull();
  });
});

describe('Matching service radius filter', () => {
  it('should exclude providers whose distance is greater than their serviceRadiusKm', async () => {
    const far = 13.0855; // about 6 km north of the requester
    expect(haversineDistanceKm(REQ_LAT, REQ_LNG, far, REQ_LNG)).toBeGreaterThan(5);

    const prisma: any = {
      serviceListing: {
        findMany: jest.fn().mockResolvedValue([
          listing('near', 13.033, 5), // ~0.2 km, radius 5 km -> kept
          listing('far-5km', far, 5), // ~6 km, radius 5 km -> excluded
          listing('far-10km', far, 10), // ~6 km, radius 10 km -> kept
        ]),
      },
    };
    const results = await new MatchingService(prisma).findMatches({
      categoryId: ELECTRICAL.id,
      requesterLat: REQ_LAT,
      requesterLng: REQ_LNG,
    });

    expect(results.map((r) => r.providerId).sort()).toEqual(['prov-far-10km', 'prov-near']);
  });
});
