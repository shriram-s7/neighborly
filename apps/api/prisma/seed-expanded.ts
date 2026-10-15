import { PrismaClient, Role, VerificationLevel, BookingStatus, BookingPaymentMode, LedgerEntryType, PricingType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Running expanded seed dataset for Neighborly demo...');

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Demo@123', salt);

  // 1. Fetch existing neighborhoods & categories
  const neighborhoods = await prisma.neighborhood.findMany();
  const nMap = Object.fromEntries(neighborhoods.map((n) => [n.name, n]));

  const categories = await prisma.category.findMany();
  const cMap = Object.fromEntries(categories.map((c) => [c.slug, c]));

  if (!nMap['Ramapuram'] || !cMap['plumbing']) {
    console.error('Please run base seed first: pnpm --filter @neighborly/api seed');
    return;
  }

  // 2. Expanded Providers List
  const newProviders = [
    {
      name: 'Selvam Murugan',
      email: 'selvam.plumber@demo.in',
      phone: '9840111222',
      neighborhood: 'Ramapuram',
      lat: 13.0318,
      lng: 80.1822,
      headline: 'Licensed Master Plumber & Leak Specialist',
      years: 10,
      verification: VerificationLevel.ID,
      trust: 92,
      category: 'plumbing',
      title: 'Emergency Leak Fix, Bathroom Fittings & Drain Cleaning',
      price: 40000,
      barter: true,
    },
    {
      name: 'Meenakshi Ammal',
      email: 'meenakshi.cook@demo.in',
      phone: '9840222333',
      neighborhood: 'Ramapuram',
      lat: 13.0325,
      lng: 80.1805,
      headline: 'Authentic Traditional South Indian Home Cook',
      years: 15,
      verification: VerificationLevel.ADDRESS,
      trust: 95,
      category: 'home-cooking',
      title: 'Daily Tiffin Meals, Sambar, Rasam & Festive Feasts',
      price: 35000,
      barter: true,
    },
    {
      name: 'Ananya Ramesh',
      email: 'ananya.math@demo.in',
      phone: '9840333444',
      neighborhood: 'Ramapuram',
      lat: 13.0305,
      lng: 80.1830,
      headline: 'CBSE & ICSE Math & Physics Tutor (Class 8-12)',
      years: 5,
      verification: VerificationLevel.ID,
      trust: 89,
      category: 'tutoring',
      title: 'Personalized Math Coaching & Board Exam Prep',
      price: 50000,
      barter: true,
    },
    {
      name: 'Vikram Soundar',
      email: 'vikram.tech@demo.in',
      phone: '9840444555',
      neighborhood: 'Porur',
      lat: 13.0375,
      lng: 80.1580,
      headline: 'PC, Laptop & WiFi Network Troubleshooting',
      years: 6,
      verification: VerificationLevel.PHONE,
      trust: 84,
      category: 'tech-help',
      title: 'Windows/Mac OS Repair, SSD Upgrade & WiFi Setup',
      price: 45000,
      barter: false,
    },
    {
      name: 'Lakshmi Narayanan',
      email: 'lakshmi.tailor@demo.in',
      phone: '9840555666',
      neighborhood: 'Porur',
      lat: 13.0390,
      lng: 80.1550,
      headline: 'Custom Blouse, Kurti & Alteration Tailoring',
      years: 12,
      verification: VerificationLevel.ADDRESS,
      trust: 93,
      category: 'tailoring',
      title: 'Same-Day Fitting Alterations & Designer Blouses',
      price: 30000,
      barter: true,
    },
    {
      name: 'Arumugam K',
      email: 'arumugam.clean@demo.in',
      phone: '9840666777',
      neighborhood: 'Porur',
      lat: 13.0360,
      lng: 80.1595,
      headline: 'Deep Cleaning & Floor Polishing Specialist',
      years: 7,
      verification: VerificationLevel.PHONE,
      trust: 82,
      category: 'cleaning',
      title: 'Kitchen & Bathroom Sanitization Deep Clean',
      price: 60000,
      barter: false,
    },
    {
      name: 'Sanjay Krishnan',
      email: 'sanjay.pets@demo.in',
      phone: '9840777888',
      neighborhood: 'Valasaravakkam',
      lat: 13.0415,
      lng: 80.1710,
      headline: 'Certified Canine Trainer & Dog Walking Specialist',
      years: 6,
      verification: VerificationLevel.ADDRESS,
      trust: 91,
      category: 'pet-care',
      title: 'Daily Dog Walking, Feeding & Puppy Basic Training',
      price: 40000,
      barter: true,
    },
    {
      name: 'Mani Plumber',
      email: 'mani.plumber@demo.in',
      phone: '9840888999',
      neighborhood: 'Valasaravakkam',
      lat: 13.0400,
      lng: 80.1735,
      headline: 'Domestic Pipeline & Tank Cleaning Expert',
      years: 9,
      verification: VerificationLevel.ID,
      trust: 88,
      category: 'plumbing',
      title: 'Water Tank Float Valve & Sump Pump Repair',
      price: 45000,
      barter: false,
    },
    {
      name: 'Sneha Dogwalker',
      email: 'sneha.pets@demo.in',
      phone: '9840999000',
      neighborhood: 'KK Nagar',
      lat: 13.0420,
      lng: 80.1980,
      headline: 'Compassionate Pet Boarding & Dog Grooming',
      years: 4,
      verification: VerificationLevel.ID,
      trust: 87,
      category: 'pet-care',
      title: 'In-Home Pet Sitting & Cat/Dog Weekend Sitting',
      price: 50000,
      barter: true,
    },
    {
      name: 'Harish IT',
      email: 'harish.pc@demo.in',
      phone: '9840000111',
      neighborhood: 'KK Nagar',
      lat: 13.0405,
      lng: 80.2010,
      headline: 'Senior Hardware Engineer & Smart Home Setup',
      years: 8,
      verification: VerificationLevel.ADDRESS,
      trust: 94,
      category: 'tech-help',
      title: 'Smart TV, CCTV Camera & Printer Network Setup',
      price: 50000,
      barter: true,
    },
  ];

  const createdProviders: any[] = [];

  for (const p of newProviders) {
    let user = await prisma.user.findUnique({ where: { email: p.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: p.name,
          email: p.email,
          phone: p.phone,
          passwordHash,
          role: Role.USER,
          isProvider: true,
          neighborhoodId: nMap[p.neighborhood].id,
          lat: p.lat,
          lng: p.lng,
          verificationLevel: p.verification,
          wallet: {
            create: {
              balance: 100000, // ₹1,000 initial balance
              heldBalance: 0,
              credits: 10,
              entries: {
                create: {
                  type: LedgerEntryType.TOPUP,
                  amount: 100000,
                  balanceAfter: 100000,
                  description: 'Initial seed wallet balance',
                },
              },
            },
          },
          providerProfile: {
            create: {
              headline: p.headline,
              yearsExperience: p.years,
              serviceRadiusKm: 5.0,
              trustScore: p.trust,
              completionRate: 0.95,
              onTimeRate: 0.93,
              avgResponseMins: 12,
              trustBreakdown: {
                verificationPoints: p.verification === 'ADDRESS' ? 20 : p.verification === 'ID' ? 15 : 5,
                ratingPoints: 22,
                completionPoints: 19,
                reliabilityPoints: 14,
                tenurePoints: 8,
                authenticityPoints: 10,
                penalties: 0,
                totalScore: p.trust,
                tier: p.trust >= 85 ? 'Pillar of the Community' : 'Highly Trusted',
                tips: ['Keep up on-time completions to maintain high standing'],
              },
            },
          },
        },
      });

      // Create service listing
      const listing = await prisma.serviceListing.create({
        data: {
          providerId: user.id,
          categoryId: cMap[p.category].id,
          title: p.title,
          description: `Professional ${p.category} services offered by certified resident of ${p.neighborhood}. Fast response and guaranteed quality.`,
          pricingType: PricingType.FIXED,
          price: p.price,
          acceptsBarter: p.barter,
          isActive: true,
        },
      });

      // Create weekly availability
      for (let day = 1; day <= 6; day++) {
        await prisma.availabilitySlot.create({
          data: {
            providerId: user.id,
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '18:00',
          },
        });
      }

      createdProviders.push({ user, listing });
    }
  }

  console.log(`✅ Seeded ${createdProviders.length} additional verified community providers`);

  // 3. Seed 10 Requesters
  const requesterNames = [
    { name: 'Divya Natarajan', email: 'divya@demo.in', n: 'Ramapuram' },
    { name: 'Arun Balaji', email: 'arun@demo.in', n: 'Ramapuram' },
    { name: 'Ganesh Kumar', email: 'ganesh@demo.in', n: 'Porur' },
    { name: 'Deepika Mohan', email: 'deepika@demo.in', n: 'Porur' },
    { name: 'Siddharth Rao', email: 'siddharth@demo.in', n: 'Porur' },
    { name: 'Keerthi Suresh', email: 'keerthi@demo.in', n: 'Valasaravakkam' },
    { name: 'Naveen Raj', email: 'naveen@demo.in', n: 'Valasaravakkam' },
    { name: 'Swetha Venkat', email: 'swetha@demo.in', n: 'KK Nagar' },
    { name: 'Manoj Prabhakar', email: 'manoj@demo.in', n: 'KK Nagar' },
    { name: 'Pooja Iyer', email: 'pooja@demo.in', n: 'KK Nagar' },
  ];

  const createdRequesters: any[] = [];
  for (const r of requesterNames) {
    let user = await prisma.user.findUnique({ where: { email: r.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: r.name,
          email: r.email,
          passwordHash,
          role: Role.USER,
          isProvider: false,
          neighborhoodId: nMap[r.n].id,
          verificationLevel: VerificationLevel.PHONE,
          wallet: {
            create: {
              balance: 200000, // ₹2,000
              heldBalance: 0,
              credits: 10,
              entries: {
                create: {
                  type: LedgerEntryType.TOPUP,
                  amount: 200000,
                  balanceAfter: 200000,
                  description: 'Initial seed resident wallet credit',
                },
              },
            },
          },
        },
      });
      createdRequesters.push(user);
    }
  }
  console.log(`✅ Seeded ${createdRequesters.length} resident requesters`);

  // 4. Create 1 Active Dispute for Demo
  const priyaUser = await prisma.user.findUnique({ where: { email: 'requester@demo.in' } });
  const karthikUser = await prisma.user.findUnique({ where: { email: 'provider@demo.in' } });
  const karthikListing = await prisma.serviceListing.findFirst({ where: { providerId: karthikUser?.id } });

  if (priyaUser && karthikUser && karthikListing) {
    const existingDisputeBooking = await prisma.booking.findFirst({
      where: {
        requesterId: priyaUser.id,
        status: BookingStatus.DISPUTED,
      },
    });

    if (!existingDisputeBooking) {
      // Create a disputed booking
      const agreedPrice = 45000;
      const disputeBooking = await prisma.booking.create({
        data: {
          listingId: karthikListing.id,
          requesterId: priyaUser.id,
          providerId: karthikUser.id,
          scheduledAt: new Date(Date.now() - 24 * 3600 * 1000),
          agreedPrice,
          paymentMode: BookingPaymentMode.WALLET,
          status: BookingStatus.DISPUTED,
          events: {
            createMany: {
              data: [
                {
                  fromStatus: null,
                  toStatus: BookingStatus.REQUESTED,
                  actorId: priyaUser.id,
                  note: 'Booking initiated with ₹450 escrow hold',
                },
                {
                  fromStatus: BookingStatus.REQUESTED,
                  toStatus: BookingStatus.ACCEPTED,
                  actorId: karthikUser.id,
                  note: 'Provider accepted repair job',
                },
                {
                  fromStatus: BookingStatus.ACCEPTED,
                  toStatus: BookingStatus.DISPUTED,
                  actorId: priyaUser.id,
                  note: 'Resident raised dispute: Circuit sparked again after repair',
                },
              ],
            },
          },
          dispute: {
            create: {
              raisedById: priyaUser.id,
              reason: 'Electrical circuit issue recurred after servicing',
              evidenceText: 'The bathroom geyser switch sparked immediately when switched on after provider left. Requesting 50% split or re-inspection.',
              status: 'OPEN',
            },
          },
        },
      });

      // Adjust Priya wallet held balance to maintain double-entry invariant
      const priyaWallet = await prisma.wallet.update({
        where: { userId: priyaUser.id },
        data: {
          heldBalance: { increment: agreedPrice },
          balance: { decrement: agreedPrice },
        },
      });

      await prisma.ledgerEntry.create({
        data: {
          walletId: priyaWallet.id,
          bookingId: disputeBooking.id,
          type: LedgerEntryType.ESCROW_HOLD,
          amount: agreedPrice,
          balanceAfter: priyaWallet.balance,
          description: 'Escrow hold for disputed booking',
        },
      });

      console.log('✅ Seeded 1 Active Demo Dispute (Priya vs Karthik)');
    }
  }

  // 5. Create 1 Flagged Review for Fraud Moderation Demo
  if (karthikUser && priyaUser && karthikListing) {
    const existingFlagged = await prisma.review.findFirst({
      where: { isFlagged: true },
    });

    if (!existingFlagged) {
      // Find a completed booking
      const completedBooking = await prisma.booking.findFirst({
        where: {
          providerId: karthikUser.id,
          status: { in: [BookingStatus.PAID, BookingStatus.REVIEWED] },
        },
      });

      if (completedBooking) {
        await prisma.review.upsert({
          where: { bookingId: completedBooking.id },
          update: {},
          create: {
            bookingId: completedBooking.id,
            reviewerId: priyaUser.id,
            revieweeId: karthikUser.id,
            rating: 5,
            comment: 'Super fast!!',
            isFlagged: true,
            flagReasons: [
              'Rapid completion (< 2 mins) with 5-star rating (potential collusion/self-review)',
              'Very short uninformative comment with extreme rating',
            ],
          },
        });
        console.log('✅ Seeded 1 Flagged Review for Moderation Queue');
      }
    }
  }

  console.log('🎉 Expanded seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Expanded seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
