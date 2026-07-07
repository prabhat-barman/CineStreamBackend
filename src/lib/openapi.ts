import {env} from './env';

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

export const openapiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'CineStream API',
    version: '0.3.0',
    description:
      'REST API for CineStream — email/password + Google/Apple auth, movies catalog, and admin operations. Backed by MongoDB.',
    contact: {name: 'CineStream Team'},
    license: {name: 'MIT'},
  },
  servers: [
    {url: `http://localhost:${env.port}`, description: 'Local dev'},
    {url: 'http://10.0.2.2:{port}', description: 'Android emulator', variables: {port: {default: String(env.port)}}},
  ],
  tags: [
    {name: 'Auth', description: 'Sign up, sign in, and current user'},
    {name: 'Movies', description: 'Public catalog + admin CRUD'},
    {name: 'Admin', description: 'Admin-only operations'},
    {name: 'Meta', description: 'Health / root'},
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'JWT obtained from `POST /auth/login` or `POST /auth/register`. Prefix with `Bearer `.',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {type: 'string', example: 'Invalid credentials'},
          details: {},
        },
      },
      PublicUser: {
        type: 'object',
        required: [
          'id',
          'name',
          'email',
          'role',
          'provider',
          'emailVerified',
          'createdAt',
          'updatedAt',
        ],
        properties: {
          id: {type: 'string', example: '65f0a3e2c1d4a2b8f0e1c001'},
          name: {type: 'string', example: 'Demo Viewer'},
          email: {
            type: 'string',
            format: 'email',
            example: 'demo@cinestream.app',
          },
          role: {type: 'string', enum: ['user', 'admin']},
          provider: {
            type: 'string',
            enum: ['email', 'google', 'apple'],
            description: 'How the user originally authenticated.',
          },
          providerUserId: {
            type: 'string',
            nullable: true,
            description: 'External subject id from Google/Apple.',
          },
          avatar: {type: 'string', format: 'uri', nullable: true},
          emailVerified: {type: 'boolean', example: true},
          createdAt: {type: 'string', format: 'date-time'},
          updatedAt: {type: 'string', format: 'date-time'},
        },
      },
      AuthResponse: {
        type: 'object',
        required: ['token', 'user'],
        properties: {
          token: {
            type: 'string',
            description: 'JWT (HS256, 7-day expiry by default)',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…',
          },
          user: {$ref: '#/components/schemas/PublicUser'},
        },
      },
      RegisterInput: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: {type: 'string', minLength: 2, maxLength: 80, example: 'Ada Lovelace'},
          email: {type: 'string', format: 'email', example: 'ada@example.com'},
          password: {type: 'string', format: 'password', minLength: 6, maxLength: 128, example: 'secret123'},
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {type: 'string', format: 'email', example: 'demo@cinestream.app'},
          password: {type: 'string', format: 'password', example: 'demo123'},
        },
      },
      GoogleSocialInput: {
        type: 'object',
        required: ['idToken'],
        properties: {
          idToken: {
            type: 'string',
            description:
              'Google ID token (JWT) obtained on the client from Google Sign-In. Backend verifies its signature and `aud` against `GOOGLE_CLIENT_IDS`.',
            example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6…',
          },
        },
      },
      AppleSocialInput: {
        type: 'object',
        required: ['identityToken'],
        properties: {
          identityToken: {
            type: 'string',
            description:
              "Apple identity token (JWT) returned from Sign in with Apple. Backend verifies against Apple's JWKS and `APPLE_CLIENT_IDS`.",
            example: 'eyJraWQiOiJlWGF1bm1MIiwiYWxnIjoiUlMyNTYifQ…',
          },
          name: {
            type: 'string',
            description:
              'Full name captured on Apple first-run consent (Apple never returns it again).',
            example: 'Ada Lovelace',
          },
          email: {
            type: 'string',
            format: 'email',
            description:
              'Optional email fallback. Only used when the identity token omits it (e.g. on later logins).',
          },
        },
      },
      Genre: {type: 'string', enum: [...GENRES]},
      Movie: {
        type: 'object',
        required: [
          'id',
          'title',
          'year',
          'rating',
          'match',
          'runtimeMin',
          'genres',
          'poster',
          'backdrop',
          'synopsis',
          'cast',
          'director',
          'maturity',
          'createdAt',
          'updatedAt',
        ],
        properties: {
          id: {type: 'string', example: '65f0a3e2c1d4a2b8f0e1c010'},
          title: {type: 'string', example: 'Interstellar'},
          year: {type: 'integer', minimum: 1888, maximum: 2100, example: 2014},
          rating: {type: 'number', minimum: 0, maximum: 10, example: 8.7},
          match: {type: 'integer', minimum: 0, maximum: 100, example: 98},
          runtimeMin: {type: 'integer', minimum: 1, maximum: 600, example: 169},
          genres: {
            type: 'array',
            items: {$ref: '#/components/schemas/Genre'},
            example: ['Sci-Fi', 'Drama', 'Adventure'],
          },
          poster: {type: 'string', format: 'uri'},
          backdrop: {type: 'string', format: 'uri'},
          synopsis: {type: 'string'},
          cast: {type: 'array', items: {type: 'string'}},
          director: {type: 'string', example: 'Christopher Nolan'},
          maturity: {type: 'string', example: 'PG-13'},
          featured: {type: 'boolean', default: false},
          createdAt: {type: 'string', format: 'date-time'},
          updatedAt: {type: 'string', format: 'date-time'},
        },
      },
      MovieInput: {
        type: 'object',
        required: [
          'title',
          'year',
          'rating',
          'match',
          'runtimeMin',
          'genres',
          'poster',
          'backdrop',
          'synopsis',
          'director',
          'maturity',
        ],
        properties: {
          title: {type: 'string', minLength: 1, maxLength: 200},
          year: {type: 'integer', minimum: 1888, maximum: 2100},
          rating: {type: 'number', minimum: 0, maximum: 10},
          match: {type: 'integer', minimum: 0, maximum: 100},
          runtimeMin: {type: 'integer', minimum: 1, maximum: 600},
          genres: {
            type: 'array',
            minItems: 1,
            items: {$ref: '#/components/schemas/Genre'},
          },
          poster: {type: 'string', format: 'uri'},
          backdrop: {type: 'string', format: 'uri'},
          synopsis: {type: 'string', minLength: 1},
          cast: {type: 'array', items: {type: 'string'}, default: []},
          director: {type: 'string', minLength: 1},
          maturity: {type: 'string', minLength: 1},
          featured: {type: 'boolean'},
        },
      },
      AdminStats: {
        type: 'object',
        properties: {
          userCount: {type: 'integer'},
          adminCount: {type: 'integer'},
          movieCount: {type: 'integer'},
          featuredCount: {type: 'integer'},
          genreCounts: {
            type: 'object',
            additionalProperties: {type: 'integer'},
          },
          topRated: {
            type: 'array',
            items: {$ref: '#/components/schemas/Movie'},
          },
          recentUsers: {
            type: 'array',
            items: {$ref: '#/components/schemas/PublicUser'},
          },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Missing or invalid bearer token',
        content: {
          'application/json': {
            schema: {$ref: '#/components/schemas/Error'},
            example: {error: 'Missing bearer token'},
          },
        },
      },
      Forbidden: {
        description: 'Authenticated but not an admin',
        content: {
          'application/json': {
            schema: {$ref: '#/components/schemas/Error'},
            example: {error: 'Admin access required'},
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {$ref: '#/components/schemas/Error'},
            example: {error: 'Movie not found'},
          },
        },
      },
      BadRequest: {
        description: 'Zod validation failed',
        content: {
          'application/json': {
            schema: {$ref: '#/components/schemas/Error'},
            example: {
              error: 'Invalid input',
              details: {
                formErrors: [],
                fieldErrors: {password: ['String must contain at least 6 character(s)']},
              },
            },
          },
        },
      },
    },
  },
  paths: {
    '/': {
      get: {
        tags: ['Meta'],
        summary: 'API index',
        responses: {
          '200': {
            description: 'API metadata',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: {type: 'string'},
                    version: {type: 'string'},
                    db: {type: 'string'},
                    endpoints: {type: 'object'},
                  },
                },
              },
            },
          },
        },
      },
    },
    '/health': {
      get: {
        tags: ['Meta'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'Service is up',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: {type: 'boolean', example: true},
                    uptime: {type: 'number', example: 12.42},
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Create a new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {$ref: '#/components/schemas/RegisterInput'},
            },
          },
        },
        responses: {
          '201': {
            description: 'Account created — returns JWT + user',
            content: {
              'application/json': {
                schema: {$ref: '#/components/schemas/AuthResponse'},
              },
            },
          },
          '400': {$ref: '#/components/responses/BadRequest'},
          '409': {
            description: 'Email already registered',
            content: {
              'application/json': {
                schema: {$ref: '#/components/schemas/Error'},
                example: {error: 'Email already registered'},
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Sign in with email + password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {$ref: '#/components/schemas/LoginInput'},
            },
          },
        },
        responses: {
          '200': {
            description: 'Signed in — returns JWT + user',
            content: {
              'application/json': {
                schema: {$ref: '#/components/schemas/AuthResponse'},
              },
            },
          },
          '400': {$ref: '#/components/responses/BadRequest'},
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: {$ref: '#/components/schemas/Error'},
                example: {error: 'Invalid credentials'},
              },
            },
          },
        },
      },
    },
    '/auth/social/google': {
      post: {
        tags: ['Auth'],
        summary: 'Sign in / sign up with a Google ID token',
        description:
          'Exchange a Google ID token (from `@react-native-google-signin/google-signin` or Google Identity Services) for a CineStream JWT. Creates the account on first use.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {$ref: '#/components/schemas/GoogleSocialInput'},
            },
          },
        },
        responses: {
          '200': {
            description: 'Signed in — returns JWT + user',
            content: {
              'application/json': {
                schema: {$ref: '#/components/schemas/AuthResponse'},
              },
            },
          },
          '400': {$ref: '#/components/responses/BadRequest'},
          '401': {
            description: 'Google token verification failed',
            content: {
              'application/json': {
                schema: {$ref: '#/components/schemas/Error'},
                example: {error: 'Google token verification failed: Invalid token signature'},
              },
            },
          },
          '501': {
            description: 'Google Sign-In not configured on this server',
            content: {
              'application/json': {
                schema: {$ref: '#/components/schemas/Error'},
                example: {error: 'Google Sign-In is not configured (set GOOGLE_CLIENT_IDS).'},
              },
            },
          },
        },
      },
    },
    '/auth/social/apple': {
      post: {
        tags: ['Auth'],
        summary: 'Sign in / sign up with an Apple identity token',
        description:
          "Exchange an Apple `identityToken` (from `@invertase/react-native-apple-authentication`) for a CineStream JWT. Pass `name` on the first sign-in — Apple only returns it once.",
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {$ref: '#/components/schemas/AppleSocialInput'},
            },
          },
        },
        responses: {
          '200': {
            description: 'Signed in — returns JWT + user',
            content: {
              'application/json': {
                schema: {$ref: '#/components/schemas/AuthResponse'},
              },
            },
          },
          '400': {$ref: '#/components/responses/BadRequest'},
          '401': {
            description: 'Apple token verification failed',
            content: {
              'application/json': {
                schema: {$ref: '#/components/schemas/Error'},
                example: {error: 'Apple token verification failed: JWT expired'},
              },
            },
          },
          '501': {
            description: 'Apple Sign-In not configured on this server',
            content: {
              'application/json': {
                schema: {$ref: '#/components/schemas/Error'},
                example: {error: 'Apple Sign-In is not configured (set APPLE_CLIENT_IDS).'},
              },
            },
          },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get the currently authenticated user',
        security: [{bearerAuth: []}],
        responses: {
          '200': {
            description: 'Current user',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: {$ref: '#/components/schemas/PublicUser'},
                  },
                },
              },
            },
          },
          '401': {$ref: '#/components/responses/Unauthorized'},
          '404': {$ref: '#/components/responses/NotFound'},
        },
      },
    },
    '/movies': {
      get: {
        tags: ['Movies'],
        summary: 'List movies (optionally filtered)',
        parameters: [
          {
            name: 'q',
            in: 'query',
            schema: {type: 'string'},
            description: 'Case-insensitive fuzzy search across title, director, cast.',
          },
          {
            name: 'genre',
            in: 'query',
            schema: {$ref: '#/components/schemas/Genre'},
          },
          {
            name: 'featured',
            in: 'query',
            schema: {type: 'string', enum: ['true', 'false']},
            description: 'Set to `true` to only return featured titles.',
          },
        ],
        responses: {
          '200': {
            description: 'Movie list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    movies: {
                      type: 'array',
                      items: {$ref: '#/components/schemas/Movie'},
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Movies'],
        summary: 'Create a movie (admin)',
        security: [{bearerAuth: []}],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {$ref: '#/components/schemas/MovieInput'},
            },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {movie: {$ref: '#/components/schemas/Movie'}},
                },
              },
            },
          },
          '400': {$ref: '#/components/responses/BadRequest'},
          '401': {$ref: '#/components/responses/Unauthorized'},
          '403': {$ref: '#/components/responses/Forbidden'},
        },
      },
    },
    '/movies/{id}': {
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {type: 'string'},
          description: 'Movie MongoDB ObjectId',
        },
      ],
      get: {
        tags: ['Movies'],
        summary: 'Get a single movie by id',
        responses: {
          '200': {
            description: 'Movie',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {movie: {$ref: '#/components/schemas/Movie'}},
                },
              },
            },
          },
          '404': {$ref: '#/components/responses/NotFound'},
        },
      },
      patch: {
        tags: ['Movies'],
        summary: 'Update a movie (admin)',
        security: [{bearerAuth: []}],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                allOf: [
                  {$ref: '#/components/schemas/MovieInput'},
                ],
                description: 'All fields are optional in a PATCH.',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {movie: {$ref: '#/components/schemas/Movie'}},
                },
              },
            },
          },
          '400': {$ref: '#/components/responses/BadRequest'},
          '401': {$ref: '#/components/responses/Unauthorized'},
          '403': {$ref: '#/components/responses/Forbidden'},
          '404': {$ref: '#/components/responses/NotFound'},
        },
      },
      delete: {
        tags: ['Movies'],
        summary: 'Delete a movie (admin)',
        security: [{bearerAuth: []}],
        responses: {
          '204': {description: 'Deleted'},
          '401': {$ref: '#/components/responses/Unauthorized'},
          '403': {$ref: '#/components/responses/Forbidden'},
          '404': {$ref: '#/components/responses/NotFound'},
        },
      },
    },
    '/admin/stats': {
      get: {
        tags: ['Admin'],
        summary: 'Aggregate dashboard stats',
        security: [{bearerAuth: []}],
        responses: {
          '200': {
            description: 'Stats',
            content: {
              'application/json': {
                schema: {$ref: '#/components/schemas/AdminStats'},
              },
            },
          },
          '401': {$ref: '#/components/responses/Unauthorized'},
          '403': {$ref: '#/components/responses/Forbidden'},
        },
      },
    },
    '/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'List all users',
        security: [{bearerAuth: []}],
        responses: {
          '200': {
            description: 'Users',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    users: {
                      type: 'array',
                      items: {$ref: '#/components/schemas/PublicUser'},
                    },
                  },
                },
              },
            },
          },
          '401': {$ref: '#/components/responses/Unauthorized'},
          '403': {$ref: '#/components/responses/Forbidden'},
        },
      },
    },
    '/admin/users/{id}': {
      delete: {
        tags: ['Admin'],
        summary: 'Delete a non-admin user',
        security: [{bearerAuth: []}],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {type: 'string'},
          },
        ],
        responses: {
          '204': {description: 'Deleted'},
          '400': {
            description: 'Attempted to delete an admin user',
            content: {
              'application/json': {
                schema: {$ref: '#/components/schemas/Error'},
                example: {error: 'Cannot delete admin users'},
              },
            },
          },
          '401': {$ref: '#/components/responses/Unauthorized'},
          '403': {$ref: '#/components/responses/Forbidden'},
          '404': {$ref: '#/components/responses/NotFound'},
        },
      },
    },
  },
} as const;
