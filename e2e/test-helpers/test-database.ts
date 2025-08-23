import { PrismaClient } from '@prisma/client';

/**
 * Test database utilities for E2E tests
 */
export class TestDatabase {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Set up test users for authentication scenarios
   */
  async seedTestUsers() {
    // Create existing user for testing "user already exists" scenarios
    await this.prisma.user.upsert({
      where: { email: 'existing@example.com' },
      update: {},
      create: {
        email: 'existing@example.com',
        name: 'Existing User',
        image: null,
      },
    });

    console.log('✅ Test users seeded');
  }

  /**
   * Clean up test data
   */
  async cleanup() {
    // Clean up test users
    await this.prisma.user.deleteMany({
      where: {
        email: {
          in: ['existing@example.com', 'newuser@example.com', 'test@example.com'],
        },
      },
    });

    console.log('✅ Test data cleaned up');
  }

  /**
   * Check if user exists
   */
  async userExists(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return !!user;
  }

  /**
   * Create a test user (or update if exists)
   */
  async createTestUser(email: string, name: string = 'Test User') {
    return await this.prisma.user.upsert({
      where: { email },
      update: { name },
      create: {
        email,
        name,
        image: null,
      },
    });
  }

  /**
   * Delete a test user
   */
  async deleteTestUser(email: string) {
    await this.prisma.user.deleteMany({
      where: { email },
    });
  }

  /**
   * Close database connection
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}
