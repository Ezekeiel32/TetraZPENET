// src/components/providers/chakra-client.tsx
"use client";

import { CacheProvider } from '@chakra-ui/next-js';
import { ChakraProvider } from '@chakra-ui/react';
import { theme as defaultChakraTheme } from '@chakra-ui/theme'; // Import the default theme
import type { ReactNode } from 'react';

interface ChakraProvidersProps {
  children: ReactNode;
}

// This component ensures ChakraProvider is only rendered on the client side.
export default function ChakraProviders({ children }: ChakraProvidersProps) {
  // Explicitly pass the default theme from @chakra-ui/theme
  return (
    <CacheProvider>
      <ChakraProvider theme={defaultChakraTheme}> 
        {children}
      </ChakraProvider>
    </CacheProvider>
  );
}
