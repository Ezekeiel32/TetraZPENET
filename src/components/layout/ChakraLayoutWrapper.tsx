// src/components/layout/ChakraLayoutWrapper.tsx
"use client";

import dynamic from "next/dynamic";
import React from "react";

const ChakraProviders = dynamic(
  () => import("@/components/providers/chakra-client"),
  { ssr: false }
);

interface ChakraLayoutWrapperProps {
  children: React.ReactNode;
}

export default function ChakraLayoutWrapper({ children }: ChakraLayoutWrapperProps) {
  // Temporary polyfill for the 'sys' module
  if (typeof window !== 'undefined' && !(window as any).sys) {
    (window as any).sys = {};
  }

  return (
    <ChakraProviders>
      {children}
    </ChakraProviders>
  );
}
