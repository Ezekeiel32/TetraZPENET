// src/components/dashboard/ModelSummary.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircuitBoard, Zap, Shield, Atom } from "lucide-react";

export default function ModelSummary() {
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>Model Architecture</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <CircuitBoard className="h-8 w-8 text-blue-500 mt-0.5" />
            <div>
              <h3 className="font-medium">Network Structure</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Convolutional architecture with 4 conv layers (64-128-256-512 channels) and 3 fully connected layers (2048-512-10).
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Zap className="h-8 w-8 text-purple-500 mt-0.5" />
            <div>
              <h3 className="font-medium">ZPE Flow Layers</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Zero-Point Energy flow applied after each layer with adjustable momentum, strength, and coupling parameters.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Shield className="h-8 w-8 text-green-500 mt-0.5" />
            <div>
              <h3 className="font-medium">Regularization</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Using SE blocks, dropout (0.25-0.05), skip connections, and label smoothing (0.03) for better generalization.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Atom className="h-8 w-8 text-orange-500 mt-0.5" />
            <div>
              <h3 className="font-medium">Quantum Integration</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Quantum noise is specifically applied to the 4th layer using a 32-qubit quantum circuit simulation.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
