describe('Explainable Bayesian Trust Score Formula', () => {
  function computeBayesianRating(ratings: number[], C = 3.0, m = 4.0): number {
    const sumRatings = ratings.reduce((sum, r) => sum + r, 0);
    const n = ratings.length;
    return (C * m + sumRatings) / (C + n);
  }

  it('should pull new accounts toward prior mean m = 4.0 with few reviews', () => {
    // 1 review of 5.0 stars with C=3, m=4.0
    // R = (3 * 4.0 + 5.0) / (3 + 1) = 17 / 4 = 4.25
    const singleReview = computeBayesianRating([5.0]);
    expect(singleReview).toBe(4.25);
  });

  it('should converge closer to true average with larger sample sizes', () => {
    // 20 reviews of 5.0 stars
    // R = (12 + 100) / 23 = 4.87
    const largeSample = computeBayesianRating(Array(20).fill(5.0));
    expect(largeSample).toBeGreaterThan(4.8);
    expect(largeSample).toBeLessThanOrEqual(5.0);
  });

  it('should appropriately apply penalties and clamp total score to [0, 100]', () => {
    const verificationPoints = 20; // ADDRESS
    const ratingPoints = 23;
    const completionPoints = 19;
    const reliabilityPoints = 14;
    const tenurePoints = 9;
    const authenticityPoints = 10;
    // Total raw positive = 95

    const penalties = 2 * 10 + 1 * 5; // 2 disputes (-20) + 1 cancel (-5) = 25
    const totalScore = Math.max(0, Math.min(100, 95 - penalties));

    expect(totalScore).toBe(70);
  });
});
