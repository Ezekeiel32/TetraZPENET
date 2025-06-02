
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";
import { Toaster } from "@/components/ui/toaster";
// Import the new dynamic wrapper client component
import DynamicChakraWrapper from "@/components/providers/DynamicChakraWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TetraZPE.com",
  description: "Quantum ZPE Network Analysis & Training Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head />
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}>
        {/* Use the new DynamicChakraWrapper component */}
        <DynamicChakraWrapper>
          <AppLayout>{children}</AppLayout>
          <Toaster />
        </DynamicChakraWrapper>
      </body>
    </html>
  );
}
