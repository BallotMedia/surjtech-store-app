import "dotenv/config";
import { db } from "./db.js";
import { users, brands, categories, suppliers, products, settings } from "./schema.js";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding SURJTECH database...");

  const adminHash = await bcrypt.hash("admin123", 10);
  const staffHash = await bcrypt.hash("staff123", 10);

  await db.insert(users).values([
    { username: "admin", passwordHash: adminHash, fullName: "Store Admin", role: "admin" },
    { username: "staff", passwordHash: staffHash, fullName: "Sales Staff", role: "staff" },
  ]).onConflictDoNothing();

  await db.insert(brands).values([
    { name: "Samsung" }, { name: "Apple" }, { name: "TECNO" },
    { name: "Infinix" }, { name: "itel" }, { name: "Xiaomi" }, { name: "Oppo" },
  ]).onConflictDoNothing();

  await db.insert(categories).values([
    { name: "Phones" }, { name: "Chargers" }, { name: "Earpieces & Earbuds" },
    { name: "Phone Cases" }, { name: "Screen Protectors" }, { name: "Power Banks" },
    { name: "Cables" }, { name: "Accessories" },
  ]).onConflictDoNothing();

  await db.insert(suppliers).values([
    { name: "Lagos Mobile Distributors", phone: "08010000000" },
    { name: "Computer Village Wholesale", phone: "08020000000" },
  ]).onConflictDoNothing();

  await db.insert(settings).values([{
    businessName: "Surjtech Mobile Phones & Accessories Enterprises",
    address: "Opp Adodo Comp, Kisi.",
    phone: "08140089229",
    email: "surjtech@gmail.com",
    facebook: "Surjtech",
    instagram: "surjtech_phones",
    logoUrl: "/logo.jpg",
    receiptHeader: "Surjtech Mobile Phones & Accessories Enterprises",
    receiptFooter: "Thank you for shopping with us!",
    lowStockThreshold: 3,
  }]).onConflictDoNothing();

  const brandRows = await db.select().from(brands);
  const catRows = await db.select().from(categories);
  const b = Object.fromEntries(brandRows.map((x) => [x.name, x.id]));
  const c = Object.fromEntries(catRows.map((x) => [x.name, x.id]));

  await db.insert(products).values([
    {
      productCode: "SRJ-0001", barcode: "6001234500011", name: "Samsung Galaxy A15",
      brandId: b["Samsung"], categoryId: c["Phones"], costPrice: "95000", sellingPrice: "115000",
      quantity: 8, reorderLevel: 3, warrantyMonths: 12, status: "active",
    },
    {
      productCode: "SRJ-0002", barcode: "6001234500028", name: "TECNO Spark 20",
      brandId: b["TECNO"], categoryId: c["Phones"], costPrice: "68000", sellingPrice: "82000",
      quantity: 12, reorderLevel: 4, warrantyMonths: 12, status: "active",
    },
    {
      productCode: "SRJ-0003", barcode: "6001234500035", name: "Infinix Hot 40",
      brandId: b["Infinix"], categoryId: c["Phones"], costPrice: "72000", sellingPrice: "89000",
      quantity: 2, reorderLevel: 3, warrantyMonths: 12, status: "active",
    },
    {
      productCode: "SRJ-0004", barcode: "6001234500042", name: "Type-C Fast Charger 33W",
      brandId: b["Samsung"], categoryId: c["Chargers"], costPrice: "3500", sellingPrice: "6000",
      quantity: 30, reorderLevel: 5, warrantyMonths: 3, status: "active",
    },
    {
      productCode: "SRJ-0005", barcode: "6001234500059", name: "Wireless Earbuds Pro",
      brandId: b["Xiaomi"], categoryId: c["Earpieces & Earbuds"], costPrice: "6500", sellingPrice: "11000",
      quantity: 1, reorderLevel: 3, warrantyMonths: 6, status: "active",
    },
  ]).onConflictDoNothing();

  console.log("Seed complete.");
  console.log("Admin login -> username: admin / password: admin123");
  console.log("Staff login -> username: staff / password: staff123");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
