import {Schema, model, type InferSchemaType, type HydratedDocument} from 'mongoose';

const userSchema = new Schema(
  {
    name: {type: String, required: true, trim: true, minlength: 1, maxlength: 120},
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {type: String, required: false},
    role: {type: String, enum: ['user', 'admin'], default: 'user'},
    provider: {
      type: String,
      enum: ['email', 'google', 'apple'],
      default: 'email',
      index: true,
    },
    providerUserId: {type: String, required: false, index: true},
    avatar: {type: String, required: false},
    emailVerified: {type: Boolean, default: false},
  },
  {timestamps: true, versionKey: false},
);

userSchema.index({provider: 1, providerUserId: 1}, {sparse: true});

export type UserSchemaType = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<UserSchemaType>;

export const UserModel = model<UserSchemaType>('User', userSchema);
