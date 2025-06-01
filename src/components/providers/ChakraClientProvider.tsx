
"use client";

import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import ChakraProvider with SSR turned off
const ChakraProviderClient = dynamic(
  () => import("@chakra-ui/react").then((mod) => mod.ChakraProvider),
  { ssr: false }
);

interface ChakraClientProviderProps {
  children: ReactNode;
}

export default function ChakraClientProvider({ children }: ChakraClientProviderProps) {
  // ChakraProviderClient will only render on the client-side
  return <ChakraProviderClient>{children}</ChakraProviderClient>;
}
