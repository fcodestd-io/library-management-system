import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoanClient } from "./loan-client";

export const metadata = {
  title: "Sirkulasi Peminjaman | Perpustakaan Arunika",
};

export default async function LoansPage() {
  const session = await auth();

  if (!session || !session.user?.id) {
    redirect("/login");
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Sirkulasi Peminjaman Buku
        </h1>
        <p className="text-sm text-slate-500">
          Proses peminjaman buku baru untuk anggota perpustakaan.
        </p>
      </div>

      <LoanClient userId={session.user.id} />
    </div>
  );
}
