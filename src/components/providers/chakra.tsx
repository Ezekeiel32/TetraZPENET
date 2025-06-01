
"use client";

import { CacheProvider } from '@chakra-ui/next-js';
import { ChakraProvider } from '@chakra-ui/react';
import type { ReactNode } from 'react';

// Removed extendTheme, withDefaultColorScheme, and withDefaultVariant imports
// as they were causing "export not found" errors.
// ChakraProvider will use its internal default theme.

interface ChakraProvidersProps {
  children: ReactNode;
}

export default function ChakraProviders({ children }: ChakraProvidersProps) {
  return (
    <CacheProvider>
      <ChakraProvider>
        {children}
      </ChakraProvider>
    </CacheProvider>
  );
}
