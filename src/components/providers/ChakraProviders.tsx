// src/components/providers/ChakraProviders.tsx
"use client";

import { CacheProvider } from '@chakra-ui/next-js';
import { ChakraProvider } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface ChakraProvidersProps {
  children: ReactNode;
}

// This component ensures ChakraProvider is only rendered on the client side.
export default function ChakraProviders({ children }: ChakraProvidersProps) {
  // Pass an empty object as the theme to ChakraProvider.
  // This ensures it has a theme prop, even if minimal.
  return (
    <CacheProvider>
      <ChakraProvider theme={{}}>
        {children}
      </ChakraProvider>
    </CacheProvider>
  );
}
