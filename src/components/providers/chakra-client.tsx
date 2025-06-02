// src/components/providers/chakra-client.tsx
"use client";

import { CacheProvider } from '@chakra-ui/next-js';
import { ChakraProvider } from '@chakra-ui/react'; // Removed extendTheme import
import type { ReactNode } from 'react';

interface ChakraProvidersProps {
  children: ReactNode;
}

// This component ensures ChakraProvider is only rendered on the client side.
export default function ChakraProviders({ children }: ChakraProvidersProps) {
  return (
    <CacheProvider>
      {/* Use ChakraProvider without a theme prop */}
      <ChakraProvider>
        {children}
      </ChakraProvider>
    </CacheProvider>
  );
}
