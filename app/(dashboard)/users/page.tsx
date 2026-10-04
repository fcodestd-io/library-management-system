import { getUsers } from "@/actions/users";
import { UserClient } from "./user-client";

export const metadata = {
  title: "User Management | Perpustakaan Arunika",
};

export default async function UsersPage({
  searchParams,
}: {
  // Tipe data diubah menjadi Promise menyesuaikan Next.js 15
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  // PERUBAHAN KUNCI: Await searchParams sebelum digunakan
  const params = await searchParams;

  const query = params?.q || "";
  const page = Number(params?.page) || 1;

  const { data, total } = await getUsers(query, page);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manajemen User</h1>
        <p className="text-sm text-slate-500">
          Kelola data Owner dan Petugas perpustakaan.
        </p>
      </div>

      <UserClient data={data} total={total} currentPage={page} />
    </div>
  );
}
