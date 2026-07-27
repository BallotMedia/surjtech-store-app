import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sales, saleItems, products, expenses } from "@/lib/schema";
import { eq, gte, and, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = startOfToday();
  const monthStart = startOfMonth();

  const todaySales = await db
    .select()
    .from(sales)
    .where(and(gte(sales.createdAt, today), eq(sales.status, "completed")));

  const totalSalesToday = todaySales.reduce((s, r) => s + Number(r.total), 0);

  let todaysProfit = 0;
  if (session.role === "admin") {
    for (const sale of todaySales) {
      const items = await db.select().from(saleItems).where(eq(saleItems.saleId, sale.id));
      for (const item of items) {
        todaysProfit += (Number(item.unitPrice) - Number(item.unitCost)) * item.quantity - Number(item.lineDiscount || 0);
      }
      todaysProfit -= Number(sale.discount || 0);
    }
  }

  const allProducts = await db.select().from(products).where(eq(products.status, "active"));
  const totalProducts = allProducts.length;
  const lowStock = allProducts.filter((p) => p.quantity <= p.reorderLevel);

  const monthSales = await db
    .select()
    .from(sales)
    .where(and(gte(sales.createdAt, monthStart), eq(sales.status, "completed")));
  const monthlyIncome = monthSales.reduce((s, r) => s + Number(r.total), 0);

  let monthlyExpenses = 0;
  if (session.role === "admin") {
    const expenseRows = await db
      .select()
      .from(expenses)
      .where(gte(expenses.expenseDate, monthStart.toISOString().slice(0, 10)));
    monthlyExpenses = expenseRows.reduce((s, r) => s + Number(r.amount), 0);
  }

  return NextResponse.json({
    totalSalesToday,
    todaysProfit: session.role === "admin" ? todaysProfit : null,
    totalProducts,
    lowStockCount: lowStock.length,
    lowStockItems: lowStock.slice(0, 10).map((p) => ({ id: p.id, name: p.name, quantity: p.quantity, reorderLevel: p.reorderLevel })),
    monthlyIncome,
    monthlyExpenses: session.role === "admin" ? monthlyExpenses : null,
  });
}
