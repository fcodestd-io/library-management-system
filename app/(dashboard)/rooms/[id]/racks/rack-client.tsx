"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Search, Plus, Edit, Trash2, Loader2, ArrowLeft } from "lucide-react";

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

import { rackSchema, RackFormValues } from "@/lib/validations/room-rack";
import { createRack, updateRack, deleteRack } from "@/actions/rooms";
import { cn } from "@/lib/utils";

export function RackClient({
  roomId,
  data,
  total,
  currentPage,
}: {
  roomId: string;
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
  const [selectedRack, setSelectedRack] = useState<any>(null);
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
      router.push(`/rooms/${roomId}/racks?${params.toString()}`, {
        scroll: false,
      });
    });
  }, [debouncedSearch, searchParams, router, roomId]);

  const form = useForm<RackFormValues>({
    resolver: zodResolver(rackSchema),
    defaultValues: { code: "", name: "", isActive: true },
  });

  const handleOpenForm = (rack?: any) => {
    if (rack) {
      setSelectedRack(rack);
      form.reset({
        code: rack.code,
        name: rack.name,
        isActive: rack.status === "ACTIVE",
      });
    } else {
      setSelectedRack(null);
      form.reset({ code: "", name: "", isActive: true });
    }
    setIsFormOpen(true);
  };

  const onSubmit = async (values: RackFormValues) => {
    setIsLoading(true);
    const res = selectedRack
      ? await updateRack(roomId, selectedRack.id, values)
      : await createRack(roomId, values);

    setIsLoading(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(
        `Rak berhasil ${selectedRack ? "diperbarui" : "ditambahkan"}.`,
      );
      setIsFormOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRack) return;
    setIsLoading(true);
    const res = await deleteRack(roomId, selectedRack.id);
    setIsLoading(false);

    if (res.error) toast.error(res.error);
    else toast.success(res.message);

    setIsDeleteOpen(false);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    startTransition(() => {
      router.push(`/rooms/${roomId}/racks?${params.toString()}`, {
        scroll: false,
      });
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-2 w-full max-w-sm">
          <Button
            variant="outline"
            size="icon"
            disabled={isPending}
            onClick={() => {
              startTransition(() => {
                router.push("/rooms");
              });
            }}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="relative w-full flex items-center">
            <Search className="absolute left-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Cari rak atau kode..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {isPending && (
              <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-indigo-500" />
            )}
          </div>
        </div>

        <Button onClick={() => handleOpenForm()} className="gap-2">
          <Plus className="w-4 h-4" /> Tambah Rak
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
              <TableHead>Rak & Kode</TableHead>
              <TableHead className="text-center">Total Buku</TableHead>
              <TableHead className="text-center">Status</TableHead>
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
                  Tidak ada rak ditemukan di ruangan ini.
                </TableCell>
              </TableRow>
            ) : (
              data.map((rack) => (
                <TableRow key={rack.id}>
                  <TableCell>
                    <div className="font-medium text-slate-900">
                      {rack.name}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      {rack.code}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    {rack.totalBooks} buku
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={cn(
                        "px-2 py-1 text-xs rounded-md font-medium",
                        rack.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700",
                      )}
                    >
                      {rack.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleOpenForm(rack)}
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        setSelectedRack(rack);
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

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedRack ? "Edit Rak" : "Tambah Rak Baru"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Kode Rak <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isLoading}
                        placeholder="Contoh: RK-RUAN-NOV#01"
                        className="font-mono uppercase"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nama Rak <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isLoading}
                        placeholder="Contoh: Rak A1 - Novel & Fiksi"
                      />
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
                    <div className="space-y-0.5">
                      <FormLabel>Status Rak</FormLabel>
                      <p className="text-xs text-slate-500">
                        Rak aktif dapat dialokasikan untuk salinan buku.
                      </p>
                    </div>
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
                  onClick={() => setIsFormOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Memproses..." : "Simpan Data"}
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
            <AlertDialogTitle>Hapus Rak?</AlertDialogTitle>
            <AlertDialogDescription>
              Jika rak <b>{selectedRack?.name}</b> masih berisi salinan buku,
              statusnya akan dialihkan menjadi <b>INACTIVE</b>. Jika kosong, rak
              dihapus permanen.
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
              {isLoading ? "Memproses..." : "Ya, Lanjutkan"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
