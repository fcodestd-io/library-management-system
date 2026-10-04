"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Edit } from "lucide-react";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AsyncCombobox } from "@/components/async-combobox";

import {
  bookCopyEditSchema,
  BookCopyEditFormValues,
} from "@/lib/validations/book";
import { updateBookCopy, searchRacks } from "@/actions/books";
import { formatDateShort } from "@/lib/format-date-short";
import { cn } from "@/lib/utils";

export function CopyClient({
  bookId,
  copies,
}: {
  bookId: string;
  copies: any[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCopy, setSelectedCopy] = useState<any>(null);
  const [selectedRackLabel, setSelectedRackLabel] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<BookCopyEditFormValues>({
    resolver: zodResolver(bookCopyEditSchema),
    defaultValues: {
      rackId: "",
      condition: "GOOD",
      status: "AVAILABLE",
      acquiredAt: "",
    },
  });

  const handleOpenEdit = (copy: any) => {
    setSelectedCopy(copy);
    setSelectedRackLabel(
      `${copy.rackCode} (${copy.rackName} - ${copy.roomName})`,
    );
    form.reset({
      rackId: copy.rackId,
      condition: copy.condition,
      status: copy.status,
      acquiredAt: copy.acquiredAt,
    });
    setIsEditOpen(true);
  };

  const onSubmitEdit = async (values: BookCopyEditFormValues) => {
    if (!selectedCopy) return;
    setIsLoading(true);
    const res = await updateBookCopy(bookId, selectedCopy.id, values);
    setIsLoading(false);

    if (res.error) toast.error(res.error);
    else {
      toast.success("Eksemplar buku berhasil diperbarui.");
      setIsEditOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          disabled={isPending}
          onClick={() => {
            startTransition(() => {
              router.push("/books");
            });
          }}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium text-slate-500">
          Kembali ke Daftar Buku
        </span>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>No. Inventaris</TableHead>
              <TableHead>Lokasi Rak & Ruangan</TableHead>
              <TableHead className="text-center">Kondisi</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead>Perolehan (Acquired)</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {copies.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-6 text-slate-500"
                >
                  Belum ada eksemplar terdaftar.
                </TableCell>
              </TableRow>
            ) : (
              copies.map((copy) => (
                <TableRow key={copy.id}>
                  <TableCell className="font-mono text-xs font-bold text-slate-900">
                    {copy.inventoryNumber}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-800">
                      {copy.rackCode} - {copy.rackName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {copy.roomName}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={cn(
                        "px-2 py-0.5 text-xs rounded font-medium",
                        copy.condition === "GOOD"
                          ? "bg-emerald-50 text-emerald-700"
                          : copy.condition === "DAMAGED"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-rose-50 text-rose-700",
                      )}
                    >
                      {copy.condition === "GOOD"
                        ? "Baik"
                        : copy.condition === "DAMAGED"
                          ? "Rusak"
                          : "Hilang"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={cn(
                        "px-2 py-1 text-xs rounded-md font-medium",
                        copy.status === "AVAILABLE"
                          ? "bg-blue-100 text-blue-700"
                          : copy.status === "BORROWED"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700",
                      )}
                    >
                      {copy.status}
                    </span>
                  </TableCell>
                  {/* Format Diff for Humans */}
                  <TableCell
                    className="text-xs text-slate-600"
                    title={copy.acquiredAt}
                  >
                    {formatDateShort(copy.acquiredAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleOpenEdit(copy)}
                      title="Edit Eksemplar"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Edit Copy Satuan */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Eksemplar Copy</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmitEdit)}
              className="space-y-4"
            >
              <FormItem>
                <FormLabel>
                  Lokasi Rak <span className="text-red-500">*</span>
                </FormLabel>
                <AsyncCombobox
                  placeholder="Cari Kode Rak (min 2 huruf)..."
                  value={form.watch("rackId")}
                  displayValue={selectedRackLabel}
                  onSelect={(opt) => {
                    form.setValue("rackId", opt.id);
                    setSelectedRackLabel(`${opt.label} (${opt.subLabel})`);
                  }}
                  fetcher={async (q) => {
                    const res = await searchRacks(q);
                    return res.map((r) => ({
                      id: r.id,
                      label: r.code,
                      subLabel: `${r.name} - ${r.roomName}`,
                    }));
                  }}
                />
              </FormItem>

              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kondisi Fisik</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kondisi" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="GOOD">Baik (GOOD)</SelectItem>
                        <SelectItem value="DAMAGED">Rusak (DAMAGED)</SelectItem>
                        <SelectItem value="LOST">Hilang (LOST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status Akses</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="AVAILABLE">
                          Tersedia (AVAILABLE)
                        </SelectItem>
                        <SelectItem value="BORROWED">
                          Dipinjam (BORROWED)
                        </SelectItem>
                        <SelectItem value="INACTIVE">
                          Non-Aktif (INACTIVE)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="acquiredAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Perolehan</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
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
    </div>
  );
}
