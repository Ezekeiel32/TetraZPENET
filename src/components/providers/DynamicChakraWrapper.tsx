
"use client";

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

// Dynamically import the actual ChakraProviders component (which itself is a client component)
// This is where ssr: false is correctly applied within a client component.
const ChakraClientProviders = dynamic(
  () => import('@/components/providers/chakra-client'), // Path to your existing Chakra providers setup
  { ssr: false }
);

interface DynamicChakraWrapperProps {
  children: ReactNode;
}

export default function DynamicChakraWrapper({ children }: DynamicChakraWrapperProps) {
  return <ChakraClientProviders>{children}</ChakraClientProviders>;
}
