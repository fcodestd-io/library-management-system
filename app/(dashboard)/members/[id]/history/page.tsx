import { db } from "@/db";
import { members, loans, bookCopies, books } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, History as HistoryIcon } from "lucide-react";

import { MemberButton } from "@/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "./back-button";

export const metadata = {
  title: "Riwayat Peminjaman Member | Perpustakaan Arunika",
};

export default async function MemberHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 1. Ambil data member berdasarkan ID
  const member = await db.query.members.findFirst({
    where: eq(members.id, id),
  });

  if (!member) {
    notFound();
  }

  // 2. Ambil riwayat peminjaman beserta detail buku dan salinannya (copy)
  const loanHistory = await db
    .select({
      id: loans.id,
      borrowedAt: loans.borrowedAt,
      dueAt: loans.dueAt,
      returnedAt: loans.returnedAt,
      status: loans.status,
      returnCondition: loans.returnCondition,
      inventoryNumber: bookCopies.inventoryNumber,
      bookTitle: books.title,
      isbn: books.isbn,
    })
    .from(loans)
    .innerJoin(bookCopies, eq(loans.bookCopyId, bookCopies.id))
    .innerJoin(books, eq(bookCopies.bookId, books.id))
    .where(eq(loans.memberId, id))
    .orderBy(desc(loans.borrowedAt));

  return (
    <div className="space-y-6">
      {/* Tombol Kembali & Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Riwayat Peminjaman
            </h1>
            <p className="text-sm text-slate-500">
              Daftar histori transaksi buku untuk anggota terpilih.
            </p>
          </div>
        </div>
      </div>

      {/* Informasi Singkat Member */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <HistoryIcon className="w-4 h-4 text-indigo-600" /> Profil Anggota
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-slate-500 block text-xs">Nama Lengkap</span>
            <span className="font-semibold text-slate-900">{member.name}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs">Member Code</span>
            <span className="font-mono font-medium text-slate-800">
              {member.memberCode}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs">
              Tipe / Kategori
            </span>
            <span className="inline-flex px-2 py-0.5 mt-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
              {member.memberType}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs">Status Akun</span>
            <span
              className={`inline-flex px-2 py-0.5 mt-0.5 rounded text-xs font-medium ${member.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
            >
              {member.status}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Riwayat Peminjaman */}
      <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Judul Buku</TableHead>
              <TableHead>No. Inventaris</TableHead>
              <TableHead>Tanggal Pinjam</TableHead>
              <TableHead>Jatuh Tempo</TableHead>
              <TableHead>Tanggal Kembali</TableHead>
              <TableHead className="text-center">Kondisi Kembali</TableHead>
              <TableHead className="text-center">Status Peminjaman</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loanHistory.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-slate-500"
                >
                  Anggota ini belum pernah melakukan peminjaman buku.
                </TableCell>
              </TableRow>
            ) : (
              loanHistory.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell>
                    <div className="font-medium text-slate-900">
                      {loan.bookTitle}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      ISBN: {loan.isbn || "-"}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-medium">
                    {loan.inventoryNumber}
                  </TableCell>
                  <TableCell className="text-xs">
                    {new Date(loan.borrowedAt).toLocaleDateString("id-ID", {
                      dateStyle: "medium",
                    })}
                  </TableCell>
                  <TableCell className="text-xs">
                    {new Date(loan.dueAt).toLocaleDateString("id-ID", {
                      dateStyle: "medium",
                    })}
                  </TableCell>
                  <TableCell className="text-xs">
                    {loan.returnedAt
                      ? new Date(loan.returnedAt).toLocaleDateString("id-ID", {
                          dateStyle: "medium",
                        })
                      : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {loan.returnCondition ? (
                      <span
                        className={`px-2 py-0.5 text-[11px] rounded font-medium ${loan.returnCondition === "GOOD" ? "bg-blue-50 text-blue-700" : loan.returnCondition === "DAMAGED" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}
                      >
                        {loan.returnCondition}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`px-2 py-1 text-xs rounded-md font-medium ${loan.status === "RETURNED" ? "bg-emerald-100 text-emerald-700" : loan.status === "OVERDUE" ? "bg-rose-100 text-rose-700" : "bg-indigo-100 text-indigo-700"}`}
                    >
                      {loan.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
