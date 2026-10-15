describe('Double-Entry Wallet Ledger Invariant', () => {
  interface SimulatedWallet {
    id: string;
    userId: string;
    balance: number;
    heldBalance: number;
  }

  interface SimulatedLedgerEntry {
    type: 'TOPUP' | 'ESCROW_HOLD' | 'ESCROW_RELEASE' | 'REFUND' | 'PLATFORM_FEE';
    bookingId?: string | null;
    amount: number;
  }

  function verifyInvariant(
    wallets: SimulatedWallet[],
    ledgerEntries: SimulatedLedgerEntry[],
  ) {
    const totalBalances = wallets.reduce((sum, w) => sum + w.balance, 0);
    const totalHeld = wallets.reduce((sum, w) => sum + w.heldBalance, 0);

    const platformFees = ledgerEntries
      .filter((e) => e.type === 'PLATFORM_FEE')
      .reduce((sum, e) => sum + e.amount, 0);

    const topups = ledgerEntries
      .filter((e) => e.type === 'TOPUP' && !e.bookingId)
      .reduce((sum, e) => sum + e.amount, 0);

    const delta = totalBalances + totalHeld + platformFees - topups;
    return {
      isValid: delta === 0,
      delta,
      totalBalances,
      totalHeld,
      platformFees,
      topups,
    };
  }

  it('should maintain invariant delta = 0 across a full lifecycle (top-up, hold, release with 5% fee)', () => {
    const requester: SimulatedWallet = { id: 'w1', userId: 'u1', balance: 0, heldBalance: 0 };
    const provider: SimulatedWallet = { id: 'w2', userId: 'u2', balance: 0, heldBalance: 0 };
    const wallets = [requester, provider];
    const ledger: SimulatedLedgerEntry[] = [];

    // 1. Requester tops up ₹1,000 (100,000 paise)
    const topupAmount = 100000;
    requester.balance += topupAmount;
    ledger.push({ type: 'TOPUP', amount: topupAmount, bookingId: null });
    expect(verifyInvariant(wallets, ledger).isValid).toBe(true);

    // 2. Booking created for ₹500 (50,000 paise) -> Escrow Hold
    const agreedPrice = 50000;
    requester.balance -= agreedPrice;
    requester.heldBalance += agreedPrice;
    ledger.push({ type: 'ESCROW_HOLD', amount: agreedPrice, bookingId: 'b1' });
    expect(verifyInvariant(wallets, ledger).isValid).toBe(true);

    // 3. Booking completed & payment released -> 5% fee (2,500 paise), net to provider 47,500 paise
    const fee = Math.round(agreedPrice * 0.05);
    const providerPayout = agreedPrice - fee;

    requester.heldBalance -= agreedPrice;
    provider.balance += providerPayout;

    ledger.push({ type: 'ESCROW_RELEASE', amount: agreedPrice, bookingId: 'b1' });
    ledger.push({ type: 'TOPUP', amount: providerPayout, bookingId: 'b1' }); // earning
    ledger.push({ type: 'PLATFORM_FEE', amount: fee, bookingId: 'b1' });

    const audit = verifyInvariant(wallets, ledger);
    expect(audit.isValid).toBe(true);
    expect(audit.delta).toBe(0);
    expect(audit.totalBalances).toBe(50000 + 47500); // 97,500
    expect(audit.platformFees).toBe(2500);
    expect(audit.totalHeld).toBe(0);
    expect(audit.topups).toBe(100000);
  });

  it('should maintain invariant delta = 0 on dispute custom split settlement', () => {
    const requester: SimulatedWallet = { id: 'w1', userId: 'u1', balance: 50000, heldBalance: 50000 };
    const provider: SimulatedWallet = { id: 'w2', userId: 'u2', balance: 0, heldBalance: 0 };
    const wallets = [requester, provider];
    const ledger: SimulatedLedgerEntry[] = [
      { type: 'TOPUP', amount: 100000, bookingId: null },
      { type: 'ESCROW_HOLD', amount: 50000, bookingId: 'b1' },
    ];

    expect(verifyInvariant(wallets, ledger).isValid).toBe(true);

    // Dispute 60/40 Split Resolution on 50,000 paise escrow
    const totalAmount = 50000;
    const splitPercent = 60; // 60% refund to requester
    const requesterRefund = Math.floor((totalAmount * splitPercent) / 100); // 30,000
    const providerGross = totalAmount - requesterRefund; // 20,000
    const fee = Math.round(providerGross * 0.05); // 1,000
    const providerPayout = providerGross - fee; // 19,000

    requester.heldBalance -= totalAmount;
    requester.balance += requesterRefund;
    provider.balance += providerPayout;

    ledger.push({ type: 'REFUND', amount: requesterRefund, bookingId: 'b1' });
    ledger.push({ type: 'TOPUP', amount: providerPayout, bookingId: 'b1' });
    ledger.push({ type: 'PLATFORM_FEE', amount: fee, bookingId: 'b1' });

    const audit = verifyInvariant(wallets, ledger);
    expect(audit.isValid).toBe(true);
    expect(audit.delta).toBe(0);
    expect(audit.totalBalances + audit.platformFees).toBe(audit.topups);
  });
});
