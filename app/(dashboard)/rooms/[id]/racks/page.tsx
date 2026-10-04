import { db } from "@/db";
import { rooms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getRacksByRoomId } from "@/actions/rooms";
import { RackClient } from "./rack-client";

export const metadata = {
  title: "Manajemen Rak | Perpustakaan Arunika",
};

export default async function RoomRacksPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { id } = await params;
  const sParams = await searchParams;

  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, id),
  });

  if (!room) {
    notFound();
  }

  const query = sParams?.q || "";
  const page = Number(sParams?.page) || 1;

  const { data, total } = await getRacksByRoomId(id, query, page);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Daftar Rak: {room.name}
        </h1>
        <p className="text-sm text-slate-500 font-mono">
          Kode Ruangan: {room.code}
        </p>
      </div>

      <RackClient
        roomId={id}
        roomCode={room.code}
        data={data}
        total={total}
        currentPage={page}
      />
    </div>
  );
}
