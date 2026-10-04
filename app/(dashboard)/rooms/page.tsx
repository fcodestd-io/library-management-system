import { getRooms } from "@/actions/rooms";
import { RoomClient } from "./room-client";

export const metadata = {
  title: "Manajemen Ruangan | Perpustakaan Arunika",
};

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params?.q || "";
  const page = Number(params?.page) || 1;

  const { data, total } = await getRooms(query, page);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Direktori Ruangan</h1>
        <p className="text-sm text-slate-500">
          Kelola daftar ruangan penyimpanan rak buku di perpustakaan.
        </p>
      </div>

      <RoomClient data={data} total={total} currentPage={page} />
    </div>
  );
}
