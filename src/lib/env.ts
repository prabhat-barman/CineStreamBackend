import 'dotenv/config';

function parseList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'dev_secret_replace_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  adminEmail: process.env.ADMIN_EMAIL ?? 'admin@cinestream.app',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'admin123',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  mongoUri:
    process.env.MONGODB_URI ??
    process.env.MONGO_URL ??
    'mongodb://127.0.0.1:27017/cinestream',
  useMemoryDb:
    (process.env.USE_MEMORY_DB ?? '').toLowerCase() === 'true' ||
    process.env.USE_MEMORY_DB === '1',

  // OAuth — comma-separated allow-lists of client IDs (audiences) that we accept
  // Google: put every OAuth 2.0 Client ID you use (iOS, Android, Web).
  googleClientIds: parseList(process.env.GOOGLE_CLIENT_IDS),
  // Apple: the bundle IDs / service IDs that appear as the `aud` claim.
  // On iOS native sign-in this is your app's bundle ID (e.g. org.reactjs.native.example.CineStream).
  appleClientIds: parseList(process.env.APPLE_CLIENT_IDS),
};
