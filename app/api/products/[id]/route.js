import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function PUT(req, { params }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();

  const update = {};
  for (const key of [
    "productCode", "barcode", "name", "brandId", "categoryId",
    "supplierId", "quantity", "reorderLevel", "warrantyMonths", "status",
  ]) {
    if (body[key] !== undefined) update[key] = body[key];
  }
  if (body.costPrice !== undefined) update.costPrice = String(body.costPrice);
  if (body.sellingPrice !== undefined) update.sellingPrice = String(body.sellingPrice);

  const [updated] = await db.update(products).set(update).where(eq(products.id, Number(id))).returning();
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product: updated });
}

export async function DELETE(req, { params }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const { id } = await params;
  await db.update(products).set({ status: "discontinued" }).where(eq(products.id, Number(id)));
  return NextResponse.json({ ok: true });
}
