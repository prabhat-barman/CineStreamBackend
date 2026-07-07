import {Router} from 'express';
import {db} from '../data/store';
import {requireAdmin, requireAuth} from '../middleware/auth';
import type {PublicUser, User} from '../lib/types';

const router = Router();

router.use(requireAuth, requireAdmin);

function toPublic(u: User): PublicUser {
  const {passwordHash: _pw, ...rest} = u;
  return rest;
}

router.get('/stats', (_req, res) => {
  const users = db.listUsers();
  const movies = db.listMovies();
  const genreCounts: Record<string, number> = {};
  for (const m of movies) {
    for (const g of m.genres) genreCounts[g] = (genreCounts[g] ?? 0) + 1;
  }
  const topRated = [...movies].sort((a, b) => b.rating - a.rating).slice(0, 5);

  res.json({
    userCount: users.length,
    adminCount: users.filter(u => u.role === 'admin').length,
    movieCount: movies.length,
    featuredCount: movies.filter(m => m.featured).length,
    genreCounts,
    topRated,
    recentUsers: users.slice(0, 5).map(toPublic),
  });
});

router.get('/users', (_req, res) => {
  res.json({users: db.listUsers().map(toPublic)});
});

router.delete('/users/:id', (req, res) => {
  const id = String(req.params.id);
  const target = db.findUserById(id);
  if (!target) return res.status(404).json({error: 'User not found'});
  if (target.role === 'admin') {
    return res.status(400).json({error: 'Cannot delete admin users'});
  }
  db.deleteUser(id);
  return res.status(204).send();
});

export default router;
