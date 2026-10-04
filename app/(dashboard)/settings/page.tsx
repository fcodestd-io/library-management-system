import { getSettings } from "@/actions/settings";
import { SettingsClient } from "./setting-client";

export const metadata = {
  title: "Konfigurasi Sistem | Perpustakaan Arunika",
};

export default async function SettingsPage() {
  const { data, error } = await getSettings();

  if (error || !data) {
    return (
      <div className="p-4 text-rose-600 bg-rose-50 rounded-lg">
        {error || "Gagal memuat pengaturan."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Konfigurasi Perpustakaan
        </h1>
        <p className="text-sm text-slate-500">
          Atur parameter biaya, batasan transaksi, serta sanksi peminjaman buku.
        </p>
      </div>

      <SettingsClient initialData={data} />
    </div>
  );
}
