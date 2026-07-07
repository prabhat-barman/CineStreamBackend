import {OAuth2Client} from 'google-auth-library';
import {createRemoteJWKSet, jwtVerify, type JWTPayload} from 'jose';
import {env} from './env';

// ------------------------------
// Shared types
// ------------------------------

export type SocialProfile = {
  provider: 'google' | 'apple';
  providerUserId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  avatar?: string;
};

export class OAuthVerifyError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = 'OAuthVerifyError';
    this.status = status;
  }
}

// ------------------------------
// Google — verify ID token
// ------------------------------

const googleClient = new OAuth2Client();

export async function verifyGoogleIdToken(idToken: string): Promise<SocialProfile> {
  const audiences = env.googleClientIds;
  if (audiences.length === 0) {
    throw new OAuthVerifyError(
      'Google Sign-In is not configured (set GOOGLE_CLIENT_IDS).',
      501,
    );
  }
  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken,
      audience: audiences,
    });
  } catch (err) {
    throw new OAuthVerifyError(
      `Google token verification failed: ${(err as Error).message}`,
    );
  }
  const payload = ticket.getPayload();
  if (!payload) {
    throw new OAuthVerifyError('Google token payload missing');
  }
  if (!payload.email) {
    throw new OAuthVerifyError('Google account did not return an email');
  }
  return {
    provider: 'google',
    providerUserId: payload.sub,
    email: payload.email.toLowerCase(),
    emailVerified: Boolean(payload.email_verified),
    name: payload.name ?? payload.email.split('@')[0],
    avatar: payload.picture,
  };
}

// ------------------------------
// Apple — verify identity token via Apple's JWKS
// ------------------------------

const APPLE_ISSUER = 'https://appleid.apple.com';
const APPLE_JWKS_URL = new URL('https://appleid.apple.com/auth/keys');

let appleJwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getAppleJwks() {
  if (!appleJwks) {
    appleJwks = createRemoteJWKSet(APPLE_JWKS_URL, {
      cacheMaxAge: 24 * 60 * 60 * 1000, // 24h
      cooldownDuration: 30 * 1000,
    });
  }
  return appleJwks;
}

type AppleTokenPayload = JWTPayload & {
  email?: string;
  email_verified?: boolean | 'true' | 'false';
  is_private_email?: boolean | 'true' | 'false';
};

export async function verifyAppleIdentityToken(
  identityToken: string,
  fallback: {name?: string; email?: string} = {},
): Promise<SocialProfile> {
  const audiences = env.appleClientIds;
  if (audiences.length === 0) {
    throw new OAuthVerifyError(
      'Apple Sign-In is not configured (set APPLE_CLIENT_IDS).',
      501,
    );
  }
  let payload: AppleTokenPayload;
  try {
    const {payload: verified} = await jwtVerify(identityToken, getAppleJwks(), {
      issuer: APPLE_ISSUER,
      audience: audiences,
    });
    payload = verified as AppleTokenPayload;
  } catch (err) {
    throw new OAuthVerifyError(
      `Apple token verification failed: ${(err as Error).message}`,
    );
  }

  const sub = payload.sub;
  if (!sub) {
    throw new OAuthVerifyError('Apple token missing subject');
  }

  const email = (payload.email ?? fallback.email)?.toLowerCase();
  if (!email) {
    throw new OAuthVerifyError(
      'Apple did not return an email. Ensure the user chose to share it on first sign-in.',
    );
  }

  const verifiedRaw = payload.email_verified;
  const emailVerified =
    verifiedRaw === true || verifiedRaw === 'true' || verifiedRaw === undefined;

  return {
    provider: 'apple',
    providerUserId: sub,
    email,
    emailVerified,
    name: fallback.name?.trim() || email.split('@')[0],
  };
}
