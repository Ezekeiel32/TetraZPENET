
"use client";

import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';

const ClientSideChakraProviders = dynamic(() => import('./chakra'), {
    ssr: false,
});

interface ChakraClientProviderProps {
  children: ReactNode;
}

export default function ChakraClientProvider({ children }: ChakraClientProviderProps) {
  return <ClientSideChakraProviders>{children}</ClientSideChakraProviders>;
}
