import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sales, saleItems, expenses, products, brands, categories } from "@/lib/schema";
import { eq, gte, lte, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(req) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "sales";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const dateConds = [];
  if (from) dateConds.push(gte(sales.createdAt, new Date(from)));
  if (to) dateConds.push(lte(sales.createdAt, new Date(to + "T23:59:59")));
  dateConds.push(eq(sales.status, "completed"));

  if (type === "sales" || type === "profit") {
    const salesRows = await db.select().from(sales).where(and(...dateConds));
    let totalRevenue = 0, totalCost = 0, totalDiscount = 0;
    const byDay = {};

    for (const sale of salesRows) {
      totalRevenue += Number(sale.total);
      totalDiscount += Number(sale.discount);
      const day = new Date(sale.createdAt).toISOString().slice(0, 10);
      byDay[day] = (byDay[day] || 0) + Number(sale.total);

      const items = await db.select().from(saleItems).where(eq(saleItems.saleId, sale.id));
      for (const item of items) {
        totalCost += Number(item.unitCost) * item.quantity;
      }
    }

    return NextResponse.json({
      type,
      transactionCount: salesRows.length,
      totalRevenue,
      totalCost,
      totalDiscount,
      totalProfit: totalRevenue - totalCost,
      byDay: Object.entries(byDay).map(([date, amount]) => ({ date, amount })).sort((a, b) => a.date.localeCompare(b.date)),
    });
  }

  if (type === "expenses") {
    const conds = [];
    if (from) conds.push(gte(expenses.expenseDate, from));
    if (to) conds.push(lte(expenses.expenseDate, to));
    const rows = await db.select().from(expenses).where(conds.length ? and(...conds) : undefined);
    const byCategory = {};
    let total = 0;
    for (const r of rows) {
      byCategory[r.category] = (byCategory[r.category] || 0) + Number(r.amount);
      total += Number(r.amount);
    }
    return NextResponse.json({
      type,
      total,
      byCategory: Object.entries(byCategory).map(([category, amount]) => ({ category, amount })),
    });
  }

  if (type === "best-sellers") {
    const salesRows = await db.select().from(sales).where(and(...dateConds));
    const tally = {};
    for (const sale of salesRows) {
      const items = await db.select().from(saleItems).where(eq(saleItems.saleId, sale.id));
      for (const item of items) {
        if (!tally[item.productName]) tally[item.productName] = { name: item.productName, qty: 0, revenue: 0 };
        tally[item.productName].qty += item.quantity;
        tally[item.productName].revenue += Number(item.unitPrice) * item.quantity - Number(item.lineDiscount || 0);
      }
    }
    const list = Object.values(tally).sort((a, b) => b.qty - a.qty);
    return NextResponse.json({ type, bestSellers: list });
  }

  if (type === "stock") {
    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        quantity: products.quantity,
        costPrice: products.costPrice,
        sellingPrice: products.sellingPrice,
        brand: brands.name,
        category: categories.name,
      })
      .from(products)
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.status, "active"));

    const valuationAtCost = rows.reduce((s, r) => s + Number(r.costPrice) * r.quantity, 0);
    const valuationAtSelling = rows.reduce((s, r) => s + Number(r.sellingPrice) * r.quantity, 0);

    return NextResponse.json({ type, products: rows, valuationAtCost, valuationAtSelling });
  }

  return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
}
