// 1. Load dotenv di baris paling atas sebelum impor modul lain!
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { seedUsers } from "./users";
import { seedMembers } from "./members";

async function runAllSeeds() {
  console.log("🚀 Memulai seluruh proses database seeding...\n");

  try {
    // await seedUsers();
    // console.log("-------------------------------------------");

    await seedMembers();
    console.log("-------------------------------------------");

    console.log("🎉 Semua proses seeding berhasil diselesaikan!");
  } catch (error) {
    console.error("💥 Terjadi kesalahan fatal saat proses seeding:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runAllSeeds();
