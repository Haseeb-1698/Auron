import { Sequelize } from 'sequelize-typescript';
import { logger } from '@utils/logger';
import { User } from '@models/User';
import { Lab } from '@models/Lab';
import { LabInstance } from '@models/LabInstance';
import { UserProgress } from '@models/UserProgress';
import { UserBadge } from '@models/UserBadge';
import { Badge } from '@models/Badge';
import { Scan } from '@models/Scan';
import { Report } from '@models/Report';
import { CollaborationSession } from '@models/CollaborationSession';
import { CollaborationParticipant } from '@models/CollaborationParticipant';

/**
 * Database Configuration
 * Configures PostgreSQL connection with Sequelize ORM
 */

const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'auron_db',
  DB_USER = 'auron_user',
  DB_PASSWORD = 'auron_secure_password',
  DB_POOL_MIN = '2',
  DB_POOL_MAX = '10',
  NODE_ENV = 'development',
} = process.env;

export const sequelize = new Sequelize({
  dialect: 'postgres' as const,
  host: DB_HOST,
  port: parseInt(DB_PORT, 10),
  database: DB_NAME,
  username: DB_USER,
  password: DB_PASSWORD,
  models: [User, Lab, LabInstance, UserProgress, UserBadge, Badge, Scan, Report, CollaborationSession, CollaborationParticipant],
  logging: NODE_ENV === 'development' ? (msg: string) => logger.debug(msg) : false,
  pool: {
    min: parseInt(DB_POOL_MIN, 10),
    max: parseInt(DB_POOL_MAX, 10),
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
  },
} as any);

/**
 * Connect to database
 */
export async function connectDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');

    if (NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Database synchronized');
    }
  } catch (error) {
    logger.error('Unable to connect to database:', error);
    throw error;
  }
}

/**
 * Close database connection
 */
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await sequelize.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
}

export default sequelize;
export const db = sequelize;
