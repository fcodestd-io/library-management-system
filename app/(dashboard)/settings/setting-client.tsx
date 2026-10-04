"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Save, Settings2, ShieldAlert, Clock, Banknote } from "lucide-react";

import { Button } from "@/components/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { settingsSchema, SettingsFormValues } from "@/lib/validations/setting";
import { updateSettings } from "@/actions/settings";

export function SettingsClient({ initialData }: { initialData: any }) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      loanPricePerDay: Number(initialData.loanPricePerDay) || 0,
      maximumLoanDays: initialData.maximumLoanDays || 7,
      maximumActiveLoans: initialData.maximumActiveLoans || 3,
      dailyFineRate: Number(initialData.dailyFineRate) || 0,
      damageCompensationRate: Number(initialData.damageCompensationRate) || 0,
      lostBookCompensationRate:
        Number(initialData.lostBookCompensationRate) || 0,
    },
  });

  const onSubmit = async (values: SettingsFormValues) => {
    setIsLoading(true);
    const res = await updateSettings(initialData.id, values);
    setIsLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Pengaturan perpustakaan berhasil diperbarui!");
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 max-w-4xl"
      >
        {/* Card 1: Tarif & Ketentuan Sewa */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Banknote className="w-5 h-5 text-indigo-600" /> Aturan Sewa &
              Peminjaman
            </CardTitle>
            <CardDescription>
              Tentukan biaya sewa harian dan batas maksimum peminjaman untuk
              anggota perpustakaan.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="loanPricePerDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Biaya Sewa / Hari (Rp)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maximumLoanDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maksimal Durasi (Hari)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maximumActiveLoans"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maksimal Buku Dipinjam</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Card 2: Denda & Kompensasi Kerusakan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" /> Tarif Denda &
              Ganti Rugi
            </CardTitle>
            <CardDescription>
              Atur denda keterlambatan pengembalian serta kompensasi atas
              kerusakan atau kehilangan buku.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="dailyFineRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Denda Keterlambatan / Hari (Rp)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="damageCompensationRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ganti Rugi Rusak (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription className="text-[11px]">
                    % dari nilai buku asli.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lostBookCompensationRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ganti Rugi Hilang (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription className="text-[11px]">
                    % dari nilai buku asli.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading} className="gap-2">
            <Save className="w-4 h-4" />{" "}
            {isLoading ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
