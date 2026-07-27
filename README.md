# Surjtech Store Manager

A store management app for **Surjtech Mobile Phones & Accessories Enterprises** — inventory, POS/sales, expenses, customers with warranty tracking, reports, and settings.

## Tech stack
- Next.js (App Router) + Tailwind CSS
- PostgreSQL + Drizzle ORM
- JWT cookie-based auth (bcrypt password hashing)

Postgres was chosen (instead of, say, SQLite) specifically so this can run on **fully free hosting**: Vercel (frontend + API) + a free-tier Postgres like Neon or Supabase.

## Default logins (seeded)
- Admin — username: `admin` / password: `admin123`
- Staff — username: `staff` / password: `staff123`

**Change these passwords before going live** — see "First things to do after deploying" below.

## Local development

1. Install dependencies:
   ```
   npm install
   ```
2. Create a `.env` file (see `.env.example`):
   ```
   DATABASE_URL="postgresql://user:password@host:5432/dbname"
   JWT_SECRET="a-long-random-string"
   ```
3. Push the schema to your database:
   ```
   npx drizzle-kit push
   ```
4. Seed sample data (admin/staff accounts, sample products, your branding):
   ```
   node lib/seed.js
   ```
5. Run the dev server:
   ```
   npm run dev
   ```

## Free deployment (Vercel + Neon/Supabase)

### 1. Create a free Postgres database
- **Neon** (neon.tech) or **Supabase** (supabase.com) both have generous free tiers.
- Create a project, copy the connection string (it looks like `postgresql://user:pass@host/dbname?sslmode=require`).

### 2. Push your schema to the live database
Set `DATABASE_URL` in a local `.env` to the live connection string, then run:
```
npx drizzle-kit push
node lib/seed.js
```
(You only need to run the seed script once, to create the admin/staff accounts and starter data.)

### 3. Deploy to Vercel
- Push this project to a GitHub repo.
- Go to vercel.com → New Project → import the repo (Vercel's free "Hobby" plan covers this).
- Add environment variables in the Vercel project settings:
  - `DATABASE_URL` — your Neon/Supabase connection string
  - `JWT_SECRET` — a long random string (generate one with `openssl rand -base64 32`)
- Deploy. Vercel gives you a free `.vercel.app` URL immediately; you can attach a custom domain later for free (you just need to own the domain).

### First things to do after deploying
1. Log in as `admin` / `admin123` and change the admin password (via your database, or ask for a "change password" feature to be added).
2. Go to **Settings** and confirm the business details/logo are correct.
3. Go to **Products** and replace the sample products with your real inventory (or bulk-import — ask if you'd like a CSV import feature added).
4. Create real staff accounts (ask if you'd like a "manage staff" screen added — currently accounts are seeded directly).

## Notes on the current build
- Walk-in customers: phone/name are optional at checkout — sales work fine with no customer attached.
- Barcode scanners that act as keyboards work out of the box on the POS screen (scan, then press Enter).
- Receipts print via the browser's print dialog — works with most receipt printers as a generic/PDF printer, and standard printers too.
- Staff accounts cannot see cost price, profit, expenses, reports, or settings — only admin can.

## Feature additions since initial build
- **Change password** — every user can update their own password from "My account" in the sidebar.
- **Manage Staff** (admin only) — create staff/admin accounts, change roles, reset anyone's password, and disable/enable accounts (disabled accounts can't log in). Admins can't edit their own account here — use "My account" for that.
- **Products CSV import** (admin only) — bulk-add or bulk-update products from a CSV. Matches existing products by `productCode` and updates only the fields present in each row (blank/omitted fields keep their current value). A template is available for download from the Products page.
