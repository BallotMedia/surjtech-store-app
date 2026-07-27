import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, brands, categories, suppliers } from "@/lib/schema";
import { eq, ilike, or, and, ne, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const view = searchParams.get("view"); // "discontinued" to see only discontinued items

  const base = db
    .select({
      id: products.id,
      productCode: products.productCode,
      barcode: products.barcode,
      name: products.name,
      costPrice: products.costPrice,
      sellingPrice: products.sellingPrice,
      quantity: products.quantity,
      reorderLevel: products.reorderLevel,
      warrantyMonths: products.warrantyMonths,
      status: products.status,
      brand: brands.name,
      category: categories.name,
      supplier: suppliers.name,
      brandId: products.brandId,
      categoryId: products.categoryId,
      supplierId: products.supplierId,
    })
    .from(products)
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
    .orderBy(desc(products.id));

  const conditions = [];
  if (view === "discontinued") {
    conditions.push(eq(products.status, "discontinued"));
  } else {
    conditions.push(ne(products.status, "discontinued"));
  }
  if (q) {
    conditions.push(
      or(
        ilike(products.name, `%${q}%`),
        ilike(products.productCode, `%${q}%`),
        ilike(products.barcode, `%${q}%`)
      )
    );
  }

  const rows = conditions.length ? await base.where(and(...conditions)) : await base;

  // Staff shouldn't see cost price
  const safeRows =
    session.role === "admin"
      ? rows
      : rows.map(({ costPrice, ...rest }) => rest);

  return NextResponse.json({ products: safeRows });
}

export async function POST(req) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json();
  const {
    productCode, barcode, name, brandId, categoryId, costPrice,
    sellingPrice, quantity, reorderLevel, supplierId, warrantyMonths,
  } = body;

  if (!productCode || !name || costPrice == null || sellingPrice == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const [created] = await db
      .insert(products)
      .values({
        productCode,
        barcode: barcode || null,
        name,
        brandId: brandId || null,
        categoryId: categoryId || null,
        costPrice: String(costPrice),
        sellingPrice: String(sellingPrice),
        quantity: Number(quantity) || 0,
        reorderLevel: Number(reorderLevel) || 3,
        supplierId: supplierId || null,
        warrantyMonths: Number(warrantyMonths) || 0,
      })
      .returning();
    return NextResponse.json({ product: created }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Product code or barcode already exists" }, { status: 409 });
  }
}
