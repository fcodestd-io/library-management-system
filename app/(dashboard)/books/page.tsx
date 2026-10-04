import { getBooks } from "@/actions/books";
import { BookClient } from "./book-client";

export const metadata = { title: "Manajemen Buku | Perpustakaan Arunika" };

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params?.q || "";
  const page = Number(params?.page) || 1;
  const { data, total } = await getBooks(query, page);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Katalog Buku</h1>
        <p className="text-sm text-slate-500">
          Kelola judul buku, nilai buku, dan total eksemplar.
        </p>
      </div>
      <BookClient data={data} total={total} currentPage={page} />
    </div>
  );
}
