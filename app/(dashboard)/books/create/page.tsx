"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react";

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
import { AsyncCombobox } from "@/components/async-combobox";
import { bulkBookSchema, BulkBookFormValues } from "@/lib/validations/book";
import {
  createBulkBooks,
  searchCategories,
  searchRacks,
} from "@/actions/books";

export default function CreateBulkBooksPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<BulkBookFormValues>({
    resolver: zodResolver(bulkBookSchema),
    defaultValues: {
      books: [
        {
          categoryId: "",
          categoryName: "",
          rackId: "",
          rackCode: "",
          title: "",
          isbn: "",
          bookValue: 0,
          totalCopy: 1,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "books",
  });

  const onSubmit = async (values: BulkBookFormValues) => {
    setIsLoading(true);
    const res = await createBulkBooks(values);
    setIsLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Berhasil menambahkan koleksi buku!");
      router.push("/books");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/books")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Tambah Koleksi Buku (Multiple)
          </h1>
          <p className="text-sm text-slate-500">
            Input beberapa judul buku sekaligus beserta jumlah eksemplar dan
            lokasi rak awal.
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="border rounded-lg bg-white overflow-x-auto shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 text-xs">
                <TableHead className="w-[180px]">
                  Kategori (Min 2 huruf)
                </TableHead>
                <TableHead className="w-[180px]">Rak (Cari Kode)</TableHead>
                <TableHead className="min-w-[200px]">Judul Buku</TableHead>
                <TableHead className="w-[140px]">ISBN (Opsional)</TableHead>
                <TableHead className="w-[120px]">Harga (Rp)</TableHead>
                <TableHead className="w-[80px]">Total Copy</TableHead>
                <TableHead className="w-[50px] text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={field.id}>
                  {/* Category Live Search */}
                  <TableCell>
                    <AsyncCombobox
                      placeholder="Pilih Kategori"
                      value={form.watch(`books.${index}.categoryId`)}
                      displayValue={form.watch(`books.${index}.categoryName`)}
                      onSelect={(opt) => {
                        form.setValue(`books.${index}.categoryId`, opt.id);
                        form.setValue(`books.${index}.categoryName`, opt.label);
                      }}
                      fetcher={async (q) => {
                        const res = await searchCategories(q);
                        return res.map((c) => ({ id: c.id, label: c.name }));
                      }}
                    />
                  </TableCell>

                  {/* Rack Live Search */}
                  <TableCell>
                    <AsyncCombobox
                      placeholder="Cari Kode Rak"
                      value={form.watch(`books.${index}.rackId`)}
                      displayValue={form.watch(`books.${index}.rackCode`)}
                      onSelect={(opt) => {
                        form.setValue(`books.${index}.rackId`, opt.id);
                        form.setValue(
                          `books.${index}.rackCode`,
                          `${opt.label} (${opt.subLabel})`,
                        );
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
                  </TableCell>

                  {/* Title */}
                  <TableCell>
                    <Input
                      {...form.register(`books.${index}.title`)}
                      placeholder="Judul Buku..."
                    />
                  </TableCell>

                  {/* ISBN */}
                  <TableCell>
                    <Input
                      {...form.register(`books.${index}.isbn`)}
                      placeholder="ISBN..."
                      className="font-mono text-xs"
                    />
                  </TableCell>

                  {/* Price */}
                  <TableCell>
                    <Input
                      type="number"
                      {...form.register(`books.${index}.bookValue`)}
                      placeholder="0"
                    />
                  </TableCell>

                  {/* Copy Count */}
                  <TableCell>
                    <Input
                      type="number"
                      min={1}
                      {...form.register(`books.${index}.totalCopy`)}
                    />
                  </TableCell>

                  {/* Remove Button */}
                  <TableCell className="text-center">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      disabled={fields.length === 1}
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between items-center pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              append({
                categoryId: "",
                categoryName: "",
                rackId: "",
                rackCode: "",
                title: "",
                isbn: "",
                bookValue: 0,
                totalCopy: 1,
              })
            }
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> Tambah Baris Buku
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/books")}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              <Save className="w-4 h-4" />{" "}
              {isLoading ? "Memproses..." : "Simpan Semua Buku"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
