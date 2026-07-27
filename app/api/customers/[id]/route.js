import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customers, sales, saleItems } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(req, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const [customer] = await db.select().from(customers).where(eq(customers.id, Number(id)));
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const customerSales = await db
    .select()
    .from(sales)
    .where(eq(sales.customerId, customer.id))
    .orderBy(desc(sales.createdAt));

  const purchases = [];
  for (const sale of customerSales) {
    const items = await db.select().from(saleItems).where(eq(saleItems.saleId, sale.id));
    for (const item of items) {
      let warrantyExpires = null;
      if (item.warrantyMonths > 0) {
        const d = new Date(sale.createdAt);
        d.setMonth(d.getMonth() + item.warrantyMonths);
        warrantyExpires = d.toISOString();
      }
      purchases.push({
        saleId: sale.id,
        receiptNo: sale.receiptNo,
        date: sale.createdAt,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        warrantyMonths: item.warrantyMonths,
        warrantyExpires,
        warrantyActive: warrantyExpires ? new Date(warrantyExpires) > new Date() : false,
      });
    }
  }

  return NextResponse.json({ customer, purchases });
}
