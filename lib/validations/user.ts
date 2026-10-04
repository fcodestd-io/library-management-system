import { z } from "zod";

export const userSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const userUpdateSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().optional().or(z.literal("")),
});

export type UserFormValues = z.infer<typeof userSchema>;
export type UserUpdateFormValues = z.infer<typeof userUpdateSchema>;
