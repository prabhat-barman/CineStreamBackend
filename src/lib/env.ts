import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'dev_secret_replace_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  adminEmail: process.env.ADMIN_EMAIL ?? 'admin@cinestream.app',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'admin123',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
};
