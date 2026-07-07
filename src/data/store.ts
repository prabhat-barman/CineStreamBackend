import bcrypt from 'bcryptjs';
import {env} from '../lib/env';
import type {Movie, User} from '../lib/types';
import {seedMovies} from './seed-movies';

const users = new Map<string, User>();
const movies = new Map<string, Movie>();

function randomId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

function seedAdmin() {
  const email = env.adminEmail.toLowerCase();
  if ([...users.values()].some(u => u.email === email)) return;
  const admin: User = {
    id: randomId('usr'),
    name: 'CineStream Admin',
    email,
    passwordHash: bcrypt.hashSync(env.adminPassword, 10),
    role: 'admin',
    createdAt: new Date().toISOString(),
  };
  users.set(admin.id, admin);
}

function seedDemoUser() {
  const email = 'demo@cinestream.app';
  if ([...users.values()].some(u => u.email === email)) return;
  const demo: User = {
    id: randomId('usr'),
    name: 'Demo Viewer',
    email,
    passwordHash: bcrypt.hashSync('demo123', 10),
    role: 'user',
    createdAt: new Date().toISOString(),
  };
  users.set(demo.id, demo);
}

function seedMoviesOnce() {
  if (movies.size > 0) return;
  for (const m of seedMovies) {
    movies.set(m.id, {...m});
  }
}

export const db = {
  init() {
    seedAdmin();
    seedDemoUser();
    seedMoviesOnce();
  },

  // ---------- Users ----------
  createUser(input: {name: string; email: string; password: string}): User {
    const email = input.email.toLowerCase();
    const exists = [...users.values()].find(u => u.email === email);
    if (exists) throw new Error('EMAIL_TAKEN');
    const user: User = {
      id: randomId('usr'),
      name: input.name,
      email,
      passwordHash: bcrypt.hashSync(input.password, 10),
      role: 'user',
      createdAt: new Date().toISOString(),
    };
    users.set(user.id, user);
    return user;
  },
  findUserByEmail(email: string): User | undefined {
    const e = email.toLowerCase();
    return [...users.values()].find(u => u.email === e);
  },
  findUserById(id: string): User | undefined {
    return users.get(id);
  },
  listUsers(): User[] {
    return [...users.values()].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
  },
  deleteUser(id: string): boolean {
    return users.delete(id);
  },

  // ---------- Movies ----------
  listMovies(): Movie[] {
    return [...movies.values()].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
  },
  getMovie(id: string): Movie | undefined {
    return movies.get(id);
  },
  createMovie(input: Omit<Movie, 'id' | 'createdAt' | 'updatedAt'>): Movie {
    const now = new Date().toISOString();
    const movie: Movie = {
      ...input,
      id: randomId('mov'),
      createdAt: now,
      updatedAt: now,
    };
    movies.set(movie.id, movie);
    return movie;
  },
  updateMovie(
    id: string,
    patch: Partial<Omit<Movie, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Movie | undefined {
    const existing = movies.get(id);
    if (!existing) return undefined;
    const updated: Movie = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    movies.set(id, updated);
    return updated;
  },
  deleteMovie(id: string): boolean {
    return movies.delete(id);
  },
};

db.init();
