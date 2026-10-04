import { z } from "zod";

export const processReturnSchema = z.object({
  loanId: z.string().min(1, "Data peminjaman wajib dipilih"),
  returnCondition: z.enum(["GOOD", "DAMAGED", "LOST"], {
    required_error: "Kondisi pengembalian buku wajib dipilih",
  }),
  paymentMethod: z.enum(["CASH", "QRIS", "TRANSFER"], {
    required_error: "Metode pembayaran wajib dipilih",
  }),
  amountPaid: z.coerce
    .number({ invalid_type_error: "Nominal pembayaran harus berupa angka" })
    .min(0, "Nominal pembayaran tidak boleh kurang dari 0"),
  notes: z.string().optional(),
});

export type ProcessReturnFormValues = z.infer<typeof processReturnSchema>;
