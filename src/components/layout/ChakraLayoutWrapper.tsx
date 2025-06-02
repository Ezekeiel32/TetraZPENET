"use client";

import { ChakraProviders } from "@/components/providers/chakra-client";
import React from "react";

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
