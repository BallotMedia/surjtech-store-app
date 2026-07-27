import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { suppliers } from "@/lib/schema";
import { asc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db.select().from(suppliers).orderBy(asc(suppliers.name));
  return NextResponse.json({ suppliers: rows });
}

export async function POST(req) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const { name, phone, notes } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const [created] = await db.insert(suppliers).values({ name, phone, notes }).returning();
  return NextResponse.json({ supplier: created }, { status: 201 });
}
