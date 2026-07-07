import mongoose from 'mongoose';
import {env} from '../lib/env';

let connectionPromise: Promise<typeof mongoose> | null = null;
let memoryServer: {getUri: () => string; stop: () => Promise<boolean>} | null =
  null;
let resolvedUri: string | null = null;

async function startMemoryServer(): Promise<string> {
  const {MongoMemoryServer} = await import('mongodb-memory-server');
  console.log('  Booting in-process MongoDB (mongodb-memory-server)…');
  const server = await MongoMemoryServer.create({
    instance: {dbName: 'cinestream'},
  });
  memoryServer = server;
  const uri = server.getUri();
  console.log('  In-process MongoDB ready.');
  return uri;
}

async function resolveUri(): Promise<string> {
  if (resolvedUri) {
    return resolvedUri;
  }
  resolvedUri = env.useMemoryDb ? await startMemoryServer() : env.mongoUri;
  return resolvedUri;
}

export async function connectMongo(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }
  if (connectionPromise) {
    return connectionPromise;
  }
  mongoose.set('strictQuery', true);
  connectionPromise = (async () => {
    const uri = await resolveUri();
    const conn = await mongoose.connect(uri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 8000,
    });
    const pretty = uri.replace(/\/\/.*@/, '//<redacted>@');
    console.log(
      `  MongoDB connected → ${pretty}${env.useMemoryDb ? '  (in-memory)' : ''}`,
    );
    return conn;
  })().catch(err => {
    connectionPromise = null;
    throw err;
  });
  return connectionPromise;
}

export async function disconnectMongo(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (memoryServer) {
    try {
      await memoryServer.stop();
    } catch {
      // ignore
    }
    memoryServer = null;
  }
  connectionPromise = null;
  resolvedUri = null;
}
