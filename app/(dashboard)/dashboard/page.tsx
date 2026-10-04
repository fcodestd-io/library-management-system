import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDashboardData } from "@/actions/dashboard";
import { DashboardClient } from "./dashboard-client";

export const metadata = {
  title: "Dashboard Utama | Perpustakaan Arunika",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session || !session.user?.id) {
    redirect("/login");
  }

  const dashboardData = await getDashboardData();

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Selamat Datang, {session.user.name || "Petugas"}
        </h1>
        <p className="text-sm text-slate-500">
          Ringkasan analitik kas, kategori terlaris, serta ruangan/rak favorit
          dalam 30 hari terakhir.
        </p>
      </div>

      <DashboardClient data={dashboardData} />
    </div>
  );
}
