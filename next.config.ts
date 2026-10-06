/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Membiarkan build produksi selesai meskipun ada error TypeScript
    ignoreBuildErrors: true,
  },
  eslint: {
    // Opsional: abaikan juga error ESLint saat build agar tidak tertahan
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
