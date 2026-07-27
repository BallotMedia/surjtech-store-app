import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sales, saleItems, payments, products, customers, users } from "@/lib/schema";
import { eq, desc, gte, lte, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

function genReceiptNo() {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  return `SRJ-${stamp}-${Math.floor(Math.random() * 900 + 100)}`;
}

export async function GET(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const conditions = [];
  if (from) conditions.push(gte(sales.createdAt, new Date(from)));
  if (to) conditions.push(lte(sales.createdAt, new Date(to)));

  const rows = await db
    .select({
      id: sales.id,
      receiptNo: sales.receiptNo,
      total: sales.total,
      discount: sales.discount,
      subtotal: sales.subtotal,
      status: sales.status,
      createdAt: sales.createdAt,
      customerPhone: customers.phone,
      customerName: customers.name,
      soldBy: users.fullName,
    })
    .from(sales)
    .leftJoin(customers, eq(sales.customerId, customers.id))
    .leftJoin(users, eq(sales.soldById, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(sales.id))
    .limit(200);

  return NextResponse.json({ sales: rows });
}

export async function POST(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { items, discount = 0, payments: paymentList, customerPhone, customerName } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }
  if (!paymentList || paymentList.length === 0) {
    return NextResponse.json({ error: "At least one payment method is required" }, { status: 400 });
  }

  try {
    const result = await db.transaction(async (tx) => {
      let subtotal = 0;
      const lineDetails = [];

      for (const item of items) {
        const [product] = await tx.select().from(products).where(eq(products.id, item.productId));
        if (!product) throw new Error(`Product not found: ${item.productId}`);
        if (product.quantity < item.quantity && !body.allowNegativeStock) {
          throw new Error(`Insufficient stock for ${product.name} (available: ${product.quantity})`);
        }
        const lineDiscount = Number(item.lineDiscount) || 0;
        const lineTotal = Number(product.sellingPrice) * item.quantity - lineDiscount;
        subtotal += lineTotal;
        lineDetails.push({ product, item, lineDiscount });
      }

      const total = subtotal - Number(discount || 0);
      const paidTotal = paymentList.reduce((s, p) => s + Number(p.amount), 0);
      if (Math.abs(paidTotal - total) > 1) {
        throw new Error(`Payments (₦${paidTotal}) do not match total (₦${total})`);
      }

      let customerId = null;
      if (customerPhone) {
        const [existing] = await tx.select().from(customers).where(eq(customers.phone, customerPhone));
        if (existing) {
          customerId = existing.id;
        } else {
          const [created] = await tx.insert(customers).values({ phone: customerPhone, name: customerName || null }).returning();
          customerId = created.id;
        }
      }

      const [sale] = await tx
        .insert(sales)
        .values({
          receiptNo: genReceiptNo(),
          customerId,
          soldById: session.id,
          subtotal: String(subtotal),
          discount: String(discount || 0),
          total: String(total),
          status: "completed",
        })
        .returning();

      for (const { product, item, lineDiscount } of lineDetails) {
        await tx.insert(saleItems).values({
          saleId: sale.id,
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitCost: product.costPrice,
          unitPrice: product.sellingPrice,
          lineDiscount: String(lineDiscount),
          warrantyMonths: product.warrantyMonths,
        });
        await tx
          .update(products)
          .set({ quantity: product.quantity - item.quantity })
          .where(eq(products.id, product.id));
      }

      for (const p of paymentList) {
        await tx.insert(payments).values({ saleId: sale.id, method: p.method, amount: String(p.amount) });
      }

      return sale;
    });

    return NextResponse.json({ sale: result }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Sale failed" }, { status: 400 });
  }
}
