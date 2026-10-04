import { getCategories } from "@/actions/categories";
import { CategoryClient } from "./category-client";

export const metadata = {
  title: "Kategori Buku | Perpustakaan Arunika",
};

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params?.q || "";
  const page = Number(params?.page) || 1;

  const { data, total } = await getCategories(query, page);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Manajemen Kategori
        </h1>
        <p className="text-sm text-slate-500">
          Kelola kategori buku dan pantau statistik peminjaman per kategori.
        </p>
      </div>

      <CategoryClient data={data} total={total} currentPage={page} />
    </div>
  );
}
