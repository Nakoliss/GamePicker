import sql from '../db/client';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/L

function generate(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export async function uniqueRoomCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generate();
    const rows = await sql`SELECT 1 FROM sessions WHERE room_code = ${code}`;
    if (rows.length === 0) return code;
  }
  throw new Error('Could not generate unique room code');
}
