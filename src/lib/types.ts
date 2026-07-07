export type Role = 'user' | 'admin';

export type AuthProvider = 'email' | 'google' | 'apple';

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: Role;
  provider: AuthProvider;
  providerUserId?: string;
  avatar?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PublicUser = Omit<User, 'passwordHash'>;

export type Genre =
  | 'Action'
  | 'Adventure'
  | 'Sci-Fi'
  | 'Drama'
  | 'Thriller'
  | 'Comedy'
  | 'Animation'
  | 'Crime'
  | 'Romance'
  | 'Horror';

export type Movie = {
  id: string;
  title: string;
  year: number;
  rating: number;
  match: number;
  runtimeMin: number;
  genres: Genre[];
  poster: string;
  backdrop: string;
  synopsis: string;
  cast: string[];
  director: string;
  maturity: string;
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
};
