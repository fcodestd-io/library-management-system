// app/(dashboard)/loading.tsx
import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="h-[70vh] w-full flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      <p className="text-sm font-medium text-slate-500">Memuat halaman...</p>
    </div>
  );
}
