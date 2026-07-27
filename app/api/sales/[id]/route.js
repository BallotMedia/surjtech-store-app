import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sales, saleItems, payments, customers, users, products } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(req, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const [sale] = await db
    .select({
      id: sales.id,
      receiptNo: sales.receiptNo,
      subtotal: sales.subtotal,
      discount: sales.discount,
      total: sales.total,
      status: sales.status,
      createdAt: sales.createdAt,
      customerName: customers.name,
      customerPhone: customers.phone,
      soldBy: users.fullName,
    })
    .from(sales)
    .leftJoin(customers, eq(sales.customerId, customers.id))
    .leftJoin(users, eq(sales.soldById, users.id))
    .where(eq(sales.id, Number(id)));

  if (!sale) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const items = await db.select().from(saleItems).where(eq(saleItems.saleId, sale.id));
  const pays = await db.select().from(payments).where(eq(payments.saleId, sale.id));

  return NextResponse.json({ sale, items, payments: pays });
}

export async function PATCH(req, { params }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required to void a sale" }, { status: 403 });
  }
  const { id } = await params;
  const { action } = await req.json();

  if (action !== "void") return NextResponse.json({ error: "Unsupported action" }, { status: 400 });

  const result = await db.transaction(async (tx) => {
    const [sale] = await tx.select().from(sales).where(eq(sales.id, Number(id)));
    if (!sale) throw new Error("Sale not found");
    if (sale.status === "voided") throw new Error("Sale already voided");

    const items = await tx.select().from(saleItems).where(eq(saleItems.saleId, sale.id));
    for (const item of items) {
      const [product] = await tx.select().from(products).where(eq(products.id, item.productId));
      if (product) {
        await tx.update(products).set({ quantity: product.quantity + item.quantity }).where(eq(products.id, product.id));
      }
    }
    const [updated] = await tx.update(sales).set({ status: "voided" }).where(eq(sales.id, sale.id)).returning();
    return updated;
  });

  return NextResponse.json({ sale: result });
}
