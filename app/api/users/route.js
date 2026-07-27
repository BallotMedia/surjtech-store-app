import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { asc } from "drizzle-orm";
import { getSession, hashPassword } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const rows = await db
    .select({ id: users.id, username: users.username, fullName: users.fullName, role: users.role, active: users.active, createdAt: users.createdAt })
    .from(users)
    .orderBy(asc(users.username));
  return NextResponse.json({ users: rows });
}

export async function POST(req) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const { username, fullName, password, role } = await req.json();
  if (!username || !fullName || !password) {
    return NextResponse.json({ error: "Username, full name and password are required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }
  const passwordHash = await hashPassword(password);
  try {
    const [created] = await db
      .insert(users)
      .values({ username: username.trim().toLowerCase(), fullName, passwordHash, role: role === "admin" ? "admin" : "staff" })
      .returning({ id: users.id, username: users.username, fullName: users.fullName, role: users.role, active: users.active });
    return NextResponse.json({ user: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Username already exists" }, { status: 409 });
  }
}
