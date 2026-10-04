import { db } from "@/db";
import { categories, books, bookCopies, loans } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { BookOpen } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "./back-button"; // Impor komponen back button interaktif

export const metadata = {
  title: "Daftar Buku Kategori | Perpustakaan Arunika",
};

export default async function CategoryBooksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const category = await db.query.categories.findFirst({
    where: eq(categories.id, id),
  });

  if (!category) {
    notFound();
  }

  const bookList = await db
    .select({
      id: books.id,
      title: books.title,
      isbn: books.isbn,
      bookValue: books.bookValue,
      status: books.status,
      totalCopies: sql<number>`count(DISTINCT ${bookCopies.id})`.mapWith(
        Number,
      ),
      totalLoaned: sql<number>`count(DISTINCT ${loans.id})`.mapWith(Number),
    })
    .from(books)
    .leftJoin(bookCopies, eq(books.id, bookCopies.bookId))
    .leftJoin(
      loans,
      sql`${bookCopies.id} = ${loans.bookCopyId} AND ${loans.status} = 'BORROWED'`,
    )
    .where(eq(books.categoryId, id))
    .groupBy(books.id)
    .orderBy(desc(books.createdAt));

  return (
    <div className="space-y-6">
      {/* Header & Tombol Kembali dengan Suspense Loading */}
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Kategori: {category.name}
          </h1>
          <p className="text-sm text-slate-500">
            Daftar buku yang terdaftar di bawah kategori ini.
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" /> Ringkasan Kategori
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <span className="text-slate-500">Total Judul Buku: </span>
          <span className="font-semibold text-slate-900">
            {bookList.length} judul
          </span>
        </CardContent>
      </Card>

      {/* Tabel Buku */}
      <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Judul Buku</TableHead>
              <TableHead>ISBN</TableHead>
              <TableHead>Nilai Buku (Rp)</TableHead>
              <TableHead className="text-center">
                Total Salinan (Copy)
              </TableHead>
              <TableHead className="text-center">Sedang Dipinjam</TableHead>
              <TableHead className="text-center">Status Buku</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookList.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-slate-500"
                >
                  Belum ada buku yang terdaftar dalam kategori ini.
                </TableCell>
              </TableRow>
            ) : (
              bookList.map((book) => (
                <TableRow key={book.id}>
                  <TableCell className="font-medium text-slate-900">
                    {book.title}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {book.isbn || "-"}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    Rp {Number(book.bookValue).toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    {book.totalCopies}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700">
                      {book.totalLoaned} salinan
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`px-2 py-1 text-xs rounded-md font-medium ${book.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                    >
                      {book.status}
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
