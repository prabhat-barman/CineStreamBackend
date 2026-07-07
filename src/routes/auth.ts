import {Router, type NextFunction, type Request, type Response} from 'express';
import bcrypt from 'bcryptjs';
import {z} from 'zod';
import {db} from '../data/store';
import {signToken} from '../lib/jwt';
import {requireAuth} from '../middleware/auth';
import {
  OAuthVerifyError,
  verifyAppleIdentityToken,
  verifyGoogleIdToken,
} from '../lib/oauth';
import type {PublicUser, User} from '../lib/types';

const router = Router();

function toPublic(u: User): PublicUser {
  const {passwordHash: _pw, ...rest} = u;
  return rest;
}

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const googleSocialSchema = z.object({
  idToken: z.string().min(20),
});

const appleSocialSchema = z.object({
  identityToken: z.string().min(20),
  name: z.string().max(120).optional(),
  email: z.string().email().optional(),
});

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({error: 'Invalid input', details: parsed.error.flatten()});
    }
    try {
      const user = await db.createUser(parsed.data);
      const token = signToken({
        sub: user.id,
        role: user.role,
        email: user.email,
      });
      return res.status(201).json({token, user: toPublic(user)});
    } catch (err) {
      if ((err as Error).message === 'EMAIL_TAKEN') {
        return res.status(409).json({error: 'Email already registered'});
      }
      throw err;
    }
  }),
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({error: 'Invalid input'});
    }
    const user = await db.findUserByEmail(parsed.data.email);
    if (!user || !user.passwordHash) {
      return res.status(401).json({error: 'Invalid credentials'});
    }
    if (!bcrypt.compareSync(parsed.data.password, user.passwordHash)) {
      return res.status(401).json({error: 'Invalid credentials'});
    }
    const token = signToken({sub: user.id, role: user.role, email: user.email});
    return res.json({token, user: toPublic(user)});
  }),
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await db.findUserById(req.user!.sub);
    if (!user) {
      return res.status(404).json({error: 'User not found'});
    }
    return res.json({user: toPublic(user)});
  }),
);

router.post(
  '/social/google',
  asyncHandler(async (req, res) => {
    const parsed = googleSocialSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({error: 'Invalid input', details: parsed.error.flatten()});
    }
    try {
      const profile = await verifyGoogleIdToken(parsed.data.idToken);
      const user = await db.upsertSocialUser(profile);
      const token = signToken({
        sub: user.id,
        role: user.role,
        email: user.email,
      });
      return res.json({token, user: toPublic(user)});
    } catch (err) {
      if (err instanceof OAuthVerifyError) {
        return res.status(err.status).json({error: err.message});
      }
      throw err;
    }
  }),
);

router.post(
  '/social/apple',
  asyncHandler(async (req, res) => {
    const parsed = appleSocialSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({error: 'Invalid input', details: parsed.error.flatten()});
    }
    try {
      const profile = await verifyAppleIdentityToken(
        parsed.data.identityToken,
        {name: parsed.data.name, email: parsed.data.email},
      );
      const user = await db.upsertSocialUser(profile);
      const token = signToken({
        sub: user.id,
        role: user.role,
        email: user.email,
      });
      return res.json({token, user: toPublic(user)});
    } catch (err) {
      if (err instanceof OAuthVerifyError) {
        return res.status(err.status).json({error: err.message});
      }
      throw err;
    }
  }),
);

export default router;
