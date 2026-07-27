import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customers, sales } from "@/lib/schema";
import { eq, ilike, or, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  const base = db.select().from(customers).orderBy(desc(customers.id));
  const rows = q
    ? await base.where(or(ilike(customers.name, `%${q}%`), ilike(customers.phone, `%${q}%`)))
    : await base;

  return NextResponse.json({ customers: rows });
}

export async function POST(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name, phone } = await req.json();
  if (!phone) return NextResponse.json({ error: "Phone number required" }, { status: 400 });
  try {
    const [created] = await db.insert(customers).values({ name, phone }).returning();
    return NextResponse.json({ customer: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Customer with this phone already exists" }, { status: 409 });
  }
}
