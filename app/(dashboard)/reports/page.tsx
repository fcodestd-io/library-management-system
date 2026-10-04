import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReportsClient } from "./report-client";
import { getCombinedReports } from "@/actions/reports";

export const metadata = {
  title: "Laporan Transaksi | Perpustakaan Arunika",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    startDate?: string;
    endDate?: string;
    type?: "ALL" | "LOAN" | "RETURN" | "PAYMENT";
    sortBy?: "createdAt" | "amount" | "memberName";
    sortOrder?: "asc" | "desc";
    page?: string;
  }>;
}) {
  const session = await auth();

  if (!session || !session.user?.id) {
    redirect("/login");
  }

  const resolvedParams = await searchParams;

  const reportData = await getCombinedReports({
    query: resolvedParams.q,
    startDate: resolvedParams.startDate,
    endDate: resolvedParams.endDate,
    type: resolvedParams.type,
    sortBy: resolvedParams.sortBy,
    sortOrder: resolvedParams.sortOrder,
    page: Number(resolvedParams.page) || 1,
    limit: 10,
  });

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Laporan Sektor Transaksi
        </h1>
        <p className="text-sm text-slate-500">
          Ringkasan komprehensif seluruh transaksi peminjaman, pelunasan kasir,
          dan status sisa piutang.
        </p>
      </div>

      <ReportsClient reportData={reportData} searchParams={resolvedParams} />
    </div>
  );
}
