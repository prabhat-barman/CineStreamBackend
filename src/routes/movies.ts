import {Router, type NextFunction, type Request, type Response} from 'express';
import {z} from 'zod';
import {db} from '../data/store';
import {requireAdmin, requireAuth} from '../middleware/auth';

const router = Router();

const GENRES = [
  'Action',
  'Adventure',
  'Sci-Fi',
  'Drama',
  'Thriller',
  'Comedy',
  'Animation',
  'Crime',
  'Romance',
  'Horror',
] as const;

const movieInputSchema = z.object({
  title: z.string().min(1).max(200),
  year: z.number().int().min(1888).max(2100),
  rating: z.number().min(0).max(10),
  match: z.number().int().min(0).max(100),
  runtimeMin: z.number().int().min(1).max(600),
  genres: z.array(z.enum(GENRES)).min(1),
  poster: z.string().url(),
  backdrop: z.string().url(),
  synopsis: z.string().min(1),
  cast: z.array(z.string()).default([]),
  director: z.string().min(1),
  maturity: z.string().min(1),
  featured: z.boolean().optional(),
});

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const {q, genre, featured} = req.query as {
      q?: string;
      genre?: string;
      featured?: string;
    };
    let list = await db.listMovies();

    if (q) {
      const query = q.toLowerCase();
      list = list.filter(
        m =>
          m.title.toLowerCase().includes(query) ||
          m.director.toLowerCase().includes(query) ||
          m.cast.some(c => c.toLowerCase().includes(query)),
      );
    }
    if (genre) {
      list = list.filter(m => m.genres.includes(genre as any));
    }
    if (featured === 'true') {
      list = list.filter(m => m.featured);
    }

    res.json({movies: list});
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const movie = await db.getMovie(String(req.params.id));
    if (!movie) {
      return res.status(404).json({error: 'Movie not found'});
    }
    return res.json({movie});
  }),
);

router.post(
  '/',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const parsed = movieInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({error: 'Invalid input', details: parsed.error.flatten()});
    }
    const movie = await db.createMovie({
      ...parsed.data,
      cast: parsed.data.cast ?? [],
    });
    return res.status(201).json({movie});
  }),
);

router.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const parsed = movieInputSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({error: 'Invalid input', details: parsed.error.flatten()});
    }
    const movie = await db.updateMovie(String(req.params.id), parsed.data);
    if (!movie) {
      return res.status(404).json({error: 'Movie not found'});
    }
    return res.json({movie});
  }),
);

router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const ok = await db.deleteMovie(String(req.params.id));
    if (!ok) {
      return res.status(404).json({error: 'Movie not found'});
    }
    return res.status(204).send();
  }),
);

export default router;
