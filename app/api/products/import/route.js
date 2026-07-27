import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, brands, categories, suppliers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

async function findOrCreate(table, name) {
  if (!name || !name.trim()) return null;
  const clean = name.trim();
  const [existing] = await db.select().from(table).where(eq(table.name, clean));
  if (existing) return existing.id;
  const [created] = await db.insert(table).values({ name: clean }).returning();
  return created.id;
}

export async function POST(req) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { rows } = await req.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows to import" }, { status: 400 });
  }

  let created = 0, updated = 0;
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const productCode = (r.productCode || r["Product Code"] || "").toString().trim();
    const name = (r.name || r["Product Name"] || "").toString().trim();
    const costPrice = r.costPrice ?? r["Cost Price"];
    const sellingPrice = r.sellingPrice ?? r["Selling Price"];

    if (!productCode || !name || costPrice == null || sellingPrice == null) {
      errors.push(`Row ${i + 2}: missing productCode, name, costPrice or sellingPrice`);
      continue;
    }

    try {
      const brandId = await findOrCreate(brands, r.brand || r["Brand"]);
      const categoryId = await findOrCreate(categories, r.category || r["Category"]);
      const supplierId = await findOrCreate(suppliers, r.supplier || r["Supplier"]);

      const [existing] = await db.select().from(products).where(eq(products.productCode, productCode));

      const barcode = (r.barcode || r["Barcode"] || "").toString().trim() || null;
      const quantity = r.quantity ?? r["Quantity in Stock"];
      const reorderLevel = r.reorderLevel ?? r["Reorder Level"];
      const warrantyMonths = r.warrantyMonths ?? r["Warranty Months"];

      const values = {
        productCode,
        name,
        costPrice: String(costPrice),
        sellingPrice: String(sellingPrice),
      };
      if (brandId !== null) values.brandId = brandId;
      if (categoryId !== null) values.categoryId = categoryId;
      if (supplierId !== null) values.supplierId = supplierId;
      if (barcode !== null || !existing) values.barcode = barcode;
      values.quantity = quantity != null ? Number(quantity) : existing ? existing.quantity : 0;
      values.reorderLevel = reorderLevel != null ? Number(reorderLevel) : existing ? existing.reorderLevel : 3;
      values.warrantyMonths = warrantyMonths != null ? Number(warrantyMonths) : existing ? existing.warrantyMonths : 0;

      if (existing) {
        await db.update(products).set(values).where(eq(products.id, existing.id));
        updated++;
      } else {
        await db.insert(products).values(values);
        created++;
      }
    } catch (e) {
      errors.push(`Row ${i + 2}: ${e.message}`);
    }
  }

  return NextResponse.json({ created, updated, errors });
}
