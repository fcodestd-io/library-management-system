"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Search, Plus, Edit, Trash2, Loader2, History } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { memberSchema, MemberFormValues } from "@/lib/validations/member";
import { createMember, updateMember, deleteMember } from "@/actions/members";
import { cn } from "@/lib/utils";

export function MemberClient({
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
  const [selectedMember, setSelectedMember] = useState<any>(null);
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
      router.push(`/members?${params.toString()}`, { scroll: false });
    });
  }, [debouncedSearch, searchParams, router]);

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      name: "",
      countryCode: "62",
      phoneNumber: "",
      memberType: "STUDENT",
      isActive: true,
    },
  });

  const watchName = useWatch({ control: form.control, name: "name" }) || "";
  const watchPhone =
    useWatch({ control: form.control, name: "phoneNumber" }) || "";

  const cleanName = watchName.replace(/\s+/g, "").toUpperCase();
  const phone4Digit =
    watchPhone.length >= 4 ? watchPhone.slice(-4) : watchPhone.padStart(4, "0");
  const generatedMemberCode = cleanName ? `${cleanName}#${phone4Digit}` : "";

  const handleOpenForm = (member?: any) => {
    if (member) {
      setSelectedMember(member);
      let country = "62";
      let phoneNum = member.phone;

      if (member.phone.startsWith("+62")) {
        country = "62";
        phoneNum = member.phone.replace("+62", "");
      } else {
        const match = member.phone.match(/^\+(\d{3})(\d+)$/);
        if (match) {
          country = match[1];
          phoneNum = match[2];
        }
      }

      form.reset({
        name: member.name,
        countryCode: country,
        phoneNumber: phoneNum,
        memberType: member.memberType || "STUDENT",
        isActive: member.status === "ACTIVE",
      });
    } else {
      setSelectedMember(null);
      form.reset({
        name: "",
        countryCode: "62",
        phoneNumber: "",
        memberType: "STUDENT",
        isActive: true,
      });
    }
    setIsFormOpen(true);
  };

  const onSubmit = async (values: MemberFormValues) => {
    setIsLoading(true);
    const payload = {
      ...values,
      phone: `+${values.countryCode}${values.phoneNumber}`,
    };

    const res = selectedMember
      ? await updateMember(selectedMember.id, payload, generatedMemberCode)
      : await createMember(payload, generatedMemberCode);

    setIsLoading(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success(
        `Member berhasil ${selectedMember ? "diperbarui" : "ditambahkan"}.`,
      );
      setIsFormOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMember) return;
    setIsLoading(true);
    const res = await deleteMember(selectedMember.id);
    setIsLoading(false);

    if (res.error) toast.error(res.error);
    else toast.success(res.message);

    setIsDeleteOpen(false);
  };

  const formatDisplayPhone = (phone: string) => {
    if (phone.startsWith("+62")) {
      return phone.replace(/^(\+62)(\d+)$/, "$1 - $2");
    }
    return phone.replace(/^(\+\d{3})(\d+)$/, "$1 - $2");
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    startTransition(() => {
      router.push(`/members?${params.toString()}`, { scroll: false });
    });
  };

  const formatMemberType = (type: string) => {
    switch (type) {
      case "STUDENT":
        return "Student";
      case "LECTURER":
        return "Pengajar";
      case "STAFF":
      default:
        return "Umum";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full max-w-sm flex items-center">
          <Search className="absolute left-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Cari nama atau ID member..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {isPending && (
            <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-indigo-500" />
          )}
        </div>
        <Button onClick={() => handleOpenForm()} className="gap-2">
          <Plus className="w-4 h-4" /> Tambah Member
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
              <TableHead>Member</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Kontak</TableHead>
              <TableHead className="text-center">Total Pinjam</TableHead>
              <TableHead className="text-right">Sisa Piutang</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-6 text-slate-500"
                >
                  Tidak ada member ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              data.map((member) => {
                const debt = Number(member.remainingDebt) || 0;
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="font-medium text-slate-900">
                        {member.name}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {member.memberCode}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                        {formatMemberType(member.memberType)}
                      </span>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatDisplayPhone(member.phone)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold">{member.totalLoans}</span>{" "}
                      kali
                    </TableCell>
                    {/* Kolom Sisa Piutang */}
                    <TableCell className="text-right font-mono">
                      <span
                        className={cn(
                          "px-2 py-1 text-xs rounded font-semibold",
                          debt > 0
                            ? "bg-rose-100 text-rose-700"
                            : "text-slate-600 bg-slate-100",
                        )}
                      >
                        Rp {debt.toLocaleString("id-ID")}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          "px-2 py-1 text-xs rounded-md font-medium",
                          member.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700",
                        )}
                      >
                        {member.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        title="Riwayat Pinjam"
                        disabled={isPending}
                        onClick={() => {
                          startTransition(() => {
                            router.push(`/members/${member.id}/history`);
                          });
                        }}
                      >
                        <History className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleOpenForm(member)}
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => {
                          setSelectedMember(member);
                          setIsDeleteOpen(true);
                        }}
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
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
              {selectedMember ? "Edit Member" : "Registrasi Member Baru"}
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

              <div className="space-y-2">
                <FormLabel>Nomor Telepon</FormLabel>
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="countryCode"
                    render={({ field }) => (
                      <FormItem className="w-20">
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2 text-slate-500">
                              +
                            </span>
                            <Input
                              {...field}
                              className="pl-6"
                              disabled={isLoading}
                              maxLength={3}
                              placeholder="62"
                            />
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            disabled={isLoading}
                            placeholder="812345678"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                {form.formState.errors.phoneNumber && (
                  <p className="text-[0.8rem] text-red-500">
                    {form.formState.errors.phoneNumber.message}
                  </p>
                )}
              </div>

              <FormItem>
                <FormLabel>Member Code (Otomatis)</FormLabel>
                <FormControl>
                  <Input
                    value={generatedMemberCode}
                    readOnly
                    className="bg-slate-100 font-mono font-medium focus-visible:ring-0"
                  />
                </FormControl>
                <p className="text-[11px] text-slate-500">
                  Dihasilkan dari nama tanpa spasi (huruf kapital) + # + 4 digit
                  terakhir telepon.
                </p>
              </FormItem>

              <FormField
                control={form.control}
                name="memberType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipe Member</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tipe..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="STUDENT">Siswa/Mahasiswa</SelectItem>
                        <SelectItem value="LECTURER">Dosen/Guru</SelectItem>
                        <SelectItem value="STAFF">Staf Umum</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <FormLabel>Status Member</FormLabel>
                      <p className="text-xs text-slate-500">
                        Member aktif diizinkan melakukan peminjaman buku.
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

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !generatedMemberCode}
                >
                  {isLoading ? "Memproses..." : "Simpan Data"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete / Inactive Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Jika <b>{selectedMember?.name}</b> memiliki riwayat pinjam, sistem
              otomatis mengubah statusnya menjadi <b>INACTIVE</b>. Jika belum
              pernah meminjam, data akan dihapus permanen.
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
