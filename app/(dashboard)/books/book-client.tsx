"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Search, Plus, Edit, Trash2, Loader2, Copy } from "lucide-react";

import { Button } from "@/components/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { AsyncCombobox } from "@/components/async-combobox";

import {
  singleBookEditSchema,
  SingleBookEditFormValues,
} from "@/lib/validations/book";
import {
  updateSingleBook,
  deleteBook,
  searchCategories,
} from "@/actions/books";
import { cn } from "@/lib/utils";

export function BookClient({
  data,
  total,
  currentPage,
}: {
  data: any[];
  total: number;
  currentPage: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [debouncedSearch] = useDebounce(searchTerm, 500);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const limit = 5;
  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    const currentQ = searchParams.get("q") || "";
    if (debouncedSearch === currentQ) return;
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) {
      params.set("q", debouncedSearch);
      params.set("page", "1");
    } else {
      params.delete("q");
    }
    startTransition(() => {
      router.push(`/books?${params.toString()}`, { scroll: false });
    });
  }, [debouncedSearch, searchParams, router]);

  const form = useForm<SingleBookEditFormValues>({
    resolver: zodResolver(singleBookEditSchema),
    defaultValues: {
      categoryId: "",
      title: "",
      isbn: "",
      bookValue: 0,
      isActive: true,
    },
  });

  const [selectedCatLabel, setSelectedCatLabel] = useState("");

  const handleOpenEdit = (book: any) => {
    setSelectedBook(book);
    setSelectedCatLabel(book.categoryName);
    form.reset({
      categoryId: book.categoryId,
      title: book.title,
      isbn: book.isbn || "",
      bookValue: Number(book.bookValue),
      isActive: book.status === "ACTIVE",
    });
    setIsEditOpen(true);
  };

  const onSubmitEdit = async (values: SingleBookEditFormValues) => {
    if (!selectedBook) return;
    setIsLoading(true);
    const res = await updateSingleBook(selectedBook.id, values);
    setIsLoading(false);

    if (res.error) toast.error(res.error);
    else {
      toast.success("Data buku berhasil diperbarui.");
      setIsEditOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBook) return;
    setIsLoading(true);
    const res = await deleteBook(selectedBook.id);
    setIsLoading(false);

    if (res.error) toast.error(res.error);
    else toast.success(res.message);

    setIsDeleteOpen(false);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    startTransition(() => {
      router.push(`/books?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full max-w-sm flex items-center">
          <Search className="absolute left-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Cari judul, ISBN, kategori..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {isPending && (
            <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-indigo-500" />
          )}
        </div>

        {/* Tombol ke Halaman Multi Insert */}
        <Button onClick={() => router.push("/books/create")} className="gap-2">
          <Plus className="w-4 h-4" /> Tambah Koleksi Buku
        </Button>
      </div>

      <div
        className={cn(
          "border rounded-lg bg-white overflow-hidden transition-opacity",
          isPending && "opacity-50 pointer-events-none",
        )}
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Buku, ISBN & Kategori</TableHead>
              <TableHead className="text-right">Nilai Buku (Rp)</TableHead>
              <TableHead className="text-center">Total Copy</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-6 text-slate-500"
                >
                  Tidak ada buku ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              data.map((book) => (
                <TableRow key={book.id}>
                  {/* Judul + ISBN + Category dalam 1 Kolom */}
                  <TableCell>
                    <div className="font-semibold text-slate-900">
                      {book.title}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs">
                      <span className="font-mono text-slate-500">
                        ISBN: {book.isbn || "-"}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                        {book.categoryName}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-right font-medium tabular-nums">
                    Rp {Number(book.bookValue).toLocaleString("id-ID")}
                  </TableCell>

                  <TableCell className="text-center font-semibold">
                    {book.totalCopies} eksemplar
                  </TableCell>

                  <TableCell className="text-center">
                    <span
                      className={cn(
                        "px-2 py-1 text-xs rounded-md font-medium",
                        book.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700",
                      )}
                    >
                      {book.status}
                    </span>
                  </TableCell>

                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => {
                        startTransition(() => {
                          router.push(`/books/${book.id}/copies`);
                        });
                      }}
                      title="Lihat Copies"
                      className="gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" /> Lihat Copies
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleOpenEdit(book)}
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        setSelectedBook(book);
                        setIsDeleteOpen(true);
                      }}
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-end items-center gap-4 text-sm pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1 || isPending}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Sebelumnya
          </Button>
          <span className="font-medium text-slate-600">
            Halaman {currentPage} dari {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages || isPending}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Selanjutnya
          </Button>
        </div>
      )}

      {/* Edit Dialog Buku Satuan */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Buku Satuan</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmitEdit)}
              className="space-y-4"
            >
              <FormItem>
                <FormLabel>
                  Kategori Buku <span className="text-red-500">*</span>
                </FormLabel>
                <AsyncCombobox
                  placeholder="Cari kategori (min 2 huruf)..."
                  value={form.watch("categoryId")}
                  displayValue={selectedCatLabel}
                  onSelect={(opt) => {
                    form.setValue("categoryId", opt.id);
                    setSelectedCatLabel(opt.label);
                  }}
                  fetcher={async (q) => {
                    const res = await searchCategories(q);
                    return res.map((c) => ({ id: c.id, label: c.name }));
                  }}
                />
              </FormItem>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Judul Buku <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isbn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ISBN</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isLoading}
                        className="font-mono"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bookValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Harga / Nilai Buku (Rp){" "}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="number" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <FormLabel>Status Buku</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Memproses..." : "Simpan"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Buku?</AlertDialogTitle>
            <AlertDialogDescription>
              Menghapus buku <b>{selectedBook?.title}</b> juga akan menghapus
              seluruh salinan (copies) di perpustakaan secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              disabled={isLoading}
              onClick={() => setIsDeleteOpen(false)}
            >
              Batal
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? "Memproses..." : "Ya, Hapus"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
