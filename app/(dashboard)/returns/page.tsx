import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReturnClient } from "./return-client";

export const metadata = {
  title: "Sirkulasi Pengembalian | Perpustakaan Arunika",
};

export default async function ReturnsPage() {
  const session = await auth();

  if (!session || !session.user?.id) {
    redirect("/login");
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Sirkulasi Pengembalian Buku
        </h1>
        <p className="text-sm text-slate-500">
          Proses pengembalian buku, alokasi sanksi denda, dan pelunasan piutang
          peminjaman.
        </p>
      </div>

      <ReturnClient />
    </div>
  );
}
