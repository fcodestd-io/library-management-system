"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  BookOpen,
  Printer,
  CheckCircle2,
  Calculator,
  Calendar,
  Banknote,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AsyncCombobox } from "@/components/async-combobox";

import { createLoanSchema, CreateLoanFormValues } from "@/lib/validations/loan";
import {
  searchMembersForLoan,
  searchBooksForLoan,
  createLoan,
  getLoanSettings,
} from "@/actions/loans";

export function LoanClient({ userId }: { userId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [settings, setSettings] = useState({
    loanPricePerDay: 2000,
    maximumLoanDays: 7,
    maximumActiveLoans: 3,
  });

  const [receiptData, setReceiptData] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const receiptRef = useRef<HTMLDivElement>(null);

  const form = useForm<CreateLoanFormValues>({
    resolver: zodResolver(createLoanSchema),
    defaultValues: { memberId: "", bookId: "", loanDays: 7 },
  });

  useEffect(() => {
    getLoanSettings().then((data) => setSettings(data));
  }, []);

  const watchLoanDays = useWatch({ control: form.control, name: "loanDays" });
  const parsedDays = Number(watchLoanDays) || 0;

  const today = new Date();
  const dueDate = new Date();
  dueDate.setDate(today.getDate() + parsedDays);

  const totalCalculatedAmount = parsedDays * settings.loanPricePerDay;

  const onSubmit = async (values: CreateLoanFormValues) => {
    setIsLoading(true);
    const res = await createLoan(values, userId);
    setIsLoading(false);

    if (res?.success && res?.data) {
      toast.success("Transaksi peminjaman berhasil disimpan!");
      setReceiptData(res.data);
      setIsReceiptOpen(true);

      form.reset({
        memberId: "",
        bookId: "",
        loanDays: settings.maximumLoanDays,
      });
      setSelectedMember(null);
      setSelectedBook(null);
    } else {
      toast.error(
        res?.error || "Terjadi kesalahan sistem saat menyimpan transaksi.",
      );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-6">
      <Card className="w-full shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" /> Form Transaksi
            Peminjaman
          </CardTitle>
          <CardDescription>
            Pilih anggota aktif dan buku yang akan dipinjam. Durasi maksimum
            peminjaman adalah {settings.maximumLoanDays} hari.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            {/* noValidate mematikan balon validasi HTML browser */}
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              noValidate
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Kolom Input Form */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Field Member */}
                  <FormField
                    control={form.control}
                    name="memberId"
                    render={({ fieldState }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-medium">
                          Pilih Anggota Perpustakaan{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <AsyncCombobox
                            placeholder="Cari Nama / ID Member (min 2 huruf)..."
                            value={form.watch("memberId")}
                            displayValue={
                              selectedMember
                                ? `${selectedMember.name} (${selectedMember.memberCode})`
                                : ""
                            }
                            onSelect={(opt: any) => {
                              form.setValue("memberId", opt.id, {
                                shouldValidate: true,
                              });
                              setSelectedMember(opt.raw);
                            }}
                            fetcher={async (q) => {
                              const res = await searchMembersForLoan(q);
                              return res.map((m) => {
                                const isFull =
                                  m.activeLoans >= settings.maximumActiveLoans;
                                return {
                                  id: m.id,
                                  label: `${m.name} (${m.memberCode}) ${isFull ? "[BATAS PINJAM PENUH]" : ""}`,
                                  subLabel: `Peminjaman Aktif: ${m.activeLoans}/${settings.maximumActiveLoans} buku`,
                                  raw: m,
                                };
                              });
                            }}
                          />
                        </FormControl>
                        {/* Tampilan Pesan Error Zod */}
                        {fieldState.error && (
                          <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1 font-medium">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{fieldState.error.message}</span>
                          </div>
                        )}
                      </FormItem>
                    )}
                  />

                  {/* Field Buku */}
                  <FormField
                    control={form.control}
                    name="bookId"
                    render={({ fieldState }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-medium">
                          Pilih Buku <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <AsyncCombobox
                            placeholder="Cari Judul / ISBN Buku (min 2 huruf)..."
                            value={form.watch("bookId")}
                            displayValue={
                              selectedBook ? selectedBook.title : ""
                            }
                            onSelect={(opt: any) => {
                              form.setValue("bookId", opt.id, {
                                shouldValidate: true,
                              });
                              setSelectedBook(opt.raw);
                            }}
                            fetcher={async (q) => {
                              const res = await searchBooksForLoan(q);
                              return res.map((b) => ({
                                id: b.id,
                                label: b.title,
                                subLabel: `Tersedia: ${b.availableCopies} eksemplar (Kondisi Baik)`,
                                raw: b,
                              }));
                            }}
                          />
                        </FormControl>
                        {/* Tampilan Pesan Error Zod */}
                        {fieldState.error && (
                          <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1 font-medium">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{fieldState.error.message}</span>
                          </div>
                        )}
                      </FormItem>
                    )}
                  />

                  {/* Field Durasi Hari (Tanpa required/min/max HTML) */}
                  <FormField
                    control={form.control}
                    name="loanDays"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-medium">
                          Durasi Peminjaman (Hari){" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            disabled={isLoading}
                            placeholder="Contoh: 7"
                            className={
                              fieldState.error
                                ? "border-red-500 focus-visible:ring-red-500"
                                : ""
                            }
                          />
                        </FormControl>
                        {/* Tampilan Pesan Error Zod */}
                        {fieldState.error && (
                          <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1 font-medium">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{fieldState.error.message}</span>
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                </div>

                {/* Kolom Rincian & Kalkulasi */}
                <div className="lg:col-span-5 bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-800 font-semibold">
                      <Calculator className="w-4 h-4 text-indigo-600" />
                      Rincian & Kalkulasi Transaksi
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Tanggal Pinjam:</span>
                        <span className="font-medium text-slate-900">
                          {today.toLocaleDateString("id-ID")}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500" />{" "}
                          Tanggal Jatuh Tempo:
                        </span>
                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {dueDate.toLocaleDateString("id-ID")}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-slate-600">
                        <span className="flex items-center gap-1">
                          <Banknote className="w-3.5 h-3.5 text-emerald-600" />{" "}
                          Tarif Sewa Harian:
                        </span>
                        <span className="font-medium text-slate-900">
                          Rp {settings.loanPricePerDay.toLocaleString("id-ID")}{" "}
                          / hari
                        </span>
                      </div>

                      {selectedMember && (
                        <div className="pt-2 border-t border-slate-200/60 text-xs space-y-1">
                          <div className="flex justify-between text-slate-500">
                            <span>Status Pinjam Member:</span>
                            <span className="font-medium text-slate-700">
                              {selectedMember.activeLoans} dari max{" "}
                              {settings.maximumActiveLoans} buku
                            </span>
                          </div>
                        </div>
                      )}

                      {selectedBook && (
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between text-slate-500">
                            <span>Stok Eksemplar Siap:</span>
                            <span className="font-medium text-emerald-700">
                              {selectedBook.availableCopies} Copy (Kondisi Baik)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 space-y-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-semibold text-slate-700">
                        Total Biaya Sewa:
                      </span>
                      <span className="text-2xl font-black text-slate-900">
                        Rp {totalCalculatedAmount.toLocaleString("id-ID")}
                      </span>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full gap-2 py-2.5 text-sm bg-slate-900 hover:bg-slate-800 text-white"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {isLoading
                        ? "Memproses Peminjaman..."
                        : "Proses Peminjaman"}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Modal Struk */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Struk Peminjaman Buku</DialogTitle>
          </DialogHeader>

          {receiptData && (
            <div className="space-y-4">
              <div
                ref={receiptRef}
                className="print-area p-4 border rounded-lg bg-white space-y-4 text-slate-800"
              >
                <div className="text-center border-b pb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/arunika-logo.png"
                    alt="Logo Arunika"
                    className="h-10 mx-auto mb-1 object-contain"
                  />
                  <h2 className="text-base font-bold uppercase tracking-wider">
                    Perpustakaan Arunika
                  </h2>
                  <p className="text-xs text-slate-500">
                    Bukti Resmi Peminjaman Buku
                  </p>
                </div>

                <div className="text-center py-2 bg-slate-50 rounded-md border border-slate-200">
                  <span className="text-xs text-slate-500 uppercase tracking-widest block">
                    Kode Peminjaman
                  </span>
                  <span className="text-xl font-black font-mono text-slate-900 tracking-wider">
                    {receiptData.loanId.slice(0, 8).toUpperCase()}
                  </span>
                </div>

                <div className="text-xs space-y-1.5 border-b pb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Anggota:</span>
                    <span className="font-semibold">
                      {receiptData.memberName} ({receiptData.memberCode})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tgl Pinjam:</span>
                    <span>{receiptData.borrowedAt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Jatuh Tempo:</span>
                    <span className="font-semibold text-indigo-600">
                      {receiptData.dueAt} ({receiptData.loanDays} Hari)
                    </span>
                  </div>
                </div>

                <div className="text-xs space-y-1.5 border-b pb-3">
                  <span className="text-slate-500 block">Buku Dipinjam:</span>
                  <div className="font-semibold text-slate-900">
                    {receiptData.bookTitle}
                  </div>
                  <div className="font-mono text-[11px] text-slate-500">
                    No. Inv: {receiptData.inventoryNumber}
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm font-bold pt-1">
                  <span>Total Biaya Sewa:</span>
                  <span className="text-slate-900">
                    Rp {receiptData.totalAmount.toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="text-center pt-3 border-t text-[11px] text-slate-500 space-y-1">
                  <p>
                    Harap mengembalikan buku tepat waktu sebelum tanggal jatuh
                    tempo.
                  </p>
                  <p className="font-semibold text-slate-700">Terima Kasih!</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsReceiptOpen(false)}
                >
                  Selesai
                </Button>
                <Button onClick={handlePrint} className="gap-2">
                  <Printer className="w-4 h-4" /> Cetak Struk
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @media print {
          /* 1. Sembunyikan Header dan Footer Bawaan Browser (URL, Tanggal, Title) */
          @page {
            margin: 0;
            size: 80mm auto; /* Atau gunakan 'auto' untuk ukuran kertas standar */
          }

          /* 2. Sembunyikan Seluruh Elemen Halaman Utama */
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          body * {
            visibility: hidden;
          }

          /* 3. Tampilkan Hanya Area Struk dan Atur Posisinya agar Pas */
          .print-area,
          .print-area * {
            visibility: visible;
          }

          .print-area {
            position: absolute;
            left: 50% !important;
            top: 20px !important;
            transform: translateX(-50%) !important;
            width: 80mm !important; /* Ukuran lebar standar thermal struk/receipt */
            max-width: 100% !important;
            padding: 12px !important;
            margin: 0 auto !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}

// C513AB27