import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  numeric,
  timestamp,
  boolean,
  date,
} from "drizzle-orm/pg-core";

// ---------- Users / Auth ----------
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: varchar("full_name", { length: 128 }).notNull(),
  role: varchar("role", { length: 16 }).notNull().default("staff"), // "admin" | "staff"
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- Catalog ----------
export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 64 }).notNull().unique(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 64 }).notNull().unique(),
});

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  notes: text("notes"),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  productCode: varchar("product_code", { length: 32 }).notNull().unique(),
  barcode: varchar("barcode", { length: 64 }).unique(),
  name: varchar("name", { length: 160 }).notNull(),
  brandId: integer("brand_id").references(() => brands.id),
  categoryId: integer("category_id").references(() => categories.id),
  costPrice: numeric("cost_price", { precision: 12, scale: 2 }).notNull(),
  sellingPrice: numeric("selling_price", { precision: 12, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(0),
  reorderLevel: integer("reorder_level").notNull().default(3),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  warrantyMonths: integer("warranty_months").notNull().default(0),
  status: varchar("status", { length: 16 }).notNull().default("active"), // active | inactive | discontinued
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- Customers ----------
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }),
  phone: varchar("phone", { length: 32 }).unique(),
});

// ---------- Sales ----------
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  receiptNo: varchar("receipt_no", { length: 32 }).notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id),
  soldById: integer("sold_by_id").references(() => users.id),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 12, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status", { length: 16 }).notNull().default("completed"), // completed | voided | held
  createdAt: timestamp("created_at").defaultNow(),
});

export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").references(() => sales.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  productName: varchar("product_name", { length: 160 }).notNull(),
  quantity: integer("quantity").notNull(),
  unitCost: numeric("unit_cost", { precision: 12, scale: 2 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  lineDiscount: numeric("line_discount", { precision: 12, scale: 2 }).notNull().default("0"),
  warrantyMonths: integer("warranty_months").notNull().default(0),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").references(() => sales.id).notNull(),
  method: varchar("method", { length: 16 }).notNull(), // cash | transfer | pos
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
});

// ---------- Expenses ----------
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 64 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  note: text("note"),
  expenseDate: date("expense_date").notNull(),
  recordedById: integer("recorded_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- Settings (single row) ----------
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  businessName: varchar("business_name", { length: 160 }).notNull().default("Surjtech Mobile Phones & Accessories Enterprises"),
  address: text("address"),
  phone: varchar("phone", { length: 32 }),
  email: varchar("email", { length: 128 }),
  facebook: varchar("facebook", { length: 128 }),
  instagram: varchar("instagram", { length: 128 }),
  logoUrl: text("logo_url"),
  receiptHeader: text("receipt_header"),
  receiptFooter: text("receipt_footer"),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(3),
});

// ---------- Audit log ----------
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 64 }).notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
});
