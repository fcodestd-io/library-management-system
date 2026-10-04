"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Search, Plus, Edit, Trash2, Loader2, Layers } from "lucide-react";

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

import { roomSchema, RoomFormValues } from "@/lib/validations/room-rack";
import { createRoom, updateRoom, deleteRoom } from "@/actions/rooms";
import { cn } from "@/lib/utils";

export function RoomClient({
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
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
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
      router.push(`/rooms?${params.toString()}`, { scroll: false });
    });
  }, [debouncedSearch, searchParams, router]);

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: { code: "", name: "", isActive: true },
  });

  const handleOpenForm = (room?: any) => {
    if (room) {
      setSelectedRoom(room);
      form.reset({
        code: room.code,
        name: room.name,
        isActive: room.status === "ACTIVE",
      });
    } else {
      setSelectedRoom(null);
      form.reset({ code: "", name: "", isActive: true });
    }
    setIsFormOpen(true);
  };

  const onSubmit = async (values: RoomFormValues) => {
    setIsLoading(true);
    const res = selectedRoom
      ? await updateRoom(selectedRoom.id, values)
      : await createRoom(values);

    setIsLoading(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(
        `Ruangan berhasil ${selectedRoom ? "diperbarui" : "ditambahkan"}.`,
      );
      setIsFormOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRoom) return;
    setIsLoading(true);
    const res = await deleteRoom(selectedRoom.id);
    setIsLoading(false);

    if (res.error) toast.error(res.error);
    else toast.success(res.message);

    setIsDeleteOpen(false);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    startTransition(() => {
      router.push(`/rooms?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full max-w-sm flex items-center">
          <Search className="absolute left-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Cari ruangan atau kode..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {isPending && (
            <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-indigo-500" />
          )}
        </div>
        <Button onClick={() => handleOpenForm()} className="gap-2">
          <Plus className="w-4 h-4" /> Tambah Ruangan
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
              <TableHead>Ruangan & Kode</TableHead>
              <TableHead className="text-center">Total Rak</TableHead>
              <TableHead className="text-center">Total Buku</TableHead>
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
                  Tidak ada ruangan ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              data.map((room) => (
                <TableRow key={room.id}>
                  <TableCell>
                    <div className="font-medium text-slate-900">
                      {room.name}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      {room.code}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    {room.totalRacks} rak
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    {room.totalBooks} buku
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={cn(
                        "px-2 py-1 text-xs rounded-md font-medium",
                        room.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700",
                      )}
                    >
                      {room.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => {
                        startTransition(() => {
                          router.push(`/rooms/${room.id}/racks`);
                        });
                      }}
                      title="Lihat Rak"
                      className="gap-1.5"
                    >
                      <Layers className="w-3.5 h-3.5" /> Lihat Rak
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleOpenForm(room)}
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        setSelectedRoom(room);
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
              {selectedRoom ? "Edit Ruangan" : "Tambah Ruangan Baru"}
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
                      Kode Ruangan <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isLoading}
                        placeholder="Contoh: RM-RUAN#101"
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
                      Nama Ruangan <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isLoading}
                        placeholder="Contoh: Ruang Baca Utama"
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
                      <FormLabel>Status Ruangan</FormLabel>
                      <p className="text-xs text-slate-500">
                        Ruangan aktif dapat diisi rak baru.
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
            <AlertDialogTitle>Hapus Ruangan?</AlertDialogTitle>
            <AlertDialogDescription>
              Jika ruangan <b>{selectedRoom?.name}</b> masih memiliki rak di
              dalamnya, statusnya akan dialihkan menjadi <b>INACTIVE</b>[cite:
              1]. Jika kosong, ruangan dihapus permanen[cite: 1].
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
