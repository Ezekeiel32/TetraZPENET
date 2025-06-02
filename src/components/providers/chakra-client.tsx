
"use client";

import { CacheProvider } from '@chakra-ui/next-js';
import { ChakraProvider } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface ChakraProvidersProps {
  children: ReactNode;
}

// Define a theme that is minimal but includes potentially essential top-level keys.
const veryMinimalTheme = {
  // Essential for theme context
  _config: {
    cssVarPrefix: 'chakra', // Default prefix
  },
  // Often accessed for color mode
  config: {
    initialColorMode: 'light' as 'light' | 'dark' | 'system',
    useSystemColorMode: false,
    // cssVarPrefix is often duplicated here in some theme structures
  },
  // Direction is fundamental
  direction: 'ltr' as 'ltr' | 'rtl',
  // Breakpoints are core to responsive design
  breakpoints: {
    sm: '30em',
    md: '48em',
    lg: '62em',
    xl: '80em',
    '2xl': '96em',
  },
  // Other scales that might be checked for existence, even if empty
  colors: {},
  fonts: {},
  fontSizes: {},
  fontWeights: {},
  letterSpacings: {},
  lineHeights: {},
  radii: {},
  shadows: {},
  sizes: {},
  space: {},
  zIndices: {},
  borders: {},
  components: {}, // Component styles might be looked up
  styles: { global: {} }, // Global styles
  layerStyles: {},
  textStyles: {},
  transition: { duration: {}, easing: {} }, // Transitions are often used
};

export default function ChakraProviders({ children }: ChakraProvidersProps) {
  return (
    <CacheProvider>
      <ChakraProvider theme={veryMinimalTheme}>
        {children}
      </ChakraProvider>
    </CacheProvider>
  );
}
