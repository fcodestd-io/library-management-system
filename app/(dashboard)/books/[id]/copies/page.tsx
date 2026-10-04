import { db } from "@/db";
import { books } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getCopiesByBookId } from "@/actions/books";
import { CopyClient } from "./copy-client";

export const metadata = {
  title: "Daftar Eksemplar Copy | Perpustakaan Arunika",
};

export default async function BookCopiesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = await db.query.books.findFirst({ where: eq(books.id, id) });
  if (!book) notFound();

  const copies = await getCopiesByBookId(id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Salinan Buku: {book.title}
        </h1>
        <p className="text-sm text-slate-500 font-mono">
          ISBN: {book.isbn || "-"}
        </p>
      </div>
      <CopyClient bookId={id} copies={copies} />
    </div>
  );
}
