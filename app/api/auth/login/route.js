import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, setSessionCookie } from "@/lib/auth";

export async function POST(req) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.username, username.trim().toLowerCase()));

  if (!user || !user.active) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  await setSessionCookie({ id: user.id, username: user.username, fullName: user.fullName, role: user.role });

  return NextResponse.json({ ok: true, role: user.role });
}
