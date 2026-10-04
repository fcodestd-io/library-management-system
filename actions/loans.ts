"use server";

import { db } from "@/db";
import {
  loans,
  members,
  books,
  bookCopies,
  librarySettings,
} from "@/db/schema";
import { eq, ilike, or, and, sql, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib//auth"; // Path konfigurasi NextAuth Anda
import { CreateLoanFormValues } from "@/lib/validations/loan";

// ==========================================
// 1. LIVE SEARCH MEMBERS FOR LOAN
// ==========================================
export async function searchMembersForLoan(query: string) {
  if (!query || query.length < 2) return [];

  // Ambil data member yang statusnya ACTIVE
  const activeMembers = await db
    .select({
      id: members.id,
      name: members.name,
      memberCode: members.memberCode,
      status: members.status,
    })
    .from(members)
    .where(
      and(
        eq(members.status, "ACTIVE"),
        or(
          ilike(members.name, `%${query}%`),
          ilike(members.memberCode, `%${query}%`),
        ),
      ),
    )
    .limit(10);

  // Hitung total peminjaman aktif (BORROWED / OVERDUE) untuk tiap member
  const results = await Promise.all(
    activeMembers.map(async (m) => {
      const activeLoanCount = await db
        .select({ count: count() })
        .from(loans)
        .where(
          and(
            eq(loans.memberId, m.id),
            or(eq(loans.status, "BORROWED"), eq(loans.status, "OVERDUE")),
          ),
        );

      return {
        id: m.id,
        name: m.name,
        memberCode: m.memberCode,
        activeLoans: Number(activeLoanCount[0].count),
      };
    }),
  );

  return results;
}

// ==========================================
// 2. LIVE SEARCH BOOKS FOR LOAN
// ==========================================
export async function searchBooksForLoan(query: string) {
  if (!query || query.length < 2) return [];

  // Cari buku aktif yang memiliki stok copy dengan condition = GOOD & status = AVAILABLE
  const availableBooks = await db
    .select({
      id: books.id,
      title: books.title,
      isbn: books.isbn,
      availableCopies: sql<number>`count(${bookCopies.id})`.mapWith(Number),
    })
    .from(books)
    .innerJoin(
      bookCopies,
      and(
        eq(books.id, bookCopies.bookId),
        eq(bookCopies.condition, "GOOD"),
        eq(bookCopies.status, "AVAILABLE"),
      ),
    )
    .where(
      and(
        eq(books.status, "ACTIVE"),
        or(ilike(books.title, `%${query}%`), ilike(books.isbn, `%${query}%`)),
      ),
    )
    .groupBy(books.id)
    .limit(10);

  return availableBooks;
}

export async function createLoan(
  values: CreateLoanFormValues,
  clientUserId?: string,
) {
  try {
    const session = await auth();
    const activeUserId = session?.user?.id || clientUserId;

    if (!activeUserId) {
      return { error: "Sesi telah berakhir. Silakan login kembali." };
    }

    const settings = await db.query.librarySettings.findFirst();
    const loanPricePerDay = Number(settings?.loanPricePerDay || 2000);
    const maxActiveLoans = settings?.maximumActiveLoans || 3;

    // 1. Cek Batas Peminjaman Aktif Member
    const activeLoanCount = await db
      .select({ count: count() })
      .from(loans)
      .where(
        and(
          eq(loans.memberId, values.memberId),
          or(eq(loans.status, "BORROWED"), eq(loans.status, "OVERDUE")),
        ),
      );

    if (Number(activeLoanCount[0].count) >= maxActiveLoans) {
      return {
        error: `Anggota ini telah mencapai batas peminjaman aktif maksimum (${maxActiveLoans} buku).`,
      };
    }

    // 2. Cari Eksemplar Copy yang Siap Dipinjam (GOOD & AVAILABLE)
    const availableCopy = await db.query.bookCopies.findFirst({
      where: and(
        eq(bookCopies.bookId, values.bookId),
        eq(bookCopies.condition, "GOOD"),
        eq(bookCopies.status, "AVAILABLE"),
      ),
    });

    if (!availableCopy) {
      return {
        error:
          "Maaf, eksemplar buku yang tersedia dalam kondisi baik sedang habis.",
      };
    }

    const borrowedAt = new Date();
    const dueAt = new Date();
    dueAt.setDate(borrowedAt.getDate() + values.loanDays);
    const totalAmount = loanPricePerDay * values.loanDays;

    // 3. Jalankan Transaksi Database via Pool (Atomic & Safe)
    const result = await db.transaction(async (tx) => {
      // A. Insert data ke tabel loans
      // Di dalam src/actions/loans.ts pada bagian insert loans:
      const [newLoan] = await tx
        .insert(loans)
        .values({
          memberId: values.memberId,
          bookCopyId: availableCopy.id,
          processedBy: activeUserId,
          borrowedAt,
          dueAt,
          returnedAt: null,
          amount: totalAmount.toString(),
          remainingAmount: totalAmount.toString(), // Inisialisasi sisa piutang sewa
          status: "BORROWED",
        })
        .returning({ id: loans.id });

      // B. Update status copy buku menjadi BORROWED
      await tx
        .update(bookCopies)
        .set({ status: "BORROWED", updatedAt: new Date() })
        .where(eq(bookCopies.id, availableCopy.id));

      // C. Fetch relasi detail transaksi untuk dicetak pada struk
      const loanDetail = await tx.query.loans.findFirst({
        where: eq(loans.id, newLoan.id),
        with: {
          member: true,
          bookCopy: {
            with: {
              book: true,
            },
          },
        },
      });

      return {
        loanId: newLoan.id,
        memberCode: loanDetail?.member?.memberCode || "-",
        memberName: loanDetail?.member?.name || "-",
        bookTitle: loanDetail?.bookCopy?.book?.title || "-",
        inventoryNumber: loanDetail?.bookCopy?.inventoryNumber || "-",
        borrowedAt: borrowedAt.toLocaleDateString("id-ID"),
        dueAt: dueAt.toLocaleDateString("id-ID"),
        loanDays: values.loanDays,
        totalAmount,
      };
    });

    revalidatePath("/loans");

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("LOAN_CREATE_ERROR:", error);
    return { error: "Gagal memproses transaksi peminjaman." };
  }
}

// Tambahkan di bagian bawah src/actions/loans.ts
export async function getLoanSettings() {
  const settings = await db.query.librarySettings.findFirst();
  return {
    loanPricePerDay: Number(settings?.loanPricePerDay || 2000),
    maximumLoanDays: settings?.maximumLoanDays || 7,
    maximumActiveLoans: settings?.maximumActiveLoans || 3,
  };
}
