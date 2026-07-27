import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { expenses, users } from "@/lib/schema";
import { eq, desc, gte, lte, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(req) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const conditions = [];
  if (from) conditions.push(gte(expenses.expenseDate, from));
  if (to) conditions.push(lte(expenses.expenseDate, to));

  const rows = await db
    .select({
      id: expenses.id,
      category: expenses.category,
      amount: expenses.amount,
      note: expenses.note,
      expenseDate: expenses.expenseDate,
      recordedBy: users.fullName,
    })
    .from(expenses)
    .leftJoin(users, eq(expenses.recordedById, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(expenses.expenseDate));

  return NextResponse.json({ expenses: rows });
}

export async function POST(req) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const { category, amount, note, expenseDate } = await req.json();
  if (!category || amount == null || !expenseDate) {
    return NextResponse.json({ error: "Category, amount and date are required" }, { status: 400 });
  }
  const [created] = await db
    .insert(expenses)
    .values({ category, amount: String(amount), note, expenseDate, recordedById: session.id })
    .returning();
  return NextResponse.json({ expense: created }, { status: 201 });
}
