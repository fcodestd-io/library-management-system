"use server";

import { db } from "@/db";
import { rooms, racks, bookCopies } from "@/db/schema";
import { eq, ilike, or, desc, sql, and, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { RoomFormValues, RackFormValues } from "@/lib/validations/room-rack";

// ==========================================
// ROOMS ACTIONS
// ==========================================

export async function getRooms(query: string, page: number, limit = 5) {
  const offset = (page - 1) * limit;
  const searchCondition = query
    ? or(ilike(rooms.name, `%${query}%`), ilike(rooms.code, `%${query}%`))
    : undefined;

  const data = await db
    .select({
      id: rooms.id,
      code: rooms.code,
      name: rooms.name,
      status: rooms.status,
      totalRacks: sql<number>`count(DISTINCT ${racks.id})`.mapWith(Number),
      totalBooks: sql<number>`count(DISTINCT ${bookCopies.id})`.mapWith(Number),
    })
    .from(rooms)
    .leftJoin(racks, eq(rooms.id, racks.roomId))
    .leftJoin(bookCopies, eq(racks.id, bookCopies.rackId))
    .where(searchCondition)
    .groupBy(rooms.id)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(rooms.createdAt));

  const totalQuery = await db
    .select({ count: sql<number>`count(*)` })
    .from(rooms)
    .where(searchCondition);

  return { data, total: Number(totalQuery[0].count) };
}

export async function createRoom(values: RoomFormValues) {
  try {
    const formattedCode = values.code.trim().toUpperCase();

    // Cek apakah kode ruangan sudah terpakai
    const existingCode = await db.query.rooms.findFirst({
      where: eq(rooms.code, formattedCode),
    });

    if (existingCode) {
      return {
        error: `Kode ruangan "${formattedCode}" sudah digunakan. Gunakan kode lain.`,
      };
    }

    await db.insert(rooms).values({
      code: formattedCode,
      name: values.name.trim(),
      status: values.isActive ? "ACTIVE" : "INACTIVE",
    });

    revalidatePath("/rooms");
    return { success: true };
  } catch (error) {
    return { error: "Gagal menambahkan ruangan." };
  }
}

export async function updateRoom(id: string, values: RoomFormValues) {
  try {
    const formattedCode = values.code.trim().toUpperCase();

    // Cek keunikan kode dengan mengabaikan ID diri sendiri
    const existingCode = await db.query.rooms.findFirst({
      where: and(eq(rooms.code, formattedCode), ne(rooms.id, id)),
    });

    if (existingCode) {
      return {
        error: `Kode ruangan "${formattedCode}" sudah digunakan oleh ruangan lain.`,
      };
    }

    await db
      .update(rooms)
      .set({
        code: formattedCode,
        name: values.name.trim(),
        status: values.isActive ? "ACTIVE" : "INACTIVE",
        updatedAt: new Date(),
      })
      .where(eq(rooms.id, id));

    revalidatePath("/rooms");
    return { success: true };
  } catch (error) {
    return { error: "Gagal memperbarui ruangan." };
  }
}

export async function deleteRoom(id: string) {
  try {
    const rackCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(racks)
      .where(eq(racks.roomId, id));

    if (Number(rackCount[0].count) > 0) {
      await db
        .update(rooms)
        .set({ status: "INACTIVE" })
        .where(eq(rooms.id, id));
      revalidatePath("/rooms");
      return {
        success: true,
        message: "Ruangan dinonaktifkan karena memiliki rak di dalamnya.",
      };
    }

    await db.delete(rooms).where(eq(rooms.id, id));
    revalidatePath("/rooms");
    return { success: true, message: "Ruangan berhasil dihapus." };
  } catch (error) {
    return { error: "Gagal menghapus ruangan." };
  }
}

// ==========================================
// RACKS ACTIONS
// ==========================================

export async function getRacksByRoomId(
  roomId: string,
  query: string,
  page: number,
  limit = 5,
) {
  const offset = (page - 1) * limit;
  const searchCondition = query
    ? sql`${racks.roomId} = ${roomId} AND (${ilike(racks.name, `%${query}%`)} OR ${ilike(racks.code, `%${query}%`)})`
    : eq(racks.roomId, roomId);

  const data = await db
    .select({
      id: racks.id,
      roomId: racks.roomId,
      code: racks.code,
      name: racks.name,
      status: racks.status,
      totalBooks: sql<number>`count(DISTINCT ${bookCopies.id})`.mapWith(Number),
    })
    .from(racks)
    .leftJoin(bookCopies, eq(racks.id, bookCopies.rackId))
    .where(searchCondition)
    .groupBy(racks.id)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(racks.createdAt));

  const totalQuery = await db
    .select({ count: sql<number>`count(*)` })
    .from(racks)
    .where(eq(racks.roomId, roomId));

  return { data, total: Number(totalQuery[0].count) };
}

export async function createRack(roomId: string, values: RackFormValues) {
  try {
    const formattedCode = values.code.trim().toUpperCase();

    // Cek apakah kode rak sudah terpakai di sistem
    const existingCode = await db.query.racks.findFirst({
      where: eq(racks.code, formattedCode),
    });

    if (existingCode) {
      return {
        error: `Kode rak "${formattedCode}" sudah digunakan. Gunakan kode lain.`,
      };
    }

    await db.insert(racks).values({
      roomId,
      code: formattedCode,
      name: values.name.trim(),
      status: values.isActive ? "ACTIVE" : "INACTIVE",
    });

    revalidatePath(`/rooms/${roomId}/racks`);
    return { success: true };
  } catch (error) {
    return { error: "Gagal menambahkan rak." };
  }
}

export async function updateRack(
  roomId: string,
  rackId: string,
  values: RackFormValues,
) {
  try {
    const formattedCode = values.code.trim().toUpperCase();

    // Cek keunikan kode dengan mengabaikan ID diri sendiri
    const existingCode = await db.query.racks.findFirst({
      where: and(eq(racks.code, formattedCode), ne(racks.id, rackId)),
    });

    if (existingCode) {
      return {
        error: `Kode rak "${formattedCode}" sudah digunakan oleh rak lain.`,
      };
    }

    await db
      .update(racks)
      .set({
        code: formattedCode,
        name: values.name.trim(),
        status: values.isActive ? "ACTIVE" : "INACTIVE",
        updatedAt: new Date(),
      })
      .where(eq(racks.id, rackId));

    revalidatePath(`/rooms/${roomId}/racks`);
    return { success: true };
  } catch (error) {
    return { error: "Gagal memperbarui rak." };
  }
}

export async function deleteRack(roomId: string, rackId: string) {
  try {
    const bookCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookCopies)
      .where(eq(bookCopies.rackId, rackId));

    if (Number(bookCount[0].count) > 0) {
      await db
        .update(racks)
        .set({ status: "INACTIVE" })
        .where(eq(racks.id, rackId));
      revalidatePath(`/rooms/${roomId}/racks`);
      return {
        success: true,
        message: "Rak dinonaktifkan karena masih menyimpan salinan buku.",
      };
    }

    await db.delete(racks).where(eq(racks.id, rackId));
    revalidatePath(`/rooms/${roomId}/racks`);
    return { success: true, message: "Rak berhasil dihapus permanen." };
  } catch (error) {
    return { error: "Gagal menghapus rak." };
  }
}
