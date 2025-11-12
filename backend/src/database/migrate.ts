import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'auron_db',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  logging: console.log,
});

async function runMigrations() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected successfully');

    const migrationsPath = path.join(__dirname, 'migrations');
    const migrationFiles = fs
      .readdirSync(migrationsPath)
      .filter((file) => file.endsWith('.ts') || file.endsWith('.js'))
      .sort();

    console.log(`Found ${migrationFiles.length} migration files`);

    for (const file of migrationFiles) {
      console.log(`\nRunning migration: ${file}`);
      const migrationPath = path.join(migrationsPath, file);
      const migration = require(migrationPath);

      if (migration.up) {
        await migration.up(sequelize.getQueryInterface(), Sequelize);
        console.log(`✓ Migration ${file} completed successfully`);
      } else {
        console.log(`⚠ Migration ${file} has no 'up' function, skipping`);
      }
    }

    console.log('\n✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigrations();
