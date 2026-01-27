import * as dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  // Silence error during build time for Vercel
  if (process.env.VERCEL) {
    console.warn("DATABASE_URL not set during build");
  } else {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
}

export const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: true // Simpler SSL config for Vercel
});
export const db = drizzle(pool, { schema });
