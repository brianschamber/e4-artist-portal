import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query('SELECT NOW()'); // we'll update db.ts to handle this properly
    return NextResponse.json({
      ok: true,
      dbTime: result.rows[0].now,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
