"use server";

import { db } from "@/db";
import {
  payments,
  loans,
  fines,
  members,
  books,
  bookCopies,
} from "@/db/schema";
import { eq, ilike, or, and, sql, gt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { CreatePaymentFormValues } from "@/lib/validations/payment";

// 1. Live Search Anggota + Rekap Total Piutang Sewa (remainingAmount) & Denda
export async function searchMembersWithDebt(query: string) {
  if (!query || query.length < 2) return [];

  const matchedMembers = await db
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

  const results = await Promise.all(
    matchedMembers.map(async (m) => {
      // Ambil peminjaman aktif yang masih memiliki sisa piutang sewa (remainingAmount > 0)
      const activeLoansList = await db
        .select({
          loanId: loans.id,
          loanCode: sql<string>`substring(${loans.id}::text, 1, 8)`,
          amount: loans.amount,
          remainingAmount: loans.remainingAmount, // Ambil sisa piutang sewa aktual
          bookTitle: books.title,
        })
        .from(loans)
        .innerJoin(bookCopies, eq(loans.bookCopyId, bookCopies.id))
        .innerJoin(books, eq(bookCopies.bookId, books.id))
        .where(
          and(
            eq(loans.memberId, m.id),
            gt(loans.remainingAmount, "0"), // Filter hanya yang belum lunas
          ),
        );

      // Ambil denda yang belum lunas (remainingAmount > 0)
      const unpaidFinesList = await db
        .select({
          fineId: fines.id,
          loanId: fines.loanId,
          remainingAmount: fines.remainingAmount,
          reason: fines.reason,
        })
        .from(fines)
        .innerJoin(loans, eq(fines.loanId, loans.id))
        .where(and(eq(loans.memberId, m.id), gt(fines.remainingAmount, "0")));

      const totalLoanDebt = activeLoansList.reduce(
        (acc, curr) => acc + Number(curr.remainingAmount),
        0,
      );
      const totalFineDebt = unpaidFinesList.reduce(
        (acc, curr) => acc + Number(curr.remainingAmount),
        0,
      );

      return {
        id: m.id,
        name: m.name,
        memberCode: m.memberCode,
        activeLoans: activeLoansList,
        unpaidFines: unpaidFinesList,
        totalLoanDebt,
        totalFineDebt,
        grandTotalDebt: totalLoanDebt + totalFineDebt,
      };
    }),
  );

  return results;
}

// 2. Transaksi Eksekusi Pembayaran Kasir
export async function processPaymentTransaction(
  values: CreatePaymentFormValues,
) {
  try {
    const session = await auth();
    const activeUserId = session?.user?.id;

    if (!activeUserId) {
      return { error: "Sesi telah berakhir. Silakan login kembali." };
    }

    const member = await db.query.members.findFirst({
      where: eq(members.id, values.memberId),
    });

    if (!member) return { error: "Data anggota tidak ditemukan." };

    let targetTotalDebt = 0;
    let fineRecord = null;
    let loanRecord = null;

    if (values.paymentType === "FINE_PAYMENT" && values.fineId) {
      fineRecord = await db.query.fines.findFirst({
        where: eq(fines.id, values.fineId),
      });
      if (fineRecord) targetTotalDebt = Number(fineRecord.remainingAmount);
    } else if (values.loanId) {
      loanRecord = await db.query.loans.findFirst({
        where: eq(loans.id, values.loanId),
      });
      if (loanRecord) targetTotalDebt = Number(loanRecord.remainingAmount);
    }

    if (targetTotalDebt <= 0) {
      return { error: "Tidak ada piutang/tagihan yang perlu dibayar." };
    }

    const amountPaid = Number(values.amountPaid);
    const appliedAmount = Math.min(amountPaid, targetTotalDebt);
    const changeAmount = Math.max(0, amountPaid - targetTotalDebt);
    const nextRemainingDebt = Math.max(0, targetTotalDebt - appliedAmount);

    const result = await db.transaction(async (tx) => {
      // A. Insert Record Pembayaran
      const [newPayment] = await tx
        .insert(payments)
        .values({
          memberId: values.memberId,
          loanId: values.loanId || null,
          fineId: values.fineId || null,
          processedBy: activeUserId,
          type: values.paymentType,
          paymentMethod: values.paymentMethod,
          amountToPay: targetTotalDebt.toFixed(2),
          amountPaid: amountPaid.toFixed(2),
          appliedAmount: appliedAmount.toFixed(2),
          changeAmount: changeAmount.toFixed(2),
          paidAt: new Date(),
        })
        .returning({ id: payments.id });

      // B. Update Sisa Tagihan Denda jika Pembayaran Denda
      if (values.paymentType === "FINE_PAYMENT" && values.fineId) {
        await tx
          .update(fines)
          .set({
            remainingAmount: nextRemainingDebt.toFixed(2),
            status: nextRemainingDebt === 0 ? "PAID" : "UNPAID",
            updatedAt: new Date(),
          })
          .where(eq(fines.id, values.fineId));
      }

      // C. Update Sisa Tagihan Sewa jika Pembayaran Piutang Peminjaman
      if (values.paymentType === "LOAN_FEE" && values.loanId) {
        await tx
          .update(loans)
          .set({
            remainingAmount: nextRemainingDebt.toFixed(2),
            updatedAt: new Date(),
          })
          .where(eq(loans.id, values.loanId));
      }

      return {
        paymentCode: newPayment.id.slice(0, 8).toUpperCase(),
        memberName: member.name,
        memberCode: member.memberCode,
        paymentType:
          values.paymentType === "FINE_PAYMENT"
            ? "Pelunasan Denda"
            : "Sewa Peminjaman",
        paymentMethod: values.paymentMethod,
        targetTotalDebt,
        amountPaid,
        appliedAmount,
        changeAmount,
        nextRemainingDebt,
        paidAt: new Date().toLocaleDateString("id-ID"),
      };
    });

    revalidatePath("/payments");
    revalidatePath("/returns");
    revalidatePath("/loans");
    revalidatePath("/members");

    return { success: true, data: result };
  } catch (error) {
    console.error("PAYMENT_TRANSACTION_ERROR:", error);
    return { error: "Gagal memproses transaksi pembayaran." };
  }
}
