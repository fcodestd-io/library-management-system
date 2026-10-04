"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Search,
  Filter,
  ArrowUpDown,
  DollarSign,
  CreditCard,
  BookOpen,
  Loader2,
  Clock,
  AlertTriangle,
  BookX,
} from "lucide-react";

import { Button } from "@/components/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function ReportsClient({
  reportData,
  searchParams,
}: {
  reportData: any;
  searchParams: any;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.q || "");
  const [type, setType] = useState(searchParams.type || "ALL");
  const [startDate, setStartDate] = useState(searchParams.startDate || "");
  const [endDate, setEndDate] = useState(searchParams.endDate || "");
  const [sortBy, setSortBy] = useState(searchParams.sortBy || "createdAt");
  const [sortOrder, setSortOrder] = useState(searchParams.sortOrder || "desc");

  const handleApplyFilter = () => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (type !== "ALL") params.set("type", type);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (sortBy) params.set("sortBy", sortBy);
    if (sortOrder) params.set("sortOrder", sortOrder);
    params.set("page", "1");

    startTransition(() => {
      router.push(`/reports?${params.toString()}`, { scroll: false });
    });
  };

  const handleResetFilter = () => {
    setSearch("");
    setType("ALL");
    setStartDate("");
    setEndDate("");
    setSortBy("createdAt");
    setSortOrder("desc");

    startTransition(() => {
      router.push("/reports");
    });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    startTransition(() => {
      router.push(`/reports?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. Cards Ringkasan Statistik Laporan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Transaksi
            </CardTitle>
            <FileText className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900">
              {reportData.summary.totalTransactions}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Record aktivitas terekam
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Nilai Sewa Peminjaman
            </CardTitle>
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-indigo-600">
              Rp{" "}
              {reportData.summary.totalLoanFeeRevenue.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Total tagihan sewa peminjaman
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Uang Masuk
            </CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-emerald-600">
              Rp{" "}
              {reportData.summary.totalCollectedPayments.toLocaleString(
                "id-ID",
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Bersih setelah kembalian (Sewa & Denda)
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
            <div className="text-2xl font-extrabold text-rose-600">
              Rp {reportData.summary.totalUnpaidPiutang.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Piutang yang belum dilunasi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 1b. Cards Ringkasan Denda */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Denda Keterlambatan
            </CardTitle>
            <Clock className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-amber-600">
              Rp {reportData.summary.totalFineOverdue.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Total denda terlambat mengembalikan
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Denda Buku Rusak
            </CardTitle>
            <AlertTriangle className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-orange-600">
              Rp {reportData.summary.totalFineDamage.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Total denda kerusakan buku
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Denda Buku Hilang
            </CardTitle>
            <BookX className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-red-600">
              Rp {reportData.summary.totalFineLost.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Total denda kehilangan buku
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Panel Filter & Pengurutan */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600" /> Filter & Pengurutan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3">
            {/* Live Search */}
            <div className="lg:col-span-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari Member / Buku / Kode..."
                  className="pl-8 text-xs"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Tipe Transaksi */}
            <div className="lg:col-span-2">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Tipe Transaksi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Transaksi</SelectItem>
                  <SelectItem value="LOAN">Peminjaman Buku</SelectItem>
                  <SelectItem value="PAYMENT">Pembayaran Kasir</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tanggal Mulai */}
            <div className="lg:col-span-2">
              <Input
                type="date"
                className="text-xs"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* Tanggal Selesai */}
            <div className="lg:col-span-2">
              <Input
                type="date"
                className="text-xs"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Urutan Sort */}
            <div className="lg:col-span-3 flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Urut Berdasarkan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Tanggal Transaksi</SelectItem>
                  <SelectItem value="amount">Nominal / Tagihan</SelectItem>
                  <SelectItem value="memberName">Nama Member</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                title={`Urutan: ${sortOrder.toUpperCase()}`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilter}
              className="text-xs"
            >
              Reset Filter
            </Button>
            <Button
              size="sm"
              onClick={handleApplyFilter}
              disabled={isPending}
              className="gap-2 text-xs bg-indigo-600 hover:bg-indigo-700"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Terapkan Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 3. Tabel Display Data Transaksi */}
      <div className="space-y-4">
        <div className="flex justify-between items-center text-xs text-slate-500">
          <span>
            Menampilkan <b>{reportData.data.length}</b> dari{" "}
            <b>{reportData.total}</b> transaksi.
          </span>
        </div>

        <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[100px]">Kode / ID</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Detail / Buku</TableHead>
                <TableHead className="text-right">Uang Diterima</TableHead>
                <TableHead className="text-right">Sisa Piutang</TableHead>
                <TableHead className="text-center">Petugas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-xs text-slate-400"
                  >
                    Tidak ada transaksi ditemukan untuk filter ini.
                  </TableCell>
                </TableRow>
              ) : (
                reportData.data.map((item: any) => (
                  <TableRow key={`${item.type}-${item.id}`}>
                    <TableCell className="font-mono text-xs font-bold text-slate-800">
                      {item.code}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {new Date(item.date).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[11px] font-bold uppercase",
                          item.category === "PEMINJAMAN" &&
                            "bg-indigo-100 text-indigo-700",
                          item.category === "BAYAR SEWA" &&
                            "bg-emerald-100 text-emerald-700",
                          item.category === "BAYAR DENDA" &&
                            "bg-amber-100 text-amber-700",
                        )}
                      >
                        {item.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-semibold text-slate-900">
                        {item.memberName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {item.memberCode}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-700 truncate max-w-[180px]">
                      {item.bookTitle}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-emerald-700 font-bold">
                      Rp {item.receivedNum.toLocaleString("id-ID")}
                      {item.changeNum > 0 && (
                        <div className="text-[10px] font-normal text-slate-500">
                          Kembalian Rp {item.changeNum.toLocaleString("id-ID")}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-rose-600 font-bold">
                      Rp {item.remainingNum.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-center text-xs text-slate-500">
                      {item.processedByName}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {reportData.totalPages > 1 && (
          <div className="flex justify-end items-center gap-4 text-xs pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={reportData.page === 1 || isPending}
              onClick={() => handlePageChange(reportData.page - 1)}
            >
              Sebelumnya
            </Button>
            <span className="font-medium text-slate-600">
              Halaman {reportData.page} dari {reportData.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={reportData.page === reportData.totalPages || isPending}
              onClick={() => handlePageChange(reportData.page + 1)}
            >
              Selanjutnya
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
