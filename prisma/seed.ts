import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  
  // Create a test user
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      image: null,
    },
  });

  console.log('✅ Created test user:', testUser);

  // Create sample events
  const events = [
    {
      name: "John's Birthday",
      date: new Date('2024-03-15'),
      category: 'Birthday',
      color: '#FF6B6B',
      recurrence: 'Yearly',
      notes: 'Best friend since college',
      reminders: ['1 week', '1 day'],
      userId: testUser.id,
    },
    {
      name: "Wedding Anniversary",
      date: new Date('2024-06-20'),
      category: 'Anniversary', 
      color: '#4ECDC4',
      recurrence: 'Yearly',
      notes: 'Our special day!',
      reminders: ['2 weeks', '1 week', '1 day'],
      userId: testUser.id,
    },
    {
      name: "Mom's Birthday",
      date: new Date('2024-08-10'),
      category: 'Birthday',
      color: '#45B7D1',
      recurrence: 'Yearly',
      notes: 'Don\'t forget flowers!',
      reminders: ['1 week', '3 days', '1 day'],
      userId: testUser.id,
    },
  ];

  for (const event of events) {
    const existingEvent = await prisma.dateEvent.findFirst({
      where: {
        userId: event.userId,
        name: event.name,
      },
    });

    if (!existingEvent) {
      const created = await prisma.dateEvent.create({
        data: event,
      });
      console.log('✅ Created event:', created.name);
    } else {
      console.log('⚪ Event already exists:', event.name);
    }
  }

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
