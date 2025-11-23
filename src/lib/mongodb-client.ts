import { MongoClient } from "mongodb";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/nutritrack";

if (!MONGODB_URI) {
  throw new Error("Por favor define la variable MONGODB_URI en .env.local");
}

interface MongoClientCache {
  client: MongoClient | null;
  promise: Promise<MongoClient> | null;
}

declare global {
  var mongoClient: MongoClientCache;
}

let cached: MongoClientCache = global.mongoClient || {
  client: null,
  promise: null,
};

if (!global.mongoClient) {
  global.mongoClient = cached;
}

async function getMongoClient(): Promise<MongoClient> {
  if (cached.client) {
    return cached.client;
  }

  if (!cached.promise) {
    const opts = {
      maxPoolSize: 10,
      minPoolSize: 5,
    };

    cached.promise = MongoClient.connect(MONGODB_URI, opts);
  }

  try {
    cached.client = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.client;
}

const clientPromise = getMongoClient();

export default clientPromise;
