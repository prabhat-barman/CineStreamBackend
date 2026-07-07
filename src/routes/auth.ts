import {Router} from 'express';
import bcrypt from 'bcryptjs';
import {z} from 'zod';
import {db} from '../data/store';
import {signToken} from '../lib/jwt';
import {requireAuth} from '../middleware/auth';
import type {PublicUser, User} from '../lib/types';

const router = Router();

function toPublic(u: User): PublicUser {
  const {passwordHash: _pw, ...rest} = u;
  return rest;
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

router.post('/register', (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({error: 'Invalid input', details: parsed.error.flatten()});
  }
  try {
    const user = db.createUser(parsed.data);
    const token = signToken({sub: user.id, role: user.role, email: user.email});
    return res.status(201).json({token, user: toPublic(user)});
  } catch (err) {
    if ((err as Error).message === 'EMAIL_TAKEN') {
      return res.status(409).json({error: 'Email already registered'});
    }
    return res.status(500).json({error: 'Unable to register'});
  }
});

router.post('/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({error: 'Invalid input'});
  }
  const user = db.findUserByEmail(parsed.data.email);
  if (!user || !bcrypt.compareSync(parsed.data.password, user.passwordHash)) {
    return res.status(401).json({error: 'Invalid credentials'});
  }
  const token = signToken({sub: user.id, role: user.role, email: user.email});
  return res.json({token, user: toPublic(user)});
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.findUserById(req.user!.sub);
  if (!user) return res.status(404).json({error: 'User not found'});
  return res.json({user: toPublic(user)});
});

export default router;
