import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2, "Nama kategori minimal 2 karakter"),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
