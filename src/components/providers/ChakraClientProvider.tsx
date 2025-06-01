
"use client";

import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import ChakraProvider with SSR turned off
const ChakraProviderClient = dynamic(
  () => import("@chakra-ui/react").then((mod) => mod.ChakraProvider),
  { ssr: false }
);

// No explicit theme object is defined or passed;
// ChakraProvider will use its internal default theme.

interface ChakraClientProviderProps {
  children: ReactNode;
}

export default function ChakraClientProvider({ children }: ChakraClientProviderProps) {
  // ChakraProviderClient will only render on the client-side.
  // By not passing a 'theme' prop, ChakraProvider uses its default theme.
  return <ChakraProviderClient>{children}</ChakraProviderClient>;
}
