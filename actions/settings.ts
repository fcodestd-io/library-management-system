"use server";

import { db } from "@/db";
import { librarySettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { SettingsFormValues } from "@/lib/validations/setting";

export async function getSettings() {
  try {
    let settings = await db.query.librarySettings.findFirst();

    // Jika belum ada data konfigurasi sama sekali, buat baris default
    if (!settings) {
      const [newSettings] = await db
        .insert(librarySettings)
        .values({
          loanPricePerDay: "2000.00",
          maximumLoanDays: 7,
          maximumActiveLoans: 3,
          dailyFineRate: "1000.00",
          damageCompensationRate: "50.00", // 50% dari harga buku
          lostBookCompensationRate: "100.00", // 100% dari harga buku
        })
        .returning();

      settings = newSettings;
    }

    return { data: settings };
  } catch (error) {
    return { error: "Gagal memuat konfigurasi perpustakaan." };
  }
}

export async function updateSettings(id: string, values: SettingsFormValues) {
  try {
    await db
      .update(librarySettings)
      .set({
        loanPricePerDay: values.loanPricePerDay.toString(),
        maximumLoanDays: values.maximumLoanDays,
        maximumActiveLoans: values.maximumActiveLoans,
        dailyFineRate: values.dailyFineRate.toString(),
        damageCompensationRate: values.damageCompensationRate.toString(),
        lostBookCompensationRate: values.lostBookCompensationRate.toString(),
        updatedAt: new Date(),
      })
      .where(eq(librarySettings.id, id));

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return { error: "Gagal memperbarui konfigurasi perpustakaan." };
  }
}
