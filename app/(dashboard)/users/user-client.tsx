"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Search, Plus, Edit, Trash2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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

import {
  userSchema,
  userUpdateSchema,
  UserFormValues,
  UserUpdateFormValues,
} from "@/lib/validations/user";
import { createUser, updateUser, deleteUser } from "@/actions/users";
import { cn } from "@/lib/utils";

export function UserClient({
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

  // State untuk transisi ringan (Suspense lokal)
  const [isPending, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [debouncedSearch] = useDebounce(searchTerm, 500);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const limit = 5;
  const totalPages = Math.ceil(total / limit);

  // Efek Live Search (Diperbaiki agar tidak infinite render)
  useEffect(() => {
    const currentQ = searchParams.get("q") || "";

    // GUARD: Cegah infinite loop. Jika pencarian sama dengan URL, hentikan proses.
    if (debouncedSearch === currentQ) return;

    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) {
      params.set("q", debouncedSearch);
      params.set("page", "1");
    } else {
      params.delete("q");
    }

    // Gunakan transition agar UI tidak freeze saat ganti URL
    startTransition(() => {
      router.push(`/users?${params.toString()}`, { scroll: false });
    });
  }, [debouncedSearch, searchParams, router]);

  const form = useForm<UserFormValues | UserUpdateFormValues>({
    resolver: zodResolver(selectedUser ? userUpdateSchema : userSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const handleOpenForm = (user?: any) => {
    if (user) {
      setSelectedUser(user);
      form.reset({ name: user.name, email: user.email, password: "" });
    } else {
      setSelectedUser(null);
      form.reset({ name: "", email: "", password: "" });
    }
    setIsFormOpen(true);
  };

  const onSubmit = async (values: any) => {
    setIsLoading(true);
    const res = selectedUser
      ? await updateUser(selectedUser.id, values)
      : await createUser(values);

    setIsLoading(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(
        `User berhasil ${selectedUser ? "diperbarui" : "ditambahkan"}.`,
      );
      setIsFormOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setIsLoading(true);
    const res = await deleteUser(selectedUser.id);
    setIsLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("User berhasil dihapus.");
    }
    setIsDeleteOpen(false);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());

    startTransition(() => {
      router.push(`/users?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full max-w-sm flex items-center">
          <Search className="absolute left-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Cari nama atau email..."
            className="pl-9 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {/* Spinner kecil muncul di dalam input saat loading pencarian */}
          {isPending && (
            <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-indigo-500" />
          )}
        </div>
        <Button
          onClick={() => handleOpenForm()}
          className="w-full sm:w-auto gap-2"
        >
          <Plus className="w-4 h-4" /> Tambah Petugas
        </Button>
      </div>

      {/* Tabel dengan efek transparan (loading) jika isPending true */}
      <div
        className={cn(
          "border rounded-lg bg-white overflow-hidden transition-opacity duration-200",
          isPending ? "opacity-50 pointer-events-none" : "opacity-100",
        )}
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
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
                  Tidak ada data ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              data.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "px-2 py-1 text-xs rounded-md font-medium",
                        user.role === "OWNER"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-slate-100 text-slate-700",
                      )}
                    >
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenForm(user)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {user.role !== "OWNER" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
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

      {/* Dialog Form */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? "Edit User" : "Tambah Petugas Baru"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alamat Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Kata Sandi{" "}
                      {selectedUser && (
                        <span className="text-xs text-slate-500 font-normal">
                          (Kosongkan jika tidak ingin diubah)
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input type="password" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Menyimpan..." : "Simpan Data"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog Hapus */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Petugas?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Petugas{" "}
              <b>{selectedUser?.name}</b> akan dihapus secara permanen dari
              sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? "Menghapus..." : "Ya, Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
