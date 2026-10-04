"use client";

import React from "react";
import CountUp from "react-countup";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut, Pie } from "react-chartjs-2";
import {
  Users,
  BookOpen,
  DollarSign,
  CreditCard,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Bookmark,
  MapPin,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

export function DashboardClient({ data }: { data: any }) {
  if (!data) return null;

  const { metrics, charts } = data;

  // 1. Line Chart Data (Garis Trend Kas)
  const lineChartData = {
    labels: charts.dailyTrends.map((d: any) => d.date) || [],
    datasets: [
      {
        fill: true,
        label: "Kas Masuk (Rp)",
        data: charts.dailyTrends.map((d: any) => d.amount) || [],
        borderColor: "rgb(79, 70, 229)",
        backgroundColor: "rgba(79, 70, 229, 0.1)",
        tension: 0.3,
      },
    ],
  };

  // 2. Bar Chart Data (Batang Vertikal Pinjam vs Kembali)
  const barChartData = {
    labels: charts.loansVsReturns.map((d: any) => d.date) || [],
    datasets: [
      {
        label: "Buku Dipinjam",
        data: charts.loansVsReturns.map((d: any) => d.borrowed) || [],
        backgroundColor: "rgba(99, 102, 241, 0.8)",
      },
      {
        label: "Buku Dikembalikan",
        data: charts.loansVsReturns.map((d: any) => d.returned) || [],
        backgroundColor: "rgba(16, 185, 129, 0.8)",
      },
    ],
  };

  // 3. Doughnut Chart Data (Category Terlaris)
  const doughnutData = {
    labels: charts.topCategories.map((c: any) => c.label) || ["Tidak ada data"],
    datasets: [
      {
        data: charts.topCategories.map((c: any) => c.value) || [0],
        backgroundColor: [
          "rgba(79, 70, 229, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(236, 72, 153, 0.8)",
          "rgba(14, 165, 233, 0.8)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // 4. Pie Chart Data (Ruangan/Rak Terlaris)
  const pieData = {
    labels: charts.topRacksRooms.map((r: any) => r.label) || ["Tidak ada data"],
    datasets: [
      {
        data: charts.topRacksRooms.map((r: any) => r.value) || [0],
        backgroundColor: [
          "rgba(14, 165, 233, 0.8)",
          "rgba(168, 85, 247, 0.8)",
          "rgba(244, 63, 94, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(251, 146, 60, 0.8)",
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="w-full space-y-6">
      {/* METRIC CARDS WITH AUTO-COUNT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Anggota Aktif
            </CardTitle>
            <Users className="w-4 h-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">
              <CountUp end={metrics.totalMembers} duration={2} separator="." />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Siswa & Staf terdaftar
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pinjaman Aktif
            </CardTitle>
            <BookOpen className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-600">
              <CountUp
                end={metrics.activeLoansCount}
                duration={2}
                separator="."
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Buku sedang dipinjam</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Kas Masuk (30 Hari)
            </CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-600">
              Rp{" "}
              <CountUp
                end={metrics.totalCollected30Days}
                duration={2.5}
                separator="."
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Penerimaan kasir aktual
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Sisa Piutang Berjalan
            </CardTitle>
            <CreditCard className="w-4 h-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-rose-600">
              Rp{" "}
              <CountUp
                end={metrics.totalPiutangBerjalan}
                duration={2.5}
                separator="."
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Sewa & Denda belum lunas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS GRID (NO TABLES) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CHART 1: LINE CHART (GARIS) */}
        <Card className="lg:col-span-7 border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
              <TrendingUp className="w-4 h-4 text-indigo-600" /> Tren Kas Masuk
              Harian (30 Hari Terakhir)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <Line
              data={lineChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } },
              }}
            />
          </CardContent>
        </Card>

        {/* CHART 2: DOUGHNUT CHART (KATEGORI TERLARIS) */}
        <Card className="lg:col-span-5 border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
              <Bookmark className="w-4 h-4 text-indigo-600" /> Top Kategori Buku
              Terlaris (30 Hari)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[280px] flex items-center justify-center">
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom" } },
              }}
            />
          </CardContent>
        </Card>

        {/* CHART 3: BAR CHART (BATANG VERTIKAL) */}
        <Card className="lg:col-span-7 border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
              <BarChart3 className="w-4 h-4 text-indigo-600" /> Volume Pinjam vs
              Pengembalian Buku
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <Bar
              data={barChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "top" } },
                scales: { y: { beginAtZero: true } },
              }}
            />
          </CardContent>
        </Card>

        {/* CHART 4: PIE CHART (RUANGAN/RAK TERLARIS) */}
        <Card className="lg:col-span-5 border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
              <MapPin className="w-4 h-4 text-indigo-600" /> Ruangan / Rak
              Paling Sering Diambil
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[280px] flex items-center justify-center">
            <Pie
              data={pieData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom" } },
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
