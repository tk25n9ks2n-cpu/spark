import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const loadEnvFile = () => {
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '..', '.env'),
    path.resolve(process.cwd(), '..', '..', '.env'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../../../.env')
  ];

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;

    const contents = fs.readFileSync(candidate, 'utf8');
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) continue;

      const key = trimmed.slice(0, separatorIndex).trim();
      const rawValue = trimmed.slice(separatorIndex + 1).trim();
      const value = rawValue.replace(/^['"]|['"]$/g, '');

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
};

loadEnvFile();

process.env.DATABASE_URL = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/tinder_clone';
process.env.JWT_ACCESS_SECRET ||= 'super_secret_access_key';
process.env.JWT_REFRESH_SECRET ||= 'super_secret_refresh_key';
process.env.FRONTEND_URL ||= 'http://localhost:5173';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});
