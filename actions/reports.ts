"use server";

import { db } from "@/db";
import {
  loans,
  payments,
  members,
  books,
  bookCopies,
  users,
  fines,
} from "@/db/schema";
import { eq, ilike, or, and, gte, lte, isNotNull, ne, sql } from "drizzle-orm";

export interface ReportFilterParams {
  query?: string;
  startDate?: string;
  endDate?: string;
  type?: "ALL" | "LOAN" | "RETURN" | "PAYMENT";
  sortBy?: "createdAt" | "amount" | "memberName";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export async function getCombinedReports(params: ReportFilterParams) {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const offset = (page - 1) * limit;

  const startDate = params.startDate ? new Date(params.startDate) : undefined;
  const endDate = params.endDate ? new Date(params.endDate) : undefined;

  // Set jam ke paling akhir hari untuk endDate
  if (endDate) {
    endDate.setHours(23, 59, 59, 999);
  }

  // ==========================================================
  // 1. PEMINJAMAN (LOANS)
  //    - Nominal Tagihan : loans.amount (tagihan utama, tidak berubah)
  //    - Uang Diterima   : 0 (uang masuk tercatat di baris pembayaran)
  //    - Sisa Piutang    : = amount (saat peminjaman direkam belum ada
  //                        pembayaran; pelunasan muncul di baris payment)
  // ==========================================================

  // Total pembayaran sewa per loan (untuk ringkasan piutang berjalan saja)
  const paidPerLoan = db
    .select({
      loanId: payments.loanId,
      paid: sql<string>`sum(${payments.appliedAmount})`.as("paid"),
    })
    .from(payments)
    .where(and(eq(payments.type, "LOAN_FEE"), isNotNull(payments.loanId)))
    .groupBy(payments.loanId)
    .as("paid_per_loan");

  const loanConditions = [];
  if (startDate) loanConditions.push(gte(loans.createdAt, startDate));
  if (endDate) loanConditions.push(lte(loans.createdAt, endDate));
  if (params.query) {
    loanConditions.push(
      or(
        ilike(members.name, `%${params.query}%`),
        ilike(members.memberCode, `%${params.query}%`),
        ilike(sql`${loans.id}::text`, `%${params.query}%`),
        ilike(books.title, `%${params.query}%`),
      ),
    );
  }

  const rawLoans = await db
    .select({
      id: loans.id,
      code: sql<string>`substring(${loans.id}::text, 1, 8)`,
      type: sql<string>`'LOAN'`,
      date: loans.createdAt,
      memberName: members.name,
      memberCode: members.memberCode,
      bookTitle: books.title,
      amount: loans.amount,
      // sisa piutang SAAT INI (hanya untuk kartu ringkasan)
      outstandingNow: sql<string>`greatest(${loans.amount} - coalesce(${paidPerLoan.paid}, 0), 0)`,
      processedByName: users.name,
    })
    .from(loans)
    .innerJoin(members, eq(loans.memberId, members.id))
    .innerJoin(bookCopies, eq(loans.bookCopyId, bookCopies.id))
    .innerJoin(books, eq(bookCopies.bookId, books.id))
    .innerJoin(users, eq(loans.processedBy, users.id))
    .leftJoin(paidPerLoan, eq(loans.id, paidPerLoan.loanId))
    .where(loanConditions.length > 0 ? and(...loanConditions) : undefined);

  // ==========================================================
  // 2. PEMBAYARAN (PAYMENTS)
  //    - Nominal Tagihan : tagihan utama (loans.amount / fines.amount),
  //                        fallback ke amountToPay bila tidak terhubung
  //    - Uang Diterima   : payments.amountPaid
  //    - Sisa Piutang    : tagihan utama - akumulasi appliedAmount sampai
  //                        dengan pembayaran ini (running balance)
  //
  //  Window function dihitung di subquery TANPA filter, supaya filter
  //  tanggal/pencarian tidak merusak akumulasi pembayaran sebelumnya.
  // ==========================================================
  const paymentLedger = db
    .select({
      id: payments.id,
      code: sql<string>`substring(${payments.id}::text, 1, 8)`.as("code"),
      type: payments.type, // LOAN_FEE atau FINE_PAYMENT
      date: payments.paidAt,
      memberName: sql<string>`${members.name}`.as("member_name"),
      memberCode: sql<string>`${members.memberCode}`.as("member_code"),
      amountPaid: payments.amountPaid,
      appliedAmount: payments.appliedAmount,
      changeAmount: payments.changeAmount,
      paymentMethod: payments.paymentMethod,
      processedByName: sql<string>`${users.name}`.as("processed_by_name"),
      billAmount: sql<string>`case
        when ${payments.type} = 'FINE_PAYMENT'
          then coalesce(${fines.amount}, ${payments.amountToPay})
        else coalesce(${loans.amount}, ${payments.amountToPay})
      end`.as("bill_amount"),
      cumulativeApplied: sql<string>`sum(${payments.appliedAmount}) over (
        partition by case
          when ${payments.type} = 'FINE_PAYMENT'
            then coalesce(${payments.fineId}::text, ${payments.id}::text)
          else coalesce(${payments.loanId}::text, ${payments.id}::text)
        end
        order by ${payments.paidAt}, ${payments.createdAt}, ${payments.id}
      )`.as("cumulative_applied"),
    })
    .from(payments)
    .innerJoin(members, eq(payments.memberId, members.id))
    .innerJoin(users, eq(payments.processedBy, users.id))
    .leftJoin(loans, eq(payments.loanId, loans.id))
    .leftJoin(fines, eq(payments.fineId, fines.id))
    .as("payment_ledger");

  const paymentConditions = [];
  if (startDate) paymentConditions.push(gte(paymentLedger.date, startDate));
  if (endDate) paymentConditions.push(lte(paymentLedger.date, endDate));
  if (params.query) {
    paymentConditions.push(
      or(
        ilike(paymentLedger.memberName, `%${params.query}%`),
        ilike(paymentLedger.memberCode, `%${params.query}%`),
        ilike(sql`${paymentLedger.id}::text`, `%${params.query}%`),
      ),
    );
  }

  const rawPayments = await db
    .select()
    .from(paymentLedger)
    .where(
      paymentConditions.length > 0 ? and(...paymentConditions) : undefined,
    );

  // ==========================================================
  // 2b. RINGKASAN DENDA per alasan (keterlambatan / rusak / hilang)
  //     Nominal denda = fines.amount (tagihan utama). Denda berstatus
  //     WAIVED (dibebaskan) tidak dihitung. Filter tanggal memakai
  //     fines.createdAt; pencarian mengikuti member / buku / kode denda.
  // ==========================================================
  const fineConditions = [ne(fines.status, "WAIVED")];
  if (startDate) fineConditions.push(gte(fines.createdAt, startDate));
  if (endDate) fineConditions.push(lte(fines.createdAt, endDate));
  if (params.query) {
    fineConditions.push(
      or(
        ilike(members.name, `%${params.query}%`),
        ilike(members.memberCode, `%${params.query}%`),
        ilike(sql`${fines.id}::text`, `%${params.query}%`),
        ilike(books.title, `%${params.query}%`),
      )!,
    );
  }

  const fineTotalsRaw = await db
    .select({
      reason: fines.reason,
      total: sql<string>`coalesce(sum(${fines.amount}), 0)`,
    })
    .from(fines)
    .innerJoin(loans, eq(fines.loanId, loans.id))
    .innerJoin(members, eq(loans.memberId, members.id))
    .innerJoin(bookCopies, eq(loans.bookCopyId, bookCopies.id))
    .innerJoin(books, eq(bookCopies.bookId, books.id))
    .where(and(...fineConditions))
    .groupBy(fines.reason);

  const fineTotals = { OVERDUE: 0, DAMAGE: 0, LOST: 0 };
  for (const row of fineTotalsRaw) {
    fineTotals[row.reason] = Number(row.total);
  }

  // ==========================================================
  // 3. Normalisasi ke satu bentuk baris log
  // ==========================================================
  const loanRows = rawLoans.map((l) => {
    const amount = Number(l.amount);
    return {
      id: l.id,
      code: l.code,
      type: l.type,
      date: l.date,
      memberName: l.memberName,
      memberCode: l.memberCode,
      bookTitle: l.bookTitle,
      processedByName: l.processedByName,
      category: "PEMINJAMAN",
      amountNum: amount, // tagihan utama
      receivedNum: 0, // uang diterima (tidak ada di baris peminjaman)
      changeNum: 0,
      remainingNum: amount, // belum ada pembayaran saat log dibuat
    };
  });

  const paymentRows = rawPayments.map((p) => {
    const bill = Number(p.billAmount);
    const cumulative = Number(p.cumulativeApplied);
    return {
      id: p.id,
      code: p.code,
      type: p.type,
      date: p.date,
      memberName: p.memberName,
      memberCode: p.memberCode,
      bookTitle: "Penyelesaian Tagihan/Kasir",
      processedByName: p.processedByName,
      paymentMethod: p.paymentMethod,
      category: p.type === "FINE_PAYMENT" ? "BAYAR DENDA" : "BAYAR SEWA",
      amountNum: bill, // tagihan utama (tidak berubah)
      receivedNum: Number(p.amountPaid), // uang diterima (tabel payments)
      changeNum: Number(p.changeAmount), // kembalian
      remainingNum: Math.max(bill - cumulative, 0), // sisa setelah bayar ini
    };
  });

  // Gabungkan sesuai filter type
  let combinedList: any[] = [];
  if (!params.type || params.type === "ALL") {
    combinedList = [...loanRows, ...paymentRows];
  } else if (params.type === "LOAN") {
    combinedList = loanRows;
  } else if (params.type === "PAYMENT") {
    combinedList = paymentRows;
  }

  // 4. Sorting
  const sortBy = params.sortBy || "createdAt";
  const sortOrder = params.sortOrder || "desc";

  combinedList.sort((a, b) => {
    let valA: any = a.date;
    let valB: any = b.date;

    if (sortBy === "amount") {
      valA = a.amountNum;
      valB = b.amountNum;
    } else if (sortBy === "memberName") {
      valA = a.memberName.toLowerCase();
      valB = b.memberName.toLowerCase();
    }

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // 5. Agregasi Ringkasan Finansial
  const totalTransactions = combinedList.length;
  const totalLoanFeeRevenue = rawLoans.reduce(
    (sum, item) => sum + Number(item.amount),
    0,
  );
  // Uang masuk bersih = uang diterima - kembalian
  const totalCollectedPayments = rawPayments.reduce(
    (sum, item) => sum + Number(item.amountPaid) - Number(item.changeAmount),
    0,
  );
  // Piutang sewa yang masih berjalan saat ini
  const totalUnpaidPiutang = rawLoans.reduce(
    (sum, item) => sum + Number(item.outstandingNow),
    0,
  );

  // 6. Pagination
  const paginatedData = combinedList.slice(offset, offset + limit);

  return {
    data: paginatedData,
    summary: {
      totalTransactions,
      totalLoanFeeRevenue,
      totalCollectedPayments,
      totalUnpaidPiutang,
      totalFineOverdue: fineTotals.OVERDUE,
      totalFineDamage: fineTotals.DAMAGE,
      totalFineLost: fineTotals.LOST,
    },
    total: totalTransactions,
    page,
    limit,
    totalPages: Math.ceil(totalTransactions / limit),
  };
}
