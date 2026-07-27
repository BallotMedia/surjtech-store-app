import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession, hashPassword } from "@/lib/auth";

export async function PATCH(req, { params }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const { id } = await params;
  const targetId = Number(id);

  if (targetId === session.id) {
    return NextResponse.json({ error: "Use the account page to change your own password" }, { status: 400 });
  }

  const body = await req.json();
  const update = {};

  if (body.active !== undefined) update.active = !!body.active;
  if (body.role !== undefined) update.role = body.role === "admin" ? "admin" : "staff";
  if (body.fullName !== undefined) update.fullName = body.fullName;
  if (body.newPassword) {
    if (body.newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    update.passwordHash = await hashPassword(body.newPassword);
  }

  const [updated] = await db
    .update(users)
    .set(update)
    .where(eq(users.id, targetId))
    .returning({ id: users.id, username: users.username, fullName: users.fullName, role: users.role, active: users.active });

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ user: updated });
}
