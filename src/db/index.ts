import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!connectionString) {
  console.warn("DATABASE_URL or DIRECT_URL is not configured in environment variables.");
}

// Disable prepared statements for Supabase transaction pooled connections (pgBouncer)
const queryClient = postgres(connectionString || "postgresql://postgres:postgres@localhost:5432/healthpilot_erp", {
  prepare: false,
});

export const db = drizzle(queryClient, { schema });

/**
 * Helper to verify database connectivity
 */
export async function checkDbConnection(): Promise<{ success: boolean; message: string }> {
  try {
    await queryClient`SELECT 1`;
    return { success: true, message: "Connected to PostgreSQL / Supabase successfully." };
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Database connection failed: ${errMessage}` };
  }
}
