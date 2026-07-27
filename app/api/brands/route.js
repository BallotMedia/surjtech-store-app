import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brands } from "@/lib/schema";
import { asc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db.select().from(brands).orderBy(asc(brands.name));
  return NextResponse.json({ brands: rows });
}

export async function POST(req) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  try {
    const [created] = await db.insert(brands).values({ name }).returning();
    return NextResponse.json({ brand: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Brand already exists" }, { status: 409 });
  }
}
