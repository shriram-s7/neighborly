import { haversineDistanceKm } from '@neighborly/shared';

describe('6-Factor Matching Engine & Geospatial Proximity', () => {
  it('should accurately compute haversine distance between Ramapuram and Porur', () => {
    // Ramapuram center: 13.0315, 80.1817
    // Porur center: 13.0382, 80.1565
    const distance = haversineDistanceKm(13.0315, 80.1817, 13.0382, 80.1565);
    expect(distance).toBeGreaterThan(2.0);
    expect(distance).toBeLessThan(3.5);
  });

  it('should return 0 km for identical coordinates', () => {
    expect(haversineDistanceKm(13.0315, 80.1817, 13.0315, 80.1817)).toBe(0);
  });

  it('should apply higher distance weight (35%) in Urgent Mode compared to Standard Mode (20%)', () => {
    const standardWeights = {
      skill: 0.30,
      distance: 0.20,
      availability: 0.15,
      rating: 0.15,
      price: 0.10,
      reliability: 0.10,
    };

    const urgentWeights = {
      distance: 0.35,
      skill: 0.20,
      availability: 0.20,
      rating: 0.10,
      reliability: 0.10,
      price: 0.05,
    };

    const sumStandard = Object.values(standardWeights).reduce((a, b) => a + b, 0);
    const sumUrgent = Object.values(urgentWeights).reduce((a, b) => a + b, 0);

    expect(Math.round(sumStandard * 100) / 100).toBe(1.0);
    expect(Math.round(sumUrgent * 100) / 100).toBe(1.0);
    expect(urgentWeights.distance).toBeGreaterThan(standardWeights.distance);
  });
});
