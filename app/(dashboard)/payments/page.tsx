import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PaymentClient } from "./payment-client";

export const metadata = {
  title: "Kasir & Pembayaran | Perpustakaan Arunika",
};

export default async function PaymentsPage() {
  const session = await auth();

  if (!session || !session.user?.id) {
    redirect("/login");
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Kasir Pembayaran Piutang & Denda
        </h1>
        <p className="text-sm text-slate-500">
          Kelola pembayaran kasir, kalkulasi otomatis kembalian, dan sisa
          tagihan anggota.
        </p>
      </div>

      <PaymentClient />
    </div>
  );
}
