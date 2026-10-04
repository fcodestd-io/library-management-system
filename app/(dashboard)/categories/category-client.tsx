"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useDebounce } from "use-debounce";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Search, Plus, Edit, Trash2, Loader2, BookOpen } from "lucide-react";

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
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { categorySchema, CategoryFormValues } from "@/lib/validations/category";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/actions/categories";
import { cn } from "@/lib/utils";

export function CategoryClient({
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

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
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
      router.push(`/categories?${params.toString()}`, { scroll: false });
    });
  }, [debouncedSearch, searchParams, router]);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "" },
  });

  const handleOpenForm = (cat?: any) => {
    if (cat) {
      setSelectedCategory(cat);
      form.reset({ name: cat.name });
    } else {
      setSelectedCategory(null);
      form.reset({ name: "" });
    }
    setIsFormOpen(true);
  };

  const onSubmit = async (values: CategoryFormValues) => {
    setIsLoading(true);
    const res = selectedCategory
      ? await updateCategory(selectedCategory.id, values)
      : await createCategory(values);

    setIsLoading(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success(
        `Kategori berhasil ${selectedCategory ? "diperbarui" : "ditambahkan"}.`,
      );
      setIsFormOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    setIsLoading(true);
    const res = await deleteCategory(selectedCategory.id);
    setIsLoading(false);

    if (res.error) toast.error(res.error);
    else toast.success(res.message);

    setIsDeleteOpen(false);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    startTransition(() => {
      router.push(`/categories?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full max-w-sm flex items-center">
          <Search className="absolute left-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Cari nama kategori..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {isPending && (
            <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-indigo-500" />
          )}
        </div>
        <Button onClick={() => handleOpenForm()} className="gap-2">
          <Plus className="w-4 h-4" /> Tambah Kategori
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
              <TableHead>Nama Kategori</TableHead>
              <TableHead className="text-center">Total Buku</TableHead>
              <TableHead className="text-center">Total Dipinjam</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-6 text-slate-500"
                >
                  Tidak ada kategori ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              data.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium text-slate-900">
                    {cat.name}
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    {cat.totalBooks}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700">
                      {cat.totalLoaned} buku
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => {
                        startTransition(() => {
                          router.push(`/categories/${cat.id}/books`);
                        });
                      }}
                      title="Lihat Buku"
                      className="gap-1.5"
                    >
                      <BookOpen className="w-3.5 h-3.5" /> Lihat Buku
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleOpenForm(cat)}
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        setSelectedCategory(cat);
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
        <div className="flex justify-end items-center gap-4 text-sm">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1 || isPending}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Sebelumnya
          </Button>
          <span className="font-medium">
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

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Kategori</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isLoading}
                        placeholder="Contoh: Fiksi, Teknologi..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus kategori{" "}
              <b>{selectedCategory?.name}</b> secara permanen jika tidak ada
              buku yang terikat dengannya.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {/* Gunakan Button biasa dengan onClick untuk menutup dialog */}
            <Button
              variant="outline"
              disabled={isLoading}
              onClick={() => setIsDeleteOpen(false)}
            >
              Batal
            </Button>

            {/* Gunakan Button biasa untuk aksi hapus */}
            <Button
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? "Menghapus..." : "Ya, Hapus"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
