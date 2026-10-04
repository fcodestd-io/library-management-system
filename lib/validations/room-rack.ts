import { z } from "zod";

export const roomSchema = z.object({
  code: z.string().min(2, "Kode ruangan wajib diisi (minimal 2 karakter)"),
  name: z.string().min(2, "Nama ruangan minimal 2 karakter"),
  isActive: z.boolean().default(true),
});

export type RoomFormValues = z.infer<typeof roomSchema>;

export const rackSchema = z.object({
  code: z.string().min(2, "Kode rak wajib diisi (minimal 2 karakter)"),
  name: z.string().min(2, "Nama rak minimal 2 karakter"),
  isActive: z.boolean().default(true),
});

export type RackFormValues = z.infer<typeof rackSchema>;
