"use server";

import { db } from "@/db";
import {
  loans,
  payments,
  members,
  books,
  categories,
  bookCopies,
  racks,
  rooms,
  fines,
} from "@/db/schema";
import { gte, sql, eq, or } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function getDashboardData() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  // 1. Data Metric Cards
  const totalMembersRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(members)
    .where(eq(members.status, "ACTIVE"));

  const activeLoansRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(loans)
    .where(or(eq(loans.status, "BORROWED"), eq(loans.status, "OVERDUE")));

  const totalPaymentsRes = await db
    .select({
      totalCollected: sql<number>`coalesce(sum(${payments.appliedAmount}), 0)`,
    })
    .from(payments)
    .where(gte(payments.paidAt, thirtyDaysAgo));

  const remainingPiutangRes = await db
    .select({
      activeLoanPiutang: sql<number>`coalesce(sum(${loans.remainingAmount}), 0)`,
    })
    .from(loans)
    .where(gte(loans.remainingAmount, "0"));

  const remainingFinesRes = await db
    .select({
      unpaidFines: sql<number>`coalesce(sum(${fines.remainingAmount}), 0)`,
    })
    .from(fines)
    .where(gte(fines.remainingAmount, "0"));

  // 2. Line Chart: Tren Kas Masuk Harian (30 Hari)
  const dailyTrendsRaw = await db
    .select({
      date: sql<string>`to_char(${payments.paidAt}, 'YYYY-MM-DD')`,
      totalAmount: sql<number>`sum(${payments.appliedAmount})`,
    })
    .from(payments)
    .where(gte(payments.paidAt, thirtyDaysAgo))
    .groupBy(sql`to_char(${payments.paidAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${payments.paidAt}, 'YYYY-MM-DD')`);

  // 3. Bar Chart Vertikal: Perbandingan Pinjam vs Kembali (30 Hari)
  const loansVsReturnsRaw = await db
    .select({
      date: sql<string>`to_char(${loans.createdAt}, 'YYYY-MM-DD')`,
      borrowedCount: sql<number>`count(*) filter (where ${loans.status} != 'RETURNED')`,
      returnedCount: sql<number>`count(*) filter (where ${loans.status} = 'RETURNED')`,
    })
    .from(loans)
    .where(gte(loans.createdAt, thirtyDaysAgo))
    .groupBy(sql`to_char(${loans.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${loans.createdAt}, 'YYYY-MM-DD')`);

  // 4. Doughnut Chart: Top Category Terlaris (30 Hari)
  const topCategoriesRaw = await db
    .select({
      categoryName: categories.name,
      totalLoans: sql<number>`count(${loans.id})`,
    })
    .from(loans)
    .innerJoin(bookCopies, eq(loans.bookCopyId, bookCopies.id))
    .innerJoin(books, eq(bookCopies.bookId, books.id))
    .innerJoin(categories, eq(books.categoryId, categories.id))
    .where(gte(loans.createdAt, thirtyDaysAgo))
    .groupBy(categories.name)
    .orderBy(sql`count(${loans.id}) desc`)
    .limit(5);

  // 5. Pie Chart: Ruangan/Rak Paling Sering Diambil Bukunya (30 Hari)
  const topRacksRoomsRaw = await db
    .select({
      locationLabel: sql<string>`${rooms.name} || ' - ' || ${racks.name}`,
      totalLoans: sql<number>`count(${loans.id})`,
    })
    .from(loans)
    .innerJoin(bookCopies, eq(loans.bookCopyId, bookCopies.id))
    .innerJoin(racks, eq(bookCopies.rackId, racks.id))
    .innerJoin(rooms, eq(racks.roomId, rooms.id))
    .where(gte(loans.createdAt, thirtyDaysAgo))
    .groupBy(rooms.name, racks.name)
    .orderBy(sql`count(${loans.id}) desc`)
    .limit(5);

  return {
    metrics: {
      totalMembers: Number(totalMembersRes[0]?.count || 0),
      activeLoansCount: Number(activeLoansRes[0]?.count || 0),
      totalCollected30Days: Number(totalPaymentsRes[0]?.totalCollected || 0),
      totalPiutangBerjalan:
        Number(remainingPiutangRes[0]?.activeLoanPiutang || 0) +
        Number(remainingFinesRes[0]?.unpaidFines || 0),
    },
    charts: {
      dailyTrends: dailyTrendsRaw.map((d) => ({
        date: d.date,
        amount: Number(d.totalAmount || 0),
      })),
      loansVsReturns: loansVsReturnsRaw.map((d) => ({
        date: d.date,
        borrowed: Number(d.borrowedCount || 0),
        returned: Number(d.returnedCount || 0),
      })),
      topCategories: topCategoriesRaw.map((c) => ({
        label: c.categoryName,
        value: Number(c.totalLoans || 0),
      })),
      topRacksRooms: topRacksRoomsRaw.map((r) => ({
        label: r.locationLabel,
        value: Number(r.totalLoans || 0),
      })),
    },
  };
}
