"use server";

import { db } from "@/db";
import {
  loans,
  members,
  bookCopies,
  books,
  fines,
  payments,
  librarySettings,
} from "@/db/schema";
import { eq, ilike, or, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { ProcessReturnFormValues } from "@/lib/validations/return";

// 1. Live Search Peminjaman Aktif (Menggunakan remainingAmount)
export async function searchActiveLoans(query: string) {
  if (!query || query.length < 2) return [];

  const activeLoans = await db
    .select({
      id: loans.id,
      loanCode: sql<string>`substring(${loans.id}::text, 1, 8)`,
      borrowedAt: loans.borrowedAt,
      dueAt: loans.dueAt,
      amount: loans.amount,
      remainingAmount: loans.remainingAmount, // Sisa piutang sewa aktual
      memberId: members.id,
      memberName: members.name,
      memberCode: members.memberCode,
      bookTitle: books.title,
      bookValue: books.bookValue,
      inventoryNumber: bookCopies.inventoryNumber,
    })
    .from(loans)
    .innerJoin(members, eq(loans.memberId, members.id))
    .innerJoin(bookCopies, eq(loans.bookCopyId, bookCopies.id))
    .innerJoin(books, eq(bookCopies.bookId, books.id))
    .where(
      and(
        or(eq(loans.status, "BORROWED"), eq(loans.status, "OVERDUE")),
        or(
          ilike(sql`${loans.id}::text`, `%${query}%`),
          ilike(members.name, `%${query}%`),
          ilike(members.memberCode, `%${query}%`),
        ),
      ),
    )
    .limit(10);

  return activeLoans;
}

// 2. Eksekusi Pengembalian Buku & Transaksi Pembayaran Sisa Piutang + Denda
export async function processBookReturn(values: ProcessReturnFormValues) {
  try {
    const session = await auth();
    const activeUserId = session?.user?.id;

    if (!activeUserId) {
      return { error: "Sesi telah berakhir. Silakan login kembali." };
    }

    const loanData = await db.query.loans.findFirst({
      where: eq(loans.id, values.loanId),
      with: {
        member: true,
        bookCopy: {
          with: {
            book: true,
          },
        },
      },
    });

    if (!loanData) {
      return { error: "Data peminjaman tidak ditemukan." };
    }

    const settings = await db.query.librarySettings.findFirst();
    const dailyFineRate = Number(settings?.dailyFineRate || 1000);
    const damageRate = Number(settings?.damageCompensationRate || 50) / 100;
    const lostRate = Number(settings?.lostBookCompensationRate || 100) / 100;

    const today = new Date();
    const dueAt = new Date(loanData.dueAt);

    // A. Hitung Denda Keterlambatan
    const diffTime = today.getTime() - dueAt.getTime();
    const lateDays =
      diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
    const overdueFine = lateDays * dailyFineRate;

    // B. Hitung Denda Fisik Buku
    const bookPrice = Number(loanData.bookCopy.book.bookValue);
    let conditionFine = 0;
    let fineReason: "OVERDUE" | "DAMAGE" | "LOST" | null = null;

    if (values.returnCondition === "DAMAGED") {
      conditionFine = bookPrice * damageRate;
      fineReason = "DAMAGE";
    } else if (values.returnCondition === "LOST") {
      conditionFine = bookPrice * lostRate;
      fineReason = "LOST";
    } else if (overdueFine > 0) {
      fineReason = "OVERDUE";
    }

    const totalFineAmount = overdueFine + conditionFine;
    const loanFeeAmount = Number(loanData.remainingAmount) || 0; // SISA PIUTANG SEWA AKTUAL
    const grandTotalDebt = loanFeeAmount + totalFineAmount; // Total Tagihan

    const amountPaid = Number(values.amountPaid) || 0;
    const appliedAmount = Math.min(amountPaid, grandTotalDebt);
    const changeAmount = Math.max(0, amountPaid - grandTotalDebt);
    const remainingDebt = Math.max(0, grandTotalDebt - amountPaid);

    // Alokasi Pembayaran untuk Piutang Sewa dan Denda
    const paidForLoan = Math.min(amountPaid, loanFeeAmount);
    const newLoanRemainingAmount = Math.max(0, loanFeeAmount - paidForLoan);

    const paidForFine = Math.max(0, amountPaid - loanFeeAmount);
    const newFineRemainingAmount = Math.max(0, totalFineAmount - paidForFine);

    // C. Transaksi Atomic Database
    const result = await db.transaction(async (tx) => {
      // 1. Update Status Loan & Sisa Piutang Sewa
      await tx
        .update(loans)
        .set({
          returnedAt: today,
          returnedProcessedBy: activeUserId,
          remainingAmount: newLoanRemainingAmount.toFixed(2),
          status: "RETURNED",
          returnCondition: values.returnCondition,
          updatedAt: today,
        })
        .where(eq(loans.id, values.loanId));

      // 2. Update Status Eksemplar Buku
      const nextCopyStatus =
        values.returnCondition === "GOOD" ? "AVAILABLE" : "INACTIVE";
      await tx
        .update(bookCopies)
        .set({
          condition: values.returnCondition,
          status: nextCopyStatus,
          updatedAt: today,
        })
        .where(eq(bookCopies.id, loanData.bookCopyId));

      let createdFineId: string | null = null;

      // 3. Insert Record Denda (jika ada denda)
      if (totalFineAmount > 0 && fineReason) {
        const [newFine] = await tx
          .insert(fines)
          .values({
            loanId: values.loanId,
            amount: totalFineAmount.toFixed(2),
            remainingAmount: newFineRemainingAmount.toFixed(2),
            reason: fineReason,
            status: newFineRemainingAmount === 0 ? "PAID" : "UNPAID",
          })
          .returning({ id: fines.id });

        createdFineId = newFine.id;
      }

      // 4. Insert Record Pembayaran Universal
      const [newPayment] = await tx
        .insert(payments)
        .values({
          memberId: loanData.memberId,
          loanId: values.loanId,
          fineId: createdFineId,
          processedBy: activeUserId,
          type: totalFineAmount > 0 ? "FINE_PAYMENT" : "LOAN_FEE",
          paymentMethod: values.paymentMethod,
          amountToPay: grandTotalDebt.toFixed(2),
          amountPaid: amountPaid.toFixed(2),
          appliedAmount: appliedAmount.toFixed(2),
          changeAmount: changeAmount.toFixed(2),
          paidAt: today,
        })
        .returning({ id: payments.id });

      return {
        paymentCode: newPayment.id.slice(0, 8).toUpperCase(),
        loanCode: loanData.id.slice(0, 8).toUpperCase(),
        memberName: loanData.member.name,
        memberCode: loanData.member.memberCode,
        bookTitle: loanData.bookCopy.book.title,
        inventoryNumber: loanData.bookCopy.inventoryNumber,
        borrowedAt: new Date(loanData.borrowedAt).toLocaleDateString("id-ID"),
        returnedAt: today.toLocaleDateString("id-ID"),
        returnCondition: values.returnCondition,
        paymentMethod: values.paymentMethod,
        loanFeeAmount,
        totalFineAmount,
        grandTotalDebt,
        amountPaid,
        appliedAmount,
        changeAmount,
        remainingDebt,
      };
    });

    revalidatePath("/returns");
    revalidatePath("/payments");
    revalidatePath("/loans");
    revalidatePath("/members");

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("RETURN_PROCESS_ERROR:", error);
    return { error: "Gagal memproses pengembalian buku dan pembayaran." };
  }
}
