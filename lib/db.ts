import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// Supports both:
// - query("SELECT * FROM table", [])
// - query("SELECT NOW()")
export async function query(text: string, params?: any[]) {
  try {
    const trimmed = text.trim();

    // -----------------------------
    // Case 1 → Parameterized SQL
    // -----------------------------
    if (params && params.length > 0) {
      const result = await sql.query(text, params);
      return { rows: result };
    }

    // -----------------------------
    // Case 2 → NO parameters
    // Detect specific SQL strings and
    // use template literals for Neon.
    // -----------------------------

    // SELECT NOW()
    if (trimmed.toUpperCase() === "SELECT NOW()") {
      const result = await sql`SELECT NOW()`;
      return { rows: result };
    }

    // All releases
    if (trimmed.startsWith("SELECT * FROM releases")) {
      const result =
        await sql`SELECT * FROM releases ORDER BY release_date DESC`;
      return { rows: result };
    }

    // All tracks (no release filter)
    if (
      trimmed === `
        SELECT track_id, release_id, track_number, title, audio_url
        FROM tracks
        ORDER BY created_at DESC, track_number NULLS LAST;
      `.trim()
    ) {
      const result = await sql`
        SELECT track_id, release_id, track_number, title, audio_url
        FROM tracks
        ORDER BY created_at DESC, track_number NULLS LAST;
      `;
      return { rows: result };
    }

    // -----------------------------
    // Fallback → unsupported SQL
    // -----------------------------
    throw new Error(
      `Dynamic SQL not supported by Neon. Use a template query or add a manual case in db.ts for: ${trimmed}`
    );
  } catch (err) {
    console.error("DB query error:", err);
    throw err;
  }
}

export { sql };
