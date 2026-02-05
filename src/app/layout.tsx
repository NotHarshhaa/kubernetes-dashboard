import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
