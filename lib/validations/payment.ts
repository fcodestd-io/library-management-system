import { z } from "zod";

export const createPaymentSchema = z.object({
  memberId: z.string().min(1, "Anggota wajib dipilih"),
  loanId: z.string().optional(),
  fineId: z.string().optional(),
  paymentType: z.enum(["LOAN_FEE", "FINE_PAYMENT"]),
  paymentMethod: z.enum(["CASH", "QRIS", "TRANSFER"], {
    required_error: "Metode pembayaran wajib dipilih",
  }),
  amountPaid: z.coerce
    .number({ invalid_type_error: "Nominal pembayaran harus berupa angka" })
    .min(1, "Nominal pembayaran harus lebih dari 0"),
});

export type CreatePaymentFormValues = z.infer<typeof createPaymentSchema>;
