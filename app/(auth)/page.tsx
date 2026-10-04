"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { z } from "zod";
import { toast } from "sonner";
import { Library, Mail, Lock, ShieldCheck, UserCog, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";

// Skema Validasi Zod
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export default function LoginPage() {
  const router = useRouter();

  // State form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  // Data Demo Users
  const demoUsers = [
    {
      role: "Owner",
      email: "owner@arunika.com",
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      role: "Petugas 1",
      email: "petugas1@arunika.com",
      icon: <UserCog className="w-4 h-4" />,
    },
    {
      role: "Petugas 2",
      email: "petugas2@arunika.com",
      icon: <Users className="w-4 h-4" />,
    },
  ];
  const demoPassword = "password123";

  // Fungsi Autofill
  const handleAutoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrors({});
    toast.info(`Data ${demoEmail} otomatis diisi.`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const validationResult = loginSchema.safeParse({ email, password });

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      setErrors({
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      });
      setIsLoading(false);
      return;
    }

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      toast.error("Email atau password yang Anda masukkan salah.");
      setIsLoading(false);
    } else {
      toast.success("Login berhasil! Mengarahkan ke dashboard...");
      router.push("/dashboard");
    }
  };

  return (
    // h-screen dan overflow-hidden memastikan max 100% viewport dan tidak ada scroll
    <div className="h-screen w-full flex overflow-hidden bg-slate-50">
      {/* BAGIAN KIRI: Panel Branding (Lebih padat untuk layar 14") */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 text-white flex-col justify-between p-8 xl:p-12">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white p-0.5 shadow-sm">
            <Image
              src="/arunika-logo.png"
              alt="Logo Perpustakaan Arunika"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Perpustakaan Arunika
          </span>
        </div>

        <div className="space-y-4 max-w-lg">
          <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight">
            Library Management System
          </h1>
          <p className="text-slate-300 text-sm xl:text-base leading-relaxed">
            Sistem manajemen operasional perpustakaan mandiri. Dirancang khusus
            untuk mempermudah inventarisasi fisik buku, peminjaman anggota, dan
            operasional harian.
          </p>
        </div>

        <div className="text-xs text-slate-500">
          &copy; {new Date().getFullYear()} FadCode Portfolio Project.
        </div>
      </div>

      {/* BAGIAN KANAN: Form Login */}
      <div className="w-full lg:w-1/2 h-full flex flex-col justify-center items-center p-4">
        {/* Kontainer form diperkecil jarak vertikalnya (space-y-4) */}
        <div className="w-full max-w-md space-y-4">
          {/* Header Mobile */}
          <div className="flex items-center gap-2 lg:hidden mb-4 justify-center">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Library className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">
              Perpustakaan Arunika
            </span>
          </div>

          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold">
                Selamat Datang
              </CardTitle>
              <CardDescription className="text-xs">
                Silakan masuk menggunakan akun Owner atau Petugas Anda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs">
                    Alamat Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="nama@arunika.com"
                      className={`pl-9 h-9 text-sm ${errors.email ? "border-red-500" : ""}`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-[10px] text-red-500">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs">
                    Kata Sandi
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className={`pl-9 h-9 text-sm ${errors.password ? "border-red-500" : ""}`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-[10px] text-red-500">
                      {errors.password}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-9 text-sm mt-2"
                  disabled={isLoading}
                >
                  {isLoading ? "Memproses..." : "Masuk"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Akses Cepat / Demo Users */}
          <div className="pt-2 border-t border-slate-200">
            <p className="text-[11px] text-center text-slate-500 mb-2">
              Akses Cepat (Password:{" "}
              <strong className="font-mono text-slate-700 bg-slate-100 px-1 rounded">
                {demoPassword}
              </strong>
              )
            </p>

            {/* Grid dibuat lebih padat */}
            <div className="grid gap-1.5">
              {demoUsers.map((user) => (
                <button
                  key={user.email}
                  type="button"
                  onClick={() => handleAutoFill(user.email)}
                  className="flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded-md hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-2">
                    <div className="text-slate-400 group-hover:text-indigo-600 transition-colors">
                      {user.icon}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-slate-900 group-hover:text-indigo-900 leading-tight">
                        {user.role}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Gunakan
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
