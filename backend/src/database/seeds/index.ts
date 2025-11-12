import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { Lab } from '@models/Lab';
import { User } from '@models/User';
import { Badge } from '@models/Badge';
import AuthService from '@services/AuthService';
import { labsSeedData } from './labs-seed';
import { badgesSeedData } from './badges-seed';
import { logger } from '@utils/logger';

dotenv.config();

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'auron_db',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  logging: false,
});

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Connect to database
    await sequelize.authenticate();
    console.log('✓ Database connected\n');

    // Seed users
    console.log('📝 Seeding users...');
    await seedUsers();
    console.log('✓ Users seeded\n');

    // Seed labs
    console.log('📝 Seeding labs...');
    await seedLabs();
    console.log('✓ Labs seeded\n');

    // Seed badges
    console.log('📝 Seeding badges...');
    await seedBadges();
    console.log('✓ Badges seeded\n');

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

async function seedUsers() {
  const users = [
    {
      username: 'admin',
      email: 'admin@auron.local',
      password: 'Admin@123456',
      fullName: 'System Administrator',
      role: 'admin' as const,
      isActive: true,
      isVerified: true,
    },
    {
      username: 'instructor',
      email: 'instructor@auron.local',
      password: 'Instructor@123',
      fullName: 'John Instructor',
      role: 'instructor' as const,
      isActive: true,
      isVerified: true,
    },
    {
      username: 'student',
      email: 'student@auron.local',
      password: 'Student@123',
      fullName: 'Alice Student',
      role: 'student' as const,
      isActive: true,
      isVerified: true,
    },
    {
      username: 'student2',
      email: 'student2@auron.local',
      password: 'Student@123',
      fullName: 'Bob Student',
      role: 'student' as const,
      isActive: true,
      isVerified: true,
    },
  ];

  for (const userData of users) {
    const existingUser = await User.findOne({ where: { email: userData.email } });

    if (!existingUser) {
      await AuthService.register(userData);
      console.log(`  ✓ Created user: ${userData.username} (${userData.email})`);
    } else {
      console.log(`  - User already exists: ${userData.username}`);
    }
  }
}

async function seedLabs() {
  for (const labData of labsSeedData) {
    const existingLab = await Lab.findOne({ where: { name: labData.name } });

    if (!existingLab) {
      await Lab.create(labData);
      console.log(`  ✓ Created lab: ${labData.name}`);
    } else {
      console.log(`  - Lab already exists: ${labData.name}`);
    }
  }
}

async function seedBadges() {
  for (const badgeData of badgesSeedData) {
    const existingBadge = await Badge.findOne({ where: { name: badgeData.name } });

    if (!existingBadge) {
      await Badge.create(badgeData);
      console.log(`  ✓ Created badge: ${badgeData.name}`);
    } else {
      console.log(`  - Badge already exists: ${badgeData.name}`);
    }
  }
}

// Run seeding
seedDatabase();
