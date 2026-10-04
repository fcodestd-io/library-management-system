import { z } from "zod";

export const bookRowSchema = z.object({
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  categoryName: z.string().optional(),
  rackId: z.string().min(1, "Rak wajib dipilih"),
  rackCode: z.string().optional(),
  title: z.string().min(2, "Judul buku minimal 2 karakter"),
  isbn: z.string().optional(),
  bookValue: z.coerce.number().min(0, "Nilai buku tidak boleh negatif"),
  totalCopy: z.coerce.number().min(1, "Minimal 1 eksemplar copy"),
});

export const bulkBookSchema = z.object({
  books: z.array(bookRowSchema).min(1, "Minimal tambahkan 1 buku"),
});

export type BulkBookFormValues = z.infer<typeof bulkBookSchema>;

export const singleBookEditSchema = z.object({
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  title: z.string().min(2, "Judul buku minimal 2 karakter"),
  isbn: z.string().optional(),
  bookValue: z.coerce.number().min(0, "Nilai buku tidak boleh negatif"),
  isActive: z.boolean().default(true),
});

export type SingleBookEditFormValues = z.infer<typeof singleBookEditSchema>;

export const bookCopyEditSchema = z.object({
  rackId: z.string().min(1, "Rak wajib dipilih"),
  condition: z.enum(["GOOD", "DAMAGED", "LOST"]),
  status: z.enum(["AVAILABLE", "BORROWED", "INACTIVE"]),
  acquiredAt: z.string().min(1, "Tanggal perolehan wajib diisi"),
});

export type BookCopyEditFormValues = z.infer<typeof bookCopyEditSchema>;
