"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, ilike, or, desc, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { UserFormValues, UserUpdateFormValues } from "@/lib/validations/user";

export async function getUsers(query: string, page: number, limit = 5) {
  const offset = (page - 1) * limit;
  const searchCondition = query
    ? or(ilike(users.name, `%${query}%`), ilike(users.email, `%${query}%`))
    : undefined;

  const data = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
    })
    .from(users)
    .where(searchCondition)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(users.createdAt));

  const totalQuery = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(searchCondition);

  return { data, total: Number(totalQuery[0].count) };
}

export async function createUser(data: UserFormValues) {
  try {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    });
    if (existing) return { error: "Email sudah terdaftar." };

    const passwordHash = await bcrypt.hash(data.password, 10);
    await db.insert(users).values({
      name: data.name,
      email: data.email,
      passwordHash,
      role: "STAFF", // Hardcode role
      status: "ACTIVE",
    });

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    return { error: "Gagal menambahkan user." };
  }
}

export async function updateUser(id: string, data: UserUpdateFormValues) {
  try {
    const existing = await db.query.users.findFirst({
      where: eq(users.id, id),
    });
    if (!existing) return { error: "User tidak ditemukan." };

    // Cek duplikasi email jika email diubah
    if (data.email !== existing.email) {
      const emailTaken = await db.query.users.findFirst({
        where: eq(users.email, data.email),
      });
      if (emailTaken) return { error: "Email sudah digunakan user lain." };
    }

    const updateData: any = {
      name: data.name,
      email: data.email,
      updatedAt: new Date(),
    };
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    await db.update(users).set(updateData).where(eq(users.id, id));
    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    return { error: "Gagal mengupdate user." };
  }
}

export async function deleteUser(id: string) {
  try {
    const user = await db.query.users.findFirst({ where: eq(users.id, id) });
    if (!user) return { error: "User tidak ditemukan." };
    if (user.role === "OWNER")
      return { error: "Data OWNER tidak boleh dihapus." };

    await db.delete(users).where(eq(users.id, id));
    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    return {
      error: "Gagal menghapus user. Pastikan tidak ada data yang terelasi.",
    };
  }
}
