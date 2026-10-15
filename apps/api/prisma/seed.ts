import { PrismaClient, Role, VerificationLevel } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
console.log('Seed DATABASE_URL:', process.env.DATABASE_URL);
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Neighborly initial database seed...');

  // 1. Seed Neighborhoods
  const neighborhoodsData = [
    { name: 'Ramapuram', city: 'Chennai', centerLat: 13.0315, centerLng: 80.1817, radiusKm: 2.5 },
    { name: 'Valasaravakkam', city: 'Chennai', centerLat: 13.0403, centerLng: 80.1723, radiusKm: 2.0 },
    { name: 'Porur', city: 'Chennai', centerLat: 13.0382, centerLng: 80.1565, radiusKm: 3.0 },
    { name: 'KK Nagar', city: 'Chennai', centerLat: 13.0410, centerLng: 80.1994, radiusKm: 2.5 },
  ];

  const neighborhoods: Record<string, any> = {};
  for (const n of neighborhoodsData) {
    const existing = await prisma.neighborhood.findFirst({ where: { name: n.name } });
    if (!existing) {
      neighborhoods[n.name] = await prisma.neighborhood.create({ data: n });
    } else {
      neighborhoods[n.name] = existing;
    }
  }
  console.log(`✅ Seeded ${Object.keys(neighborhoods).length} neighborhoods`);

  // 2. Seed Categories
  const categoriesData = [
    {
      name: 'Electrical & Repairs',
      slug: 'electrical-repairs',
      icon: 'Zap',
      keywords: ['electrician', 'fan', 'wiring', 'switch', 'light', 'repair', 'fuse', 'mcb', 'ac', 'geyser', 'short circuit', 'appliance', 'inverter'],
    },
    {
      name: 'Plumbing',
      slug: 'plumbing',
      icon: 'Wrench',
      keywords: ['plumber', 'pipe', 'leak', 'tap', 'drain', 'sink', 'toilet', 'flush', 'water tank', 'blockage', 'bathroom', 'shower'],
    },
    {
      name: 'Tutoring',
      slug: 'tutoring',
      icon: 'BookOpen',
      keywords: ['tutor', 'maths', 'science', 'physics', 'chemistry', 'english', 'exam', 'cbse', 'icse', 'homework', 'coding', 'languages'],
    },
    {
      name: 'Home Cooking',
      slug: 'home-cooking',
      icon: 'Utensils',
      keywords: ['cook', 'chef', 'meals', 'tiffin', 'south indian', 'north indian', 'catering', 'party food', 'baking', 'diet', 'chapati'],
    },
    {
      name: 'Tailoring',
      slug: 'tailoring',
      icon: 'Scissors',
      keywords: ['tailor', 'stitching', 'alteration', 'blouse', 'dress', 'kurta', 'zipper', 'hemming', 'embroidery', 'curtains'],
    },
    {
      name: 'Tech Help',
      slug: 'tech-help',
      icon: 'Laptop',
      keywords: ['computer', 'laptop', 'wifi', 'printer', 'phone', 'software', 'windows', 'network', 'router', 'setup', 'virus', 'backup'],
    },
    {
      name: 'Pet Care',
      slug: 'pet-care',
      icon: 'Dog',
      keywords: ['dog walking', 'pet sitting', 'grooming', 'cat', 'dog', 'vet', 'feeding', 'boarding', 'training'],
    },
    {
      name: 'Cleaning',
      slug: 'cleaning',
      icon: 'Sparkles',
      keywords: ['house cleaning', 'deep cleaning', 'kitchen', 'bathroom', 'sofa cleaning', 'carpet', 'dusting', 'mopping'],
    },
  ];

  const categories: Record<string, any> = {};
  for (const c of categoriesData) {
    const existing = await prisma.category.findUnique({ where: { slug: c.slug } });
    if (!existing) {
      categories[c.slug] = await prisma.category.create({ data: c });
    } else {
      categories[c.slug] = existing;
    }
  }
  console.log(`✅ Seeded ${Object.keys(categories).length} categories`);

  // 3. Seed Fixed Demo Users
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('Demo@123', salt);

  // Requester
  const requesterEmail = 'requester@demo.in';
  let requester = await prisma.user.findUnique({ where: { email: requesterEmail } });
  if (!requester) {
    requester = await prisma.user.create({
      data: {
        name: 'Priya Sundaram',
        email: requesterEmail,
        phone: '9840123456',
        passwordHash: defaultPasswordHash,
        role: Role.USER,
        isProvider: false,
        neighborhoodId: neighborhoods['Ramapuram'].id,
        lat: 13.032,
        lng: 80.182,
        bio: 'Long-time resident of Ramapuram. Active community requester.',
        verificationLevel: VerificationLevel.PHONE,
        wallet: {
          create: {
            balance: 250000, // ₹2,500
            heldBalance: 0,
            credits: 25,
            entries: {
              create: {
                type: 'TOPUP',
                amount: 250000,
                balanceAfter: 250000,
                description: 'Initial demo wallet credit',
              },
            },
          },
        },
      },
    });
  }

  // Provider
  const providerEmail = 'provider@demo.in';
  let provider = await prisma.user.findUnique({ where: { email: providerEmail } });
  if (!provider) {
    provider = await prisma.user.create({
      data: {
        name: 'Karthik Raja',
        email: providerEmail,
        phone: '9840987654',
        passwordHash: defaultPasswordHash,
        role: Role.USER,
        isProvider: true,
        neighborhoodId: neighborhoods['Ramapuram'].id,
        lat: 13.033,
        lng: 80.180,
        bio: 'Certified electrician with 8+ years experience in domestic & commercial setups.',
        verificationLevel: VerificationLevel.ADDRESS,
        wallet: {
          create: {
            balance: 180000, // ₹1,800
            heldBalance: 0,
            credits: 15,
            entries: {
              create: {
                type: 'TOPUP',
                amount: 180000,
                balanceAfter: 180000,
                description: 'Initial earnings credit',
              },
            },
          },
        },
        providerProfile: {
          create: {
            headline: 'Master Electrician & Home Appliance Specialist',
            yearsExperience: 8,
            serviceRadiusKm: 5.0,
            trustScore: 88, // Highly Trusted
            completionRate: 0.96,
            avgResponseMins: 14,
            onTimeRate: 0.94,
            trustBreakdown: {
              verificationPoints: 25,
              ratingPoints: 23,
              completionPoints: 19,
              reliabilityPoints: 9,
              tenurePoints: 6,
              authenticityPoints: 8,
              penalties: 2,
              totalScore: 88,
              tier: 'Highly Trusted',
              tips: ['Complete 5 more on-time jobs to unlock Pillar of Community badge (+4 pts)'],
            },
          },
        },
      },
    });

    // Create a listing for this provider
    await prisma.serviceListing.create({
      data: {
        providerId: provider.id,
        categoryId: categories['electrical-repairs'].id,
        title: 'Ceiling Fan, Geyser & Switchboard Electrical Repairs',
        description: 'Complete inspection, wiring fault tracing, ceiling fan replacement, and geyser thermostat repairs.',
        pricingType: 'FIXED',
        price: 45000, // ₹450
        acceptsBarter: true,
        isActive: true,
      },
    });

    // Create weekly availability
    for (let day = 1; day <= 6; day++) {
      await prisma.availabilitySlot.create({
        data: {
          providerId: provider.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '19:00',
        },
      });
    }
  }

  // Admin
  const adminEmail = 'admin@demo.in';
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        name: 'Neighborly Administrator',
        email: adminEmail,
        phone: '9999900000',
        passwordHash: defaultPasswordHash,
        role: Role.ADMIN,
        isProvider: false,
        neighborhoodId: neighborhoods['Ramapuram'].id,
        bio: 'Community Administrator for Chennai neighborhoods.',
        verificationLevel: VerificationLevel.ADDRESS,
        wallet: {
          create: {
            balance: 500000,
            heldBalance: 0,
            credits: 100,
            entries: {
              create: {
                type: 'TOPUP',
                amount: 500000,
                balanceAfter: 500000,
                description: 'Initial admin seed treasury topup',
              },
            },
          },
        },
      },
    });
  }

  console.log('✅ Demo accounts ready:');
  console.log('   Requester: requester@demo.in / Demo@123');
  console.log('   Provider:  provider@demo.in  / Demo@123');
  console.log('   Admin:     admin@demo.in     / Demo@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
