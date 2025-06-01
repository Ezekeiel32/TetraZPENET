
"use client";

import type { ReactNode } from 'react';
import { CacheProvider } from '@chakra-ui/next-js';
import { ChakraProvider } from '@chakra-ui/react';

// No explicit theme object is defined or passed;
// ChakraProvider will use its internal default theme or one provided via context.

interface ChakraClientProviderProps {
  children: ReactNode;
}

export default function ChakraClientProvider({ children }: ChakraClientProviderProps) {
  // Wrap ChakraProvider with CacheProvider for Next.js App Router compatibility
  return (
    <CacheProvider>
      <ChakraProvider>
        {children}
      </ChakraProvider>
    </CacheProvider>
  );
}
