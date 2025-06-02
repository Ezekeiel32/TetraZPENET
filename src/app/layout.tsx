
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";
import { Toaster } from "@/components/ui/toaster";
// Import the new dynamic wrapper client component
import ChakraLayoutWrapper from "@/components/layout/ChakraLayoutWrapper";
import { ColorModeScript } from "@chakra-ui/react"; // Import ColorModeScript

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
      <body>
        {/* Add ColorModeScript here */}
        <ColorModeScript initialColorMode="dark" />
        {/* Use the new ChakraLayoutWrapper component */}
        <ChakraLayoutWrapper>
          <AppLayout>{children}</AppLayout>
          <Toaster />
        </ChakraLayoutWrapper>
      </body>
    </html>
  );
}
