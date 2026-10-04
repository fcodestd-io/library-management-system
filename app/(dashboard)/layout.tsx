import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verifikasi sesi login
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        userName={session.user.name || "User"}
        role={(session.user as any).role || "STAFF"}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 pt-16 lg:pt-0 flex flex-col min-h-screen">
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
