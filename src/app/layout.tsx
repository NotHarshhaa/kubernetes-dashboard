import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/contexts/language-context";
import { AuthProvider } from "@/contexts/auth-context";
import { ToastProvider } from "@/contexts/toast-context";
import { Toaster } from "react-hot-toast";
import { cn } from "@/lib/utils";

const instrumentSans = Instrument_Sans({subsets:['latin'],variable:'--font-sans'});

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

import { TooltipProvider } from "@/components/ui/tooltip";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", instrumentSans.variable)}>
      <body className={`${inter.variable} font-sans antialiased`}>
        <TooltipProvider>
          <ToastProvider>
            <AuthProvider>
              <LanguageProvider>
                {children}
              </LanguageProvider>
            </AuthProvider>
          </ToastProvider>
          <Toaster position="top-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}
