import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Kubernetes Dashboard",
  description: "Modern Kubernetes cluster management and monitoring dashboard",
  keywords: ["kubernetes", "dashboard", "monitoring", "cluster", "containers"],
  authors: [{ name: "Kubernetes Dashboard Team" }],
  icons: {
    icon: "/kubernetes-icon.svg",
    shortcut: "/kubernetes-icon.svg",
    apple: "/kubernetes-icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#326ce5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
