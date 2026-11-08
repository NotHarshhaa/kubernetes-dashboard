/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emits a minimal self-contained server bundle to .next/standalone for small Docker images.
  output: "standalone",
  reactCompiler: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  experimental: {
    // Tree-shake barrel-file icon/chart libraries so only used icons ship in the client bundle.
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/dashboard/overview",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
