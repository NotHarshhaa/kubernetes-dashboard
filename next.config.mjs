/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standalone output for Docker containers, but allow default serverless output on Vercel
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
  // Treat @kubernetes/client-node as external on the server to prevent bundler/serverless trace issues
  serverExternalPackages: ["@kubernetes/client-node"],
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
