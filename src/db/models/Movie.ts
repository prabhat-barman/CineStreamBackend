import {Schema, model, type InferSchemaType, type HydratedDocument} from 'mongoose';

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

const movieSchema = new Schema(
  {
    title: {type: String, required: true, trim: true, index: true},
    year: {type: Number, required: true, min: 1888, max: 2100},
    rating: {type: Number, required: true, min: 0, max: 10},
    match: {type: Number, required: true, min: 0, max: 100},
    runtimeMin: {type: Number, required: true, min: 1, max: 600},
    genres: {type: [{type: String, enum: GENRES}], default: []},
    poster: {type: String, required: true},
    backdrop: {type: String, required: true},
    synopsis: {type: String, required: true},
    cast: {type: [String], default: []},
    director: {type: String, required: true},
    maturity: {type: String, required: true},
    featured: {type: Boolean, default: false, index: true},
  },
  {timestamps: true, versionKey: false},
);

movieSchema.index({title: 'text', director: 'text', cast: 'text'});

export type MovieSchemaType = InferSchemaType<typeof movieSchema>;
export type MovieDoc = HydratedDocument<MovieSchemaType>;

export const MovieModel = model<MovieSchemaType>('Movie', movieSchema);

export {GENRES};
