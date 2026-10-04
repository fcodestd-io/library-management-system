"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Tags,
  Box,
  BookOpen,
  Handshake,
  Receipt,
  CreditCard,
  FileBarChart,
  Settings,
  LogOut,
  Menu,
  Library,
  UserCog,
  Undo2, // Tambahan icon untuk User Master
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import Image from "next/image";

// Struktur Menu yang dikelompokkan dan dilabeli role
const menuGroups = [
  {
    label: "Main",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["OWNER", "STAFF"],
      },
    ],
  },
  {
    label: "Master Data",
    items: [
      { name: "User", href: "/users", icon: UserCog, roles: ["OWNER"] }, // Hanya Owner
      {
        name: "Member",
        href: "/members",
        icon: Users,
        roles: ["OWNER", "STAFF"],
      }, // Keduanya
      {
        name: "Category",
        href: "/categories",
        icon: Tags,
        roles: ["OWNER", "STAFF"],
      },
      {
        name: "Room & Rack",
        href: "/rooms",
        icon: Box,
        roles: ["OWNER", "STAFF"],
      },
      {
        name: "Book & Copy",
        href: "/books",
        icon: BookOpen,
        roles: ["OWNER", "STAFF"],
      },
    ],
  },
  {
    label: "Transaction",
    items: [
      {
        name: "Peminjaman",
        href: "/loans",
        icon: Handshake,
        roles: ["OWNER", "STAFF"],
      },
      {
        name: "Pengembalian", // Atau "Returns"
        href: "/returns",
        icon: Undo2, // Atau RotateCcw / CornerUpLeft (pilih dari lucide-react)
        roles: ["OWNER", "STAFF"],
      },
      {
        name: "Payment",
        href: "/payments",
        icon: CreditCard,
        roles: ["OWNER", "STAFF"],
      },
    ],
  },
  {
    label: "Report",
    items: [
      {
        name: "Report",
        href: "/reports",
        icon: FileBarChart,
        roles: ["OWNER", "STAFF"],
      },
    ],
  },
  {
    label: "Configuration",
    items: [
      { name: "Setting", href: "/settings", icon: Settings, roles: ["OWNER"] }, // Hanya Owner
    ],
  },
];

export function Sidebar({
  userName,
  role,
}: {
  userName: string;
  role: string;
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const NavContent = () => (
    <div className="flex h-full flex-col bg-slate-900 text-white">
      {/* Header Sidebar */}
      <div className="flex items-center gap-3 p-6 border-b border-slate-800 shrink-0">
        <div className="relative w-12 h-12 bg-white rounded-md p-0.5">
          <Image
            src="/arunika-logo.png"
            alt="Logo"
            fill
            className="object-contain rounded-sm"
          />
        </div>
        <span className="text-lg font-bold tracking-tight">ArunikaLibrary</span>
      </div>

      {/* Navigasi Scrollable dengan custom scrollbar */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll py-4 px-4 space-y-6">
        {menuGroups.map((group) => {
          // Filter item berdasarkan role user yang login
          const filteredItems = group.items.filter((item) =>
            item.roles.includes(role),
          );

          // Jika setelah difilter tidak ada menu (misal menu Configuration untuk STAFF), sembunyikan labelnya
          if (filteredItems.length === 0) return null;

          return (
            <div key={group.label} className="space-y-2">
              {group.label !== "Main" && (
                <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase px-1">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {filteredItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                    >
                      <span
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                          isActive
                            ? "bg-indigo-600 text-white font-medium shadow-sm"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white",
                        )}
                      >
                        <Icon className="w-[18px] h-[18px]" />
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer Profil */}
      <div className="p-4 border-t border-slate-800 shrink-0">
        <div className="mb-4 px-3">
          <p className="text-sm font-medium text-white truncate">{userName}</p>
          <p className="text-xs text-slate-400">{role}</p>
        </div>
        <Button
          variant="destructive"
          className="w-full justify-start gap-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border-0"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed) */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-50">
        <NavContent />
      </aside>

      {/* Mobile Sidebar Toggle (Fixed top) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <Library className="w-6 h-6 text-indigo-600" />
          <span className="text-lg font-bold">Arunika</span>
        </div>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <Menu className="w-6 h-6" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-r-slate-800">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
