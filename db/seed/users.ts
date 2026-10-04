import { db } from "@/db";
import { users } from "@/db/schema";
import bcrypt from "bcryptjs";

export async function seedUsers() {
  console.log("⏳ Memulai proses seeding users...");

  try {
    const defaultPassword = "password123";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const initialUsers = [
      {
        name: "Owner Arunika",
        email: "owner@arunika.com",
        passwordHash,
        role: "OWNER" as const,
        status: "ACTIVE" as const,
      },
      {
        name: "Petugas Satu",
        email: "petugas1@arunika.com",
        passwordHash,
        role: "STAFF" as const,
        status: "ACTIVE" as const,
      },
      {
        name: "Petugas Dua",
        email: "petugas2@arunika.com",
        passwordHash,
        role: "STAFF" as const,
        status: "ACTIVE" as const,
      },
    ];

    console.log("Menyimpan data users ke database...");
    await db.insert(users).values(initialUsers);

    console.log("✅ Seeding users berhasil!");
    console.log("-------------------------------------------");
    console.log("Akun login yang tersedia:");
    console.log("1. owner@arunika.com (OWNER)");
    console.log("2. petugas1@arunika.com (STAFF)");
    console.log("3. petugas2@arunika.com (STAFF)");
    console.log(`Password untuk semuanya: ${defaultPassword}`);
    console.log("-------------------------------------------");
  } catch (error) {
    console.error("❌ Gagal melakukan seeding users:", error);
    throw error;
  }
}
