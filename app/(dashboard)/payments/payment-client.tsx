"use client";

import { useState, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  CreditCard,
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
  createPaymentSchema,
  CreatePaymentFormValues,
} from "@/lib/validations/payment";
import {
  searchMembersWithDebt,
  processPaymentTransaction,
} from "@/actions/payments";

export function PaymentClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [receiptData, setReceiptData] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const receiptRef = useRef<HTMLDivElement>(null);

  const form = useForm<CreatePaymentFormValues>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: {
      memberId: "",
      paymentType: "FINE_PAYMENT",
      paymentMethod: "CASH",
      amountPaid: 0,
    },
  });

  const watchAmountPaid = useWatch({
    control: form.control,
    name: "amountPaid",
  });
  const parsedPaid = Number(watchAmountPaid) || 0;

  // Hitung Sisa Piutang & Kembalian Real-time
  const targetDebt = selectedItem ? Number(selectedItem.amount) : 0;
  const changeAmount = Math.max(0, parsedPaid - targetDebt);
  const remainingDebtAfter = Math.max(0, targetDebt - parsedPaid);

  const onSubmit = async (values: CreatePaymentFormValues) => {
    setIsLoading(true);
    const res = await processPaymentTransaction(values);
    setIsLoading(false);

    if (res?.success && res?.data) {
      toast.success("Pembayaran berhasil diproses!");
      setReceiptData(res.data);
      setIsReceiptOpen(true);

      form.reset({
        memberId: "",
        paymentType: "FINE_PAYMENT",
        paymentMethod: "CASH",
        amountPaid: 0,
      });
      setSelectedMember(null);
      setSelectedItem(null);
    } else {
      toast.error(res?.error || "Gagal memproses pembayaran.");
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
            <CreditCard className="w-5 h-5 text-indigo-600" /> Transaksi Kasir &
            Pembayaran Piutang
          </CardTitle>
          <CardDescription>
            Pilih anggota untuk menampilkan total sisa piutang/denda, input
            nominal bayar, dan hitung kembalian secara otomatis.
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
                {/* Kolom Kiri: Live Search & Field Input */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Live Search Anggota */}
                  <FormField
                    control={form.control}
                    name="memberId"
                    render={({ fieldState }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-medium">
                          Cari Anggota <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <AsyncCombobox
                            placeholder="Ketik Nama / Kode Anggota (min 2 huruf)..."
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
                              setSelectedItem(null);
                            }}
                            fetcher={async (q) => {
                              const res = await searchMembersWithDebt(q);
                              return res.map((m) => ({
                                id: m.id,
                                label: `${m.name} (${m.memberCode})`,
                                subLabel: `Total Piutang/Denda: Rp ${m.grandTotalDebt.toLocaleString("id-ID")}`,
                                raw: m,
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

                  {/* Pilih Item Tagihan (Denda atau Sewa) */}
                  {selectedMember && (
                    <div className="p-3.5 bg-slate-50 border rounded-lg space-y-3">
                      <FormLabel className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Pilih Tagihan yang Dibayar
                      </FormLabel>

                      <div className="space-y-2">
                        {/* Denda Unpaid */}
                        {selectedMember.unpaidFines.map((f: any) => (
                          <div
                            key={f.fineId}
                            onClick={() => {
                              form.setValue("paymentType", "FINE_PAYMENT");
                              form.setValue("fineId", f.fineId);
                              form.setValue("loanId", undefined);
                              setSelectedItem({
                                amount: Number(f.remainingAmount),
                                title: `Denda (${f.reason})`,
                              });
                            }}
                            className={`p-2.5 rounded-md border text-xs flex justify-between items-center cursor-pointer transition-all ${
                              form.watch("fineId") === f.fineId
                                ? "border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <div>
                              <div className="font-semibold text-slate-800">
                                Pelunasan Denda ({f.reason})
                              </div>
                              <div className="text-slate-500 font-mono">
                                ID: {f.fineId.slice(0, 8)}
                              </div>
                            </div>
                            <span className="font-bold text-rose-600">
                              Rp{" "}
                              {Number(f.remainingAmount).toLocaleString(
                                "id-ID",
                              )}
                            </span>
                          </div>
                        ))}

                        {/* Sewa Peminjaman (Menggunakan remainingAmount) */}
                        {selectedMember.activeLoans.map((l: any) => (
                          <div
                            key={l.loanId}
                            onClick={() => {
                              form.setValue("paymentType", "LOAN_FEE");
                              form.setValue("loanId", l.loanId);
                              form.setValue("fineId", undefined);
                              setSelectedItem({
                                amount: Number(l.remainingAmount), // Menggunakan sisa piutang aktual
                                title: `Sewa: ${l.bookTitle}`,
                              });
                            }}
                            className={`p-2.5 rounded-md border text-xs flex justify-between items-center cursor-pointer transition-all ${
                              form.watch("loanId") === l.loanId
                                ? "border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <div>
                              <div className="font-semibold text-slate-800">
                                Sewa Buku: {l.bookTitle}
                              </div>
                              <div className="text-slate-500 font-mono">
                                Kode Loan: {l.loanCode}
                              </div>
                            </div>
                            <span className="font-bold text-indigo-600">
                              Rp{" "}
                              {Number(l.remainingAmount).toLocaleString(
                                "id-ID",
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metode Pembayaran */}
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

                  {/* Input Nominal Bayar */}
                  <FormField
                    control={form.control}
                    name="amountPaid"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-medium">
                          Nominal Diterima / Uang Bayar (Rp){" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            disabled={isLoading || !selectedItem}
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

                {/* Kolom Kanan: Live Calculation Summary */}
                <div className="lg:col-span-5 bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-800 font-semibold">
                      <Calculator className="w-4 h-4 text-indigo-600" />
                      Kalkulasi Pembayaran
                    </div>

                    {selectedMember && selectedItem ? (
                      <div className="space-y-2.5 text-sm">
                        <div className="flex justify-between text-slate-600">
                          <span>Anggota:</span>
                          <span className="font-semibold text-slate-900">
                            {selectedMember.name}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Tagihan Dipilih:</span>
                          <span className="font-medium text-slate-900 truncate max-w-[180px]">
                            {selectedItem.title}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600 pt-2 border-t">
                          <span>Total Tagihan/Piutang:</span>
                          <span className="font-bold text-slate-900">
                            Rp {targetDebt.toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Nominal Dibayar:</span>
                          <span className="font-semibold text-indigo-600">
                            Rp {parsedPaid.toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-xs text-slate-400">
                        Pilih anggota & item tagihan terlebih dahulu.
                      </div>
                    )}
                  </div>

                  {/* Box Kembalian & Sisa */}
                  <div className="pt-3 border-t border-slate-200 space-y-3">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-semibold text-emerald-800">
                          UANG KEMBALIAN:
                        </span>
                        <span className="text-xl font-black text-emerald-700">
                          Rp {changeAmount.toLocaleString("id-ID")}
                        </span>
                      </div>
                      {remainingDebtAfter > 0 && (
                        <div className="flex justify-between items-baseline text-xs text-rose-600 pt-1 border-t border-emerald-200/60">
                          <span>Sisa Piutang Belum Lunas:</span>
                          <span className="font-bold">
                            Rp {remainingDebtAfter.toLocaleString("id-ID")}
                          </span>
                        </div>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading || !selectedItem}
                      className="w-full gap-2 py-2.5 text-sm bg-slate-900 hover:bg-slate-800 text-white"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {isLoading ? "Memproses..." : "Proses Pembayaran"}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Modal Struk Pembayaran Kasir */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Struk Pembayaran Kasir</DialogTitle>
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
                    Bukti Pembayaran Kasir
                  </p>
                </div>

                <div className="text-center py-2 bg-slate-50 rounded-md border border-slate-200">
                  <span className="text-xs text-slate-500 uppercase tracking-widest block">
                    No. Transaksi
                  </span>
                  <span className="text-lg font-black font-mono text-slate-900 tracking-wider">
                    TRX-{receiptData.paymentCode}
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
                    <span className="text-slate-500">Jenis Transaksi:</span>
                    <span className="font-semibold">
                      {receiptData.paymentType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Metode Bayar:</span>
                    <span className="font-semibold">
                      {receiptData.paymentMethod}
                    </span>
                  </div>
                </div>

                <div className="text-xs space-y-1.5 border-b pb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Piutang:</span>
                    <span>
                      Rp {receiptData.targetTotalDebt.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Uang Diterima:</span>
                    <span className="font-semibold">
                      Rp {receiptData.amountPaid.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold text-sm pt-1">
                    <span>KEMBALIAN:</span>
                    <span>
                      Rp {receiptData.changeAmount.toLocaleString("id-ID")}
                    </span>
                  </div>
                  {receiptData.nextRemainingDebt > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold pt-1">
                      <span>Sisa Piutang Belum Lunas:</span>
                      <span>
                        Rp{" "}
                        {receiptData.nextRemainingDebt.toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-center pt-2 text-[11px] text-slate-500">
                  <p className="font-semibold text-slate-700">
                    Terima Kasih Atas Pembayaran Anda!
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
