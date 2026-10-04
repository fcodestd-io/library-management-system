"use server";

import { db } from "@/db";
import { members, loans, fines } from "@/db/schema";
import { eq, ilike, or, desc, sql, and, inArray, gt } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getMembers(query: string, page: number, limit = 5) {
  const offset = (page - 1) * limit;
  const searchCondition = query
    ? or(
        ilike(members.name, `%${query}%`),
        ilike(members.memberCode, `%${query}%`),
      )
    : undefined;

  const memberList = await db
    .select({
      id: members.id,
      memberCode: members.memberCode,
      name: members.name,
      phone: members.phone,
      memberType: members.memberType,
      status: members.status,
      createdAt: members.createdAt,
      totalLoans: sql<number>`count(distinct ${loans.id})`.mapWith(Number),
    })
    .from(members)
    .leftJoin(loans, eq(members.id, loans.memberId))
    .where(searchCondition)
    .groupBy(members.id)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(members.createdAt));

  const data = await Promise.all(
    memberList.map(async (m) => {
      // A. Hitung Sisa Piutang Sewa Peminjaman (loans.remainingAmount)
      const activeLoansFee = await db
        .select({
          totalActiveFee:
            sql<number>`coalesce(sum(${loans.remainingAmount}), 0)`.mapWith(
              Number,
            ),
        })
        .from(loans)
        .where(and(eq(loans.memberId, m.id), gt(loans.remainingAmount, "0")));

      // B. Hitung Sisa Denda yang Belum Lunas (fines.remainingAmount)
      const unpaidFines = await db
        .select({
          totalUnpaidFine:
            sql<number>`coalesce(sum(${fines.remainingAmount}), 0)`.mapWith(
              Number,
            ),
        })
        .from(fines)
        .innerJoin(loans, eq(fines.loanId, loans.id))
        .where(and(eq(loans.memberId, m.id), gt(fines.remainingAmount, "0")));

      const activeLoanDebt = activeLoansFee[0]?.totalActiveFee || 0;
      const unpaidFineDebt = unpaidFines[0]?.totalUnpaidFine || 0;

      return {
        ...m,
        remainingDebt: activeLoanDebt + unpaidFineDebt,
      };
    }),
  );

  const totalQuery = await db
    .select({ count: sql<number>`count(*)` })
    .from(members)
    .where(searchCondition);

  return { data, total: Number(totalQuery[0].count) };
}

export async function createMember(data: any, generatedMemberCode: string) {
  try {
    await db.insert(members).values({
      memberCode: generatedMemberCode,
      name: data.name,
      phone: data.phone,
      memberType: data.memberType,
      status: data.isActive ? "ACTIVE" : "INACTIVE",
      registeredAt: new Date().toISOString().split("T")[0],
    });

    revalidatePath("/members");
    return { success: true };
  } catch (error) {
    return { error: "Gagal menambahkan member." };
  }
}

export async function updateMember(
  id: string,
  data: any,
  generatedMemberCode: string,
) {
  try {
    await db
      .update(members)
      .set({
        memberCode: generatedMemberCode,
        name: data.name,
        phone: data.phone,
        memberType: data.memberType,
        status: data.isActive ? "ACTIVE" : "INACTIVE",
        updatedAt: new Date(),
      })
      .where(eq(members.id, id));

    revalidatePath("/members");
    return { success: true };
  } catch (error) {
    return { error: "Gagal mengupdate member." };
  }
}

export async function deleteMember(id: string) {
  try {
    const loanCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(loans)
      .where(eq(loans.memberId, id));

    const hasHistory = Number(loanCount[0].count) > 0;

    if (hasHistory) {
      await db
        .update(members)
        .set({ status: "INACTIVE" })
        .where(eq(members.id, id));
      revalidatePath("/members");
      return {
        success: true,
        message: "Member dinonaktifkan karena memiliki riwayat peminjaman.",
      };
    } else {
      await db.delete(members).where(eq(members.id, id));
      revalidatePath("/members");
      return { success: true, message: "Member dihapus permanen dari sistem." };
    }
  } catch (error) {
    return { error: "Gagal memproses penghapusan member." };
  }
}
