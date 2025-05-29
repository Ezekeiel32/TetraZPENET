
"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Atom } from 'lucide-react'; // Or another suitable icon

// Dynamically import the p5 sketch component to ensure it's client-side only
const ZPEParticleSketch = dynamic(
  () => import('@/components/visualizations/ZPEParticleSketch'),
  { 
    ssr: false, 
    loading: () => (
      <div className="h-[600px] w-full flex items-center justify-center bg-muted rounded-md border shadow-lg">
        <p>Loading ZPE Particle Simulation...</p>
      </div>
    ) 
  }
);

export default function ZPEParticleSimulationPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // Component has mounted, safe to render client-side only components
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Atom className="h-7 w-7 text-primary" /> {/* Example Icon */}
            ZPE Particle Physics Simulation
          </CardTitle>
          <CardDescription>
            An interactive 3D visualization exploring concepts of Zero-Point Energy, particle interactions,
            a scanning system, and tetrahedral memory modules. This is a creative interpretation and
            demonstration of dynamic particle systems.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-1">
            The simulation features various particle types (Quarks, Leptons, Gluons) with unique properties,
            ZPE-induced perturbations, and a dynamic tetrahedral memory structure that interacts with scanned particles.
          </p>
          <p className="text-sm text-muted-foreground">
            Use your mouse to orbit and explore the 3D scene.
          </p>
        </CardContent>
      </Card>

      <div className="w-full h-[600px] md:h-[700px] flex items-center justify-center">
        {mounted ? (
          <ZPEParticleSketch />
        ) : (
          <div className="h-[600px] w-full flex items-center justify-center bg-muted rounded-md border shadow-lg">
            <p>Initializing 3D Sketch...</p>
          </div>
        )}
      </div>
    </div>
  );
}
