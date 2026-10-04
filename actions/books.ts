"use server";

import { db } from "@/db";
import { books, bookCopies, categories, racks, rooms } from "@/db/schema";
import { eq, ilike, or, desc, sql, and, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  BulkBookFormValues,
  SingleBookEditFormValues,
  BookCopyEditFormValues,
} from "@/lib/validations/book";

// Live Search Categories
export async function searchCategories(query: string) {
  if (!query || query.length < 2) return [];
  return await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(ilike(categories.name, `%${query}%`))
    .limit(10);
}

// Live Search Racks (mencari berdasarkan code rak)
export async function searchRacks(query: string) {
  if (!query || query.length < 2) return [];
  return await db
    .select({
      id: racks.id,
      code: racks.code,
      name: racks.name,
      roomName: rooms.name,
    })
    .from(racks)
    .leftJoin(rooms, eq(racks.roomId, rooms.id))
    .where(ilike(racks.code, `%${query}%`))
    .limit(10);
}

// GET LIST BOOKS
export async function getBooks(query: string, page: number, limit = 5) {
  const offset = (page - 1) * limit;
  const searchCondition = query
    ? or(
        ilike(books.title, `%${query}%`),
        ilike(books.isbn, `%${query}%`),
        ilike(categories.name, `%${query}%`),
      )
    : undefined;

  const data = await db
    .select({
      id: books.id,
      title: books.title,
      isbn: books.isbn,
      bookValue: books.bookValue,
      status: books.status,
      categoryName: categories.name,
      totalCopies: sql<number>`count(${bookCopies.id})`.mapWith(Number),
    })
    .from(books)
    .leftJoin(categories, eq(books.categoryId, categories.id))
    .leftJoin(bookCopies, eq(books.id, bookCopies.bookId))
    .where(searchCondition)
    .groupBy(books.id, categories.name)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(books.createdAt));

  const totalQuery = await db
    .select({ count: sql<number>`count(*)` })
    .from(books)
    .leftJoin(categories, eq(books.categoryId, categories.id))
    .where(searchCondition);

  return { data, total: Number(totalQuery[0].count) };
}

// BULK INSERT BOOKS & COPIES
export async function createBulkBooks(values: BulkBookFormValues) {
  try {
    const today = new Date().toISOString().split("T")[0];

    for (const item of values.books) {
      // 1. Insert Book
      const [insertedBook] = await db
        .insert(books)
        .values({
          categoryId: item.categoryId,
          title: item.title,
          isbn: item.isbn || null,
          bookValue: item.bookValue.toString(),
          status: "ACTIVE",
        })
        .returning({ id: books.id });

      // 2. Generate Copies
      const copiesData = [];
      const prefix = item.isbn
        ? item.isbn.replace(/\D/g, "").slice(-4)
        : item.title.replace(/\s+/g, "").toUpperCase().slice(0, 4);

      for (let i = 1; i <= item.totalCopy; i++) {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const invNo = `INV-${prefix}-${randomNum}`;

        copiesData.push({
          bookId: insertedBook.id,
          inventoryNumber: invNo,
          rackId: item.rackId,
          condition: "GOOD" as const,
          status: "AVAILABLE" as const,
          acquiredAt: today,
        });
      }

      await db.insert(bookCopies).values(copiesData);
    }

    revalidatePath("/books");
    return { success: true };
  } catch (error) {
    return { error: "Gagal menyimpan koleksi buku." };
  }
}

// UPDATE SINGLE BOOK
export async function updateSingleBook(
  id: string,
  values: SingleBookEditFormValues,
) {
  try {
    await db
      .update(books)
      .set({
        categoryId: values.categoryId,
        title: values.title,
        isbn: values.isbn || null,
        bookValue: values.bookValue.toString(),
        status: values.isActive ? "ACTIVE" : "INACTIVE",
        updatedAt: new Date(),
      })
      .where(eq(books.id, id));

    revalidatePath("/books");
    return { success: true };
  } catch (error) {
    return { error: "Gagal mengupdate data buku." };
  }
}

// DELETE BOOK
export async function deleteBook(id: string) {
  try {
    // Hapus seluruh eksemplar copies terlebih dahulu jika ada
    await db.delete(bookCopies).where(eq(bookCopies.bookId, id));
    await db.delete(books).where(eq(books.id, id));

    revalidatePath("/books");
    return {
      success: true,
      message: "Buku dan seluruh eksemplarnya berhasil dihapus.",
    };
  } catch (error) {
    return { error: "Gagal menghapus buku." };
  }
}

// GET COPIES BY BOOK ID
export async function getCopiesByBookId(bookId: string) {
  return await db
    .select({
      id: bookCopies.id,
      inventoryNumber: bookCopies.inventoryNumber,
      condition: bookCopies.condition,
      status: bookCopies.status,
      acquiredAt: bookCopies.acquiredAt,
      rackId: bookCopies.rackId,
      rackCode: racks.code,
      rackName: racks.name,
      roomName: rooms.name,
    })
    .from(bookCopies)
    .leftJoin(racks, eq(bookCopies.rackId, racks.id))
    .leftJoin(rooms, eq(racks.roomId, rooms.id))
    .where(eq(bookCopies.bookId, bookId))
    .orderBy(desc(bookCopies.createdAt));
}

// UPDATE SINGLE COPY
export async function updateBookCopy(
  bookId: string,
  copyId: string,
  values: BookCopyEditFormValues,
) {
  try {
    await db
      .update(bookCopies)
      .set({
        rackId: values.rackId,
        condition: values.condition,
        status: values.status,
        acquiredAt: values.acquiredAt,
        updatedAt: new Date(),
      })
      .where(eq(bookCopies.id, copyId));

    revalidatePath(`/books/${bookId}/copies`);
    return { success: true };
  } catch (error) {
    return { error: "Gagal mengupdate data eksemplar buku." };
  }
}
