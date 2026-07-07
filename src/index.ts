import express from 'express';
import cors from 'cors';
import {env} from './lib/env';
import authRouter from './routes/auth';
import moviesRouter from './routes/movies';
import adminRouter from './routes/admin';

const app = express();

app.use(cors({origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',')}));
app.use(express.json({limit: '1mb'}));

app.get('/', (_req, res) => {
  res.json({
    name: 'CineStream API',
    version: '0.1.0',
    endpoints: {
      auth: ['POST /auth/register', 'POST /auth/login', 'GET /auth/me'],
      movies: [
        'GET /movies?q=&genre=&featured=',
        'GET /movies/:id',
        'POST /movies (admin)',
        'PATCH /movies/:id (admin)',
        'DELETE /movies/:id (admin)',
      ],
      admin: ['GET /admin/stats', 'GET /admin/users', 'DELETE /admin/users/:id'],
    },
  });
});

app.get('/health', (_req, res) => res.json({ok: true, uptime: process.uptime()}));

app.use('/auth', authRouter);
app.use('/movies', moviesRouter);
app.use('/admin', adminRouter);

app.use((_req, res) => res.status(404).json({error: 'Not found'}));

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error('[error]', err);
    res.status(500).json({error: 'Internal server error'});
  },
);

app.listen(env.port, () => {
  console.log(`\n  CineStream API listening on http://localhost:${env.port}`);
  console.log(`  Admin login: ${env.adminEmail} / ${env.adminPassword}`);
  console.log(`  Demo user:   demo@cinestream.app / demo123\n`);
});
