"use server";

import { db } from "@/db";
import { categories, books, bookCopies, loans } from "@/db/schema";
import { eq, ilike, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { CategoryFormValues } from "@/lib/validations/category";

export async function getCategories(query: string, page: number, limit = 5) {
  const offset = (page - 1) * limit;
  const searchCondition = query
    ? ilike(categories.name, `%${query}%`)
    : undefined;

  // Query mengambil kategori, total buku, dan total buku yang sedang dipinjam
  const data = await db
    .select({
      id: categories.id,
      name: categories.name,
      totalBooks: sql<number>`count(DISTINCT ${books.id})`.mapWith(Number),
      totalLoaned: sql<number>`count(DISTINCT ${loans.id})`.mapWith(Number),
    })
    .from(categories)
    .leftJoin(books, eq(categories.id, books.categoryId))
    .leftJoin(bookCopies, eq(books.id, bookCopies.bookId))
    .leftJoin(
      loans,
      sql`${bookCopies.id} = ${loans.bookCopyId} AND ${loans.status} = 'BORROWED'`,
    )
    .where(searchCondition)
    .groupBy(categories.id)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(categories.createdAt));

  const totalQuery = await db
    .select({ count: sql<number>`count(*)` })
    .from(categories)
    .where(searchCondition);

  return { data, total: Number(totalQuery[0].count) };
}

export async function createCategory(values: CategoryFormValues) {
  try {
    await db.insert(categories).values({ name: values.name });
    revalidatePath("/categories");
    return { success: true };
  } catch (error) {
    return { error: "Gagal menambahkan kategori." };
  }
}

export async function updateCategory(id: string, values: CategoryFormValues) {
  try {
    await db
      .update(categories)
      .set({ name: values.name, updatedAt: new Date() })
      .where(eq(categories.id, id));

    revalidatePath("/categories");
    return { success: true };
  } catch (error) {
    return { error: "Gagal memperbarui kategori." };
  }
}

export async function deleteCategory(id: string) {
  try {
    // Cek apakah kategori masih memiliki relasi buku
    const bookCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(books)
      .where(eq(books.categoryId, id));

    if (Number(bookCount[0].count) > 0) {
      return {
        error:
          "Kategori tidak dapat dihapus karena masih memiliki buku terdaftar.",
      };
    }

    await db.delete(categories).where(eq(categories.id, id));
    revalidatePath("/categories");
    return { success: true, message: "Kategori berhasil dihapus." };
  } catch (error) {
    return { error: "Gagal menghapus kategori." };
  }
}
