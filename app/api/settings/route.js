import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { settings } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [row] = await db.select().from(settings).limit(1);
  return NextResponse.json({ settings: row || null });
}

export async function PUT(req) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const body = await req.json();
  const [existing] = await db.select().from(settings).limit(1);

  if (!existing) {
    const [created] = await db.insert(settings).values(body).returning();
    return NextResponse.json({ settings: created });
  }

  const [updated] = await db.update(settings).set(body).where(eq(settings.id, existing.id)).returning();
  return NextResponse.json({ settings: updated });
}
