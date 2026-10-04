import { z } from "zod";

export const settingsSchema = z.object({
  loanPricePerDay: z.coerce.number().min(0, "Biaya sewa tidak boleh negatif"),
  maximumLoanDays: z.coerce
    .number()
    .int()
    .min(1, "Maksimal durasi pinjam minimal 1 hari"),
  maximumActiveLoans: z.coerce
    .number()
    .int()
    .min(1, "Maksimal peminjaman minimal 1 buku"),
  dailyFineRate: z.coerce
    .number()
    .min(0, "Denda keterlambatan tidak boleh negatif"),
  damageCompensationRate: z.coerce
    .number()
    .min(0, "Persentase denda tidak boleh negatif")
    .max(100, "Persentase maksimal 100%"),
  lostBookCompensationRate: z.coerce
    .number()
    .min(0, "Persentase denda tidak boleh negatif")
    .max(200, "Persentase maksimal 200%"),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
