import { z } from "zod";

export const memberSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  memberType: z.enum(["STUDENT", "LECTURER", "STAFF"]),
  countryCode: z.string().min(1, "Kode negara wajib diisi"),
  phoneNumber: z.string().min(6, "Nomor telepon terlalu pendek"),
  isActive: z.boolean().default(true),
});

export type MemberFormValues = z.infer<typeof memberSchema>;
