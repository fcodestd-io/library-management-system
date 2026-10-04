import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  // Membaca role dari token sesi
  const role = (req.auth?.user as any)?.role;

  // Halaman login ada di root "/"
  const isAuthPage = nextUrl.pathname === "/";

  // 1. Jika belum login dan mencoba akses halaman selain login, lempar ke "/"
  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // 2. Jika sudah login tapi mencoba ke halaman login "/", lempar ke "/dashboard"
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // 3. RBAC (Role-Based Access Control)
  // Rute yang hanya boleh diakses oleh OWNER
  const ownerOnlyRoutes = ["/users", "/settings"];

  const isTryingToAccessOwnerRoute = ownerOnlyRoutes.some((route) =>
    nextUrl.pathname.startsWith(route),
  );

  // Jika role nya STAFF dan mencoba akses rute OWNER, lempar kembali ke dashboard
  if (isTryingToAccessOwnerRoute && role === "STAFF") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

// Matcher menentukan file mana saja yang harus melewati middleware ini
// Kita abaikan file statis, API NextAuth, favicon, dan gambar lokal
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.png|arunika-logo.png).*)",
  ],
};
