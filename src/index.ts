import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import {env} from './lib/env';
import {connectMongo, disconnectMongo} from './db/mongo';
import {db} from './data/store';
import {openapiDocument} from './lib/openapi';
import authRouter from './routes/auth';
import moviesRouter from './routes/movies';
import adminRouter from './routes/admin';

const app = express();

app.use(
  cors({
    origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(','),
  }),
);
app.use(express.json({limit: '1mb'}));

app.get('/', (_req, res) => {
  res.json({
    name: 'CineStream API',
    version: '0.3.0',
    db: 'mongodb',
    docs: '/docs',
    openapi: '/openapi.json',
    social: {
      google: env.googleClientIds.length > 0 ? 'enabled' : 'disabled',
      apple: env.appleClientIds.length > 0 ? 'enabled' : 'disabled',
    },
    endpoints: {
      auth: [
        'POST /auth/register',
        'POST /auth/login',
        'POST /auth/social/google',
        'POST /auth/social/apple',
        'GET /auth/me',
      ],
      movies: [
        'GET /movies?q=&genre=&featured=',
        'GET /movies/:id',
        'POST /movies (admin)',
        'PATCH /movies/:id (admin)',
        'DELETE /movies/:id (admin)',
      ],
      admin: [
        'GET /admin/stats',
        'GET /admin/users',
        'DELETE /admin/users/:id',
      ],
    },
  });
});

app.get('/health', (_req, res) =>
  res.json({ok: true, uptime: process.uptime()}),
);

app.get('/openapi.json', (_req, res) => res.json(openapiDocument));

app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(openapiDocument, {
    customSiteTitle: 'CineStream API — Swagger',
    customfavIcon:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23e50914"/><text x="50" y="65" font-family="Helvetica" font-size="52" font-weight="900" fill="white" text-anchor="middle">C</text></svg>',
    customCss: `
      .topbar { display: none; }
      body { background: #0a0a0a; }
      .swagger-ui .info .title,
      .swagger-ui .info,
      .swagger-ui .scheme-container,
      .swagger-ui .opblock-tag,
      .swagger-ui .opblock .opblock-summary-description,
      .swagger-ui .opblock .opblock-summary-operation-id,
      .swagger-ui .opblock .opblock-summary-path { color: #e5e2e1; }
      .swagger-ui .info a { color: #ffb4aa; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      filter: true,
      tryItOutEnabled: true,
    },
  }),
);

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

async function main() {
  await connectMongo();
  await db.init();

  const server = app.listen(env.port, () => {
    console.log(
      `\n  CineStream API listening on http://localhost:${env.port}`,
    );
    console.log(`  Swagger UI:  http://localhost:${env.port}/docs`);
    console.log(`  OpenAPI:     http://localhost:${env.port}/openapi.json`);
    const googleLine =
      env.googleClientIds.length > 0
        ? `ON  (${env.googleClientIds.length} client id${env.googleClientIds.length === 1 ? '' : 's'})`
        : 'off (set GOOGLE_CLIENT_IDS)';
    const appleLine =
      env.appleClientIds.length > 0
        ? `ON  (${env.appleClientIds.length} client id${env.appleClientIds.length === 1 ? '' : 's'})`
        : 'off (set APPLE_CLIENT_IDS)';
    console.log(`  Google SSO:  ${googleLine}`);
    console.log(`  Apple SSO:   ${appleLine}`);
    console.log(
      `  Admin login: ${env.adminEmail} / ${env.adminPassword}`,
    );
    console.log(`  Demo user:   demo@cinestream.app / demo123\n`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n  Received ${signal}, shutting down…`);
    server.close();
    await disconnectMongo();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch(err => {
  console.error('[fatal]', err);
  process.exit(1);
});
