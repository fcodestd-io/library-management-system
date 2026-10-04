import { z } from "zod";

export const createLoanSchema = z.object({
  memberId: z.string().min(1, "Anggota wajib dipilih"),
  bookId: z.string().min(1, "Buku wajib dipilih"),
  loanDays: z.coerce
    .number({ invalid_type_error: "Durasi hari harus berupa angka" })
    .int("Durasi harus berupa angka bulat")
    .min(1, "Minimal durasi peminjaman adalah 1 hari")
    .max(7, "Maksimal durasi peminjaman adalah 7 hari"),
});

export type CreateLoanFormValues = z.infer<typeof createLoanSchema>;
