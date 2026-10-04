"use client";

import { useState, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Undo2,
  Printer,
  CheckCircle2,
  Calculator,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AsyncCombobox } from "@/components/async-combobox";

import {
  processReturnSchema,
  ProcessReturnFormValues,
} from "@/lib/validations/return";
import { searchActiveLoans, processBookReturn } from "@/actions/returns";

export function ReturnClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const receiptRef = useRef<HTMLDivElement>(null);

  const form = useForm<ProcessReturnFormValues>({
    resolver: zodResolver(processReturnSchema),
    defaultValues: {
      loanId: "",
      returnCondition: "GOOD",
      paymentMethod: "CASH",
      notes: "",
      amountPaid: 0,
    },
  });

  const watchCondition = useWatch({
    control: form.control,
    name: "returnCondition",
  });
  const watchAmountPaid =
    useWatch({ control: form.control, name: "amountPaid" }) || 0;

  // Real-time Calculation
  let loanFeeAmount = 0;
  let estimatedOverdueDays = 0;
  let estimatedOverdueFine = 0;
  let estimatedConditionFine = 0;

  if (selectedLoan) {
    // PERBAIKAN: Gunakan remainingAmount bukannya amount asal
    loanFeeAmount = Number(selectedLoan.remainingAmount) || 0;

    const today = new Date();
    const dueAt = new Date(selectedLoan.dueAt);
    const diffTime = today.getTime() - dueAt.getTime();
    estimatedOverdueDays =
      diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
    estimatedOverdueFine = estimatedOverdueDays * 1000;

    const bookPrice = Number(selectedLoan.bookValue) || 0;
    if (watchCondition === "DAMAGED") estimatedConditionFine = bookPrice * 0.5;
    else if (watchCondition === "LOST")
      estimatedConditionFine = bookPrice * 1.0;
  }

  const totalFineAmount = estimatedOverdueFine + estimatedConditionFine;
  const grandTotalDebt = loanFeeAmount + totalFineAmount; // Sisa Piutang Sewa + Denda

  const parsedPaid = Number(watchAmountPaid) || 0;
  const changeAmount = Math.max(0, parsedPaid - grandTotalDebt);
  const remainingDebtAfter = Math.max(0, grandTotalDebt - parsedPaid);

  const onSubmit = async (values: ProcessReturnFormValues) => {
    setIsLoading(true);
    const res = await processBookReturn(values);
    setIsLoading(false);

    if (res?.success && res?.data) {
      toast.success("Pengembalian buku & pembayaran berhasil diproses!");
      setReceiptData(res.data);
      setIsReceiptOpen(true);

      form.reset({
        loanId: "",
        returnCondition: "GOOD",
        paymentMethod: "CASH",
        notes: "",
        amountPaid: 0,
      });
      setSelectedLoan(null);
    } else {
      toast.error(res?.error || "Gagal memproses pengembalian.");
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
            <Undo2 className="w-5 h-5 text-indigo-600" /> Form Pengembalian Buku
            & Pembayaran
          </CardTitle>
          <CardDescription>
            Cari transaksi peminjaman aktif. Sistem akan mengalkulasi sisa
            piutang sewa, denda (jika ada), total tagihan, dan sisa piutang.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              noValidate
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Kolom Kiri: Input Form */}
                <div className="lg:col-span-7 space-y-5">
                  <FormField
                    control={form.control}
                    name="loanId"
                    render={({ fieldState }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-medium">
                          Cari Peminjaman Aktif{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <AsyncCombobox
                            placeholder="Ketik Kode Peminjaman / Nama Anggota (min 2 huruf)..."
                            value={form.watch("loanId")}
                            displayValue={
                              selectedLoan
                                ? `[${selectedLoan.loanCode}] ${selectedLoan.memberName} - ${selectedLoan.bookTitle}`
                                : ""
                            }
                            onSelect={(opt: any) => {
                              form.setValue("loanId", opt.id, {
                                shouldValidate: true,
                              });
                              setSelectedLoan(opt.raw);
                            }}
                            fetcher={async (q) => {
                              const res = await searchActiveLoans(q);
                              return res.map((l) => ({
                                id: l.id,
                                label: `[${l.loanCode}] ${l.memberName}`,
                                // PERBAIKAN: Tampilkan remainingAmount pada subLabel
                                subLabel: `Buku: ${l.bookTitle} | Sisa Piutang Sewa: Rp ${Number(l.remainingAmount).toLocaleString("id-ID")}`,
                                raw: l,
                              }));
                            }}
                          />
                        </FormControl>
                        {fieldState.error && (
                          <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1 font-medium">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{fieldState.error.message}</span>
                          </div>
                        )}
                      </FormItem>
                    )}
                  />

                  {/* Kondisi Fisik Buku */}
                  <FormField
                    control={form.control}
                    name="returnCondition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-medium">
                          Kondisi Fisik Buku
                        </FormLabel>
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
                            <SelectItem value="DAMAGED">
                              Rusak (DAMAGED)
                            </SelectItem>
                            <SelectItem value="LOST">Hilang (LOST)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  {/* Metode Bayar */}
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-medium">
                          Metode Pembayaran
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih metode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="CASH">Tunai (CASH)</SelectItem>
                            <SelectItem value="QRIS">QRIS</SelectItem>
                            <SelectItem value="TRANSFER">
                              Bank Transfer
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  {/* Uang Diterima */}
                  <FormField
                    control={form.control}
                    name="amountPaid"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-medium">
                          Uang Diterima / Dibayar (Rp)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            disabled={isLoading || !selectedLoan}
                            placeholder="0"
                          />
                        </FormControl>
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

                {/* Kolom Kanan: Summary Rincian Tagihan & Sisa */}
                <div className="lg:col-span-5 bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-800 font-semibold">
                      <Calculator className="w-4 h-4 text-indigo-600" />
                      Rincian Piutang & Tagihan
                    </div>

                    {selectedLoan ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-slate-600">
                          <span>Kode Peminjaman:</span>
                          <span className="font-mono font-bold text-slate-900">
                            {selectedLoan.loanCode}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Anggota:</span>
                          <span className="font-medium text-slate-900">
                            {selectedLoan.memberName}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Buku:</span>
                          <span className="font-medium text-slate-900 truncate max-w-[180px]">
                            {selectedLoan.bookTitle}
                          </span>
                        </div>

                        {/* Breakdown Biaya */}
                        <div className="pt-2 border-t text-xs space-y-1.5">
                          <div className="flex justify-between text-slate-700">
                            <span>Sisa Piutang Sewa:</span>
                            <span className="font-semibold">
                              Rp {loanFeeAmount.toLocaleString("id-ID")}
                            </span>
                          </div>
                          <div className="flex justify-between text-amber-700">
                            <span>
                              Denda Terlambat ({estimatedOverdueDays} Hari):
                            </span>
                            <span>
                              Rp {estimatedOverdueFine.toLocaleString("id-ID")}
                            </span>
                          </div>
                          <div className="flex justify-between text-rose-700">
                            <span>Denda Fisik ({watchCondition}):</span>
                            <span>
                              Rp{" "}
                              {estimatedConditionFine.toLocaleString("id-ID")}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-xs text-slate-400">
                        Pilih data peminjaman terlebih dahulu.
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-200 space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold text-slate-800">
                          TOTAL PIUTANG & TAGIHAN:
                        </span>
                        <span className="text-xl font-black text-slate-900">
                          Rp {grandTotalDebt.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline text-emerald-700">
                        <span className="text-xs font-semibold">
                          Uang Kembalian:
                        </span>
                        <span className="text-sm font-bold">
                          Rp {changeAmount.toLocaleString("id-ID")}
                        </span>
                      </div>
                      {remainingDebtAfter > 0 && (
                        <div className="flex justify-between items-baseline text-rose-600">
                          <span className="text-xs font-semibold">
                            Sisa Tagihan Belum Lunas:
                          </span>
                          <span className="text-sm font-bold">
                            Rp {remainingDebtAfter.toLocaleString("id-ID")}
                          </span>
                        </div>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading || !selectedLoan}
                      className="w-full gap-2 py-2.5 text-sm bg-slate-900 hover:bg-slate-800 text-white"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {isLoading
                        ? "Memproses..."
                        : "Proses Pengembalian & Bayar"}
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
            <DialogTitle>Struk Pengembalian & Pembayaran</DialogTitle>
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
                    Bukti Pengembalian & Pelunasan
                  </p>
                </div>

                <div className="text-center py-2 bg-slate-50 rounded-md border border-slate-200">
                  <span className="text-xs text-slate-500 uppercase tracking-widest block">
                    No. Kuitansi
                  </span>
                  <span className="text-lg font-black font-mono text-slate-900 tracking-wider">
                    PAY-{receiptData.paymentCode}
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
                    <span className="text-slate-500">Buku:</span>
                    <span className="font-semibold">
                      {receiptData.bookTitle}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      Kondisi Pengembalian:
                    </span>
                    <span className="font-bold text-indigo-600">
                      {receiptData.returnCondition}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Metode Bayar:</span>
                    <span className="font-semibold">
                      {receiptData.paymentMethod}
                    </span>
                  </div>
                </div>

                {/* Breakdown Tagihan Lengkap di Struk */}
                <div className="text-xs space-y-1.5 border-b pb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sisa Piutang Sewa:</span>
                    <span>
                      Rp {receiptData.loanFeeAmount.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Denda:</span>
                    <span>
                      Rp {receiptData.totalFineAmount.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pt-1 border-t">
                    <span>TOTAL TAGIHAN:</span>
                    <span>
                      Rp {receiptData.grandTotalDebt.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Uang Diterima:</span>
                    <span className="font-semibold">
                      Rp {receiptData.amountPaid.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>KEMBALIAN:</span>
                    <span>
                      Rp {receiptData.changeAmount.toLocaleString("id-ID")}
                    </span>
                  </div>
                  {receiptData.remainingDebt > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold pt-1 border-t">
                      <span>SISA PIUTANG:</span>
                      <span>
                        Rp {receiptData.remainingDebt.toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-center pt-2 text-[11px] text-slate-500">
                  <p className="font-semibold text-slate-700">
                    Terima Kasih Atas Pengembalian Buku!
                  </p>
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
          @page {
            margin: 0;
            size: 80mm auto;
          }
          body {
            background: white !important;
            margin: 0 !important;
          }
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 50% !important;
            top: 20px !important;
            transform: translateX(-50%) !important;
            width: 80mm !important;
            padding: 12px !important;
            border: none !important;
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}
