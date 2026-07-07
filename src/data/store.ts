import bcrypt from 'bcryptjs';
import {env} from '../lib/env';
import type {AuthProvider, Movie, User} from '../lib/types';
import {UserModel, type UserDoc} from '../db/models/User';
import {MovieModel, type MovieDoc} from '../db/models/Movie';
import {seedMovies} from './seed-movies';

function userDocToUser(doc: UserDoc): User {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    passwordHash: doc.passwordHash ?? undefined,
    role: doc.role as User['role'],
    provider: (doc.provider as AuthProvider) ?? 'email',
    providerUserId: doc.providerUserId ?? undefined,
    avatar: doc.avatar ?? undefined,
    emailVerified: doc.emailVerified ?? false,
    createdAt: doc.get('createdAt').toISOString(),
    updatedAt: doc.get('updatedAt').toISOString(),
  };
}

function movieDocToMovie(doc: MovieDoc): Movie {
  return {
    id: doc._id.toString(),
    title: doc.title,
    year: doc.year,
    rating: doc.rating,
    match: doc.match,
    runtimeMin: doc.runtimeMin,
    genres: doc.genres as Movie['genres'],
    poster: doc.poster,
    backdrop: doc.backdrop,
    synopsis: doc.synopsis,
    cast: doc.cast,
    director: doc.director,
    maturity: doc.maturity,
    featured: doc.featured ?? false,
    createdAt: doc.get('createdAt').toISOString(),
    updatedAt: doc.get('updatedAt').toISOString(),
  };
}

async function upsertAdmin(): Promise<void> {
  const email = env.adminEmail.toLowerCase();
  const existing = await UserModel.findOne({email}).lean();
  if (existing) {
    return;
  }
  await UserModel.create({
    name: 'CineStream Admin',
    email,
    passwordHash: bcrypt.hashSync(env.adminPassword, 10),
    role: 'admin',
  });
}

async function upsertDemoUser(): Promise<void> {
  const email = 'demo@cinestream.app';
  const existing = await UserModel.findOne({email}).lean();
  if (existing) {
    return;
  }
  await UserModel.create({
    name: 'Demo Viewer',
    email,
    passwordHash: bcrypt.hashSync('demo123', 10),
    role: 'user',
  });
}

async function seedMoviesOnce(): Promise<void> {
  const count = await MovieModel.estimatedDocumentCount();
  if (count > 0) {
    return;
  }
  const docs = seedMovies.map(({id: _id, createdAt: _c, updatedAt: _u, ...rest}) => rest);
  await MovieModel.insertMany(docs, {ordered: false});
}

export const db = {
  async init(): Promise<void> {
    await upsertAdmin();
    await upsertDemoUser();
    await seedMoviesOnce();
  },

  // ---------- Users ----------
  async createUser(input: {
    name: string;
    email: string;
    password: string;
  }): Promise<User> {
    const email = input.email.toLowerCase();
    const exists = await UserModel.findOne({email}).lean();
    if (exists) {
      throw new Error('EMAIL_TAKEN');
    }
    try {
      const doc = await UserModel.create({
        name: input.name,
        email,
        passwordHash: bcrypt.hashSync(input.password, 10),
        role: 'user',
        provider: 'email',
        emailVerified: false,
      });
      return userDocToUser(doc);
    } catch (err) {
      if (
        err instanceof Error &&
        'code' in err &&
        (err as unknown as {code: number}).code === 11000
      ) {
        throw new Error('EMAIL_TAKEN');
      }
      throw err;
    }
  },

  async upsertSocialUser(input: {
    provider: 'google' | 'apple';
    providerUserId: string;
    email: string;
    name: string;
    avatar?: string;
    emailVerified: boolean;
  }): Promise<User> {
    const email = input.email.toLowerCase();

    // Prefer provider match first (handles email changes on Apple's side)
    const byProvider = await UserModel.findOne({
      provider: input.provider,
      providerUserId: input.providerUserId,
    });
    if (byProvider) {
      let dirty = false;
      if (input.email && byProvider.email !== email) {
        byProvider.email = email;
        dirty = true;
      }
      if (input.avatar && byProvider.avatar !== input.avatar) {
        byProvider.avatar = input.avatar;
        dirty = true;
      }
      if (input.emailVerified && !byProvider.emailVerified) {
        byProvider.emailVerified = true;
        dirty = true;
      }
      if (dirty) {
        await byProvider.save();
      }
      return userDocToUser(byProvider);
    }

    // Fall back to email match — link the social identity to the existing account.
    const byEmail = await UserModel.findOne({email});
    if (byEmail) {
      byEmail.provider = input.provider;
      byEmail.providerUserId = input.providerUserId;
      byEmail.emailVerified = byEmail.emailVerified || input.emailVerified;
      if (input.avatar) {
        byEmail.avatar = input.avatar;
      }
      await byEmail.save();
      return userDocToUser(byEmail);
    }

    // Otherwise create a brand-new social account.
    const doc = await UserModel.create({
      name: input.name,
      email,
      provider: input.provider,
      providerUserId: input.providerUserId,
      avatar: input.avatar,
      emailVerified: input.emailVerified,
      role: 'user',
    });
    return userDocToUser(doc);
  },

  async findUserByEmail(email: string): Promise<User | undefined> {
    const doc = await UserModel.findOne({email: email.toLowerCase()});
    return doc ? userDocToUser(doc) : undefined;
  },

  async findUserById(id: string): Promise<User | undefined> {
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return undefined;
    }
    const doc = await UserModel.findById(id);
    return doc ? userDocToUser(doc) : undefined;
  },

  async listUsers(): Promise<User[]> {
    const docs = await UserModel.find().sort({createdAt: -1});
    return docs.map(userDocToUser);
  },

  async deleteUser(id: string): Promise<boolean> {
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return false;
    }
    const res = await UserModel.deleteOne({_id: id});
    return res.deletedCount > 0;
  },

  // ---------- Movies ----------
  async listMovies(): Promise<Movie[]> {
    const docs = await MovieModel.find().sort({createdAt: -1});
    return docs.map(movieDocToMovie);
  },

  async getMovie(id: string): Promise<Movie | undefined> {
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return undefined;
    }
    const doc = await MovieModel.findById(id);
    return doc ? movieDocToMovie(doc) : undefined;
  },

  async createMovie(
    input: Omit<Movie, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Movie> {
    const doc = await MovieModel.create(input);
    return movieDocToMovie(doc);
  },

  async updateMovie(
    id: string,
    patch: Partial<Omit<Movie, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Movie | undefined> {
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return undefined;
    }
    const doc = await MovieModel.findByIdAndUpdate(id, patch, {new: true});
    return doc ? movieDocToMovie(doc) : undefined;
  },

  async deleteMovie(id: string): Promise<boolean> {
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return false;
    }
    const res = await MovieModel.deleteOne({_id: id});
    return res.deletedCount > 0;
  },
};
