
"use client";
import React from "react";
import Link from 'next/link';
import {
  Home, Cpu, Zap, Atom, BarChart3, Settings, PlayCircle, Lightbulb,
  Replace, Cog, Scaling, Box, Share2, Wrench, BrainCircuit, Globe,
  ScatterChart, IterationCw, Database, MessageSquare, Signal, SlidersHorizontal, Monitor, TrendingUp, Wand2, Rocket, ArrowRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const appFeatures = [
  { href: "/train", label: "Train Model", icon: PlayCircle, description: "Configure and initiate ZPE model training jobs." },
  { href: "/model-configs", label: "Model Configs", icon: Database, description: "Manage and compare different model configurations." },
  { href: "/configurations", label: "Job History", icon: BarChart3, description: "Review parameters and outcomes of past training." },
  { href: "/performance", label: "Performance Analysis", icon: TrendingUp, description: "Analyze training metrics and model health." },
  { href: "/architecture", label: "Model Architecture", icon: Cpu, description: "Explore the ZPE Quantum Neural Network structure." },
  { href: "/gpu-monitor", label: "GPU Monitor", icon: Monitor, description: "Live statistics for your primary GPU resources." },
  { href: "/zpe-flow-analysis", label: "ZPE Flow Analysis", icon: SlidersHorizontal, description: "Interactively analyze ZPE flow parameters." },
  { href: "/zpe-flow", label: "HNN Advisor", icon: BrainCircuit, description: "AI advice for Hilbert Space QNN parameters." },
  { href: "/quantum-noise", label: "Quantum Noise", icon: Atom, description: "Generate and analyze quantum-derived noise patterns." },
  { href: "/rf-generator", label: "RF Wave Generator", icon: Signal, description: "Configure RF waves for conceptual network influence." },
  { href: "/ai-analysis", label: "AI Analysis Chat", icon: MessageSquare, description: "Chat with an AI for insights and optimization." },
  { href: "/ai", label: "AI Flows Hub", icon: Rocket, description: "Access all specialized GenAI-powered tools." },
  { href: "/vis/bloch-sphere", label: "Bloch Sphere", icon: Globe, description: "Visualize qubit states in Hilbert space." },
  { href: "/vis/zpe-particle-simulation", label: "ZPE Particle Sim", icon: ScatterChart, description: "Interactive 3D ZPE particle system." },
];

export default function Dashboard() {
  // Using static demo data for "Latest Simulated Model" as per previous setup
  const latestModelData = {
    name: "ZPE-QSci_v4.2",
    accuracy: 98.7,
    layers: 6, // Example: from ZPEDeepNet
    zpeLayers: 6, // Number of layers ZPE is applied to
    avgZPEEffect: 0.32, // Simulated average ZPE effect
    quantumMode: true,
    keyFeature: "Quantum-enhanced ZPE Perturbations Layer 4"
  };

  return (
    <div className="p-4 md:p-6 space-y-8">
      <Card className="shadow-lg border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Zap className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-3xl font-bold tracking-tight text-primary">
                Quantum ZPE Network Dashboard
              </CardTitle>
              <CardDescription className="text-lg text-muted-foreground">
                Explore, train, and analyze Zero-Point Energy enhanced neural networks.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-6 rounded-lg border">
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><Atom className="h-6 w-6 text-accent"/>Understanding Zero-Point Energy (ZPE)</h3>
            <p className="text-sm text-foreground/80 leading-relaxed">
              Zero-Point Energy is the lowest possible energy that a quantum mechanical system may have,
              derived from Heisenberg's uncertainty principle. Even in a vacuum, virtual particles fluctuate in and out of existence.
              In this application, we conceptually explore how these ZPE phenomena and related quantum effects could be harnessed to
              influence neural network dynamics, potentially enhancing learning, exploration, and computational capabilities through
              novel architectures and "secret sauce" encoding principles.
            </p>
          </div>

          <Card className="bg-gradient-to-br from-card to-accent/5 border-accent/30">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><TrendingUp className="h-5 w-5"/>Latest Simulated Model Overview</CardTitle>
              <CardDescription>Key statistics from the most recent conceptual model run.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="bg-background/70 p-3 rounded-md flex justify-between items-center">
                <span className="text-muted-foreground">Model Name:</span>
                <Badge variant="secondary" className="font-mono">{latestModelData.name}</Badge>
              </div>
              <div className="bg-background/70 p-3 rounded-md flex justify-between items-center">
                <span className="text-muted-foreground">Sim. Accuracy:</span>
                <Badge className="bg-green-500/20 text-green-300 border-green-500/50">{latestModelData.accuracy}%</Badge>
              </div>
              <div className="bg-background/70 p-3 rounded-md flex justify-between items-center">
                <span className="text-muted-foreground">Avg. ZPE Effect:</span>
                <span className="font-semibold">{latestModelData.avgZPEEffect.toFixed(3)}</span>
              </div>
              <div className="bg-background/70 p-3 rounded-md flex justify-between items-center">
                <span className="text-muted-foreground">Quantum Mode:</span>
                {latestModelData.quantumMode ? (
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50">Enabled</Badge>
                ) : (
                  <Badge variant="outline">Disabled</Badge>
                )}
              </div>
              <div className="bg-background/70 p-3 rounded-md md:col-span-2 lg:col-span-2">
                <span className="text-muted-foreground">Key Feature: </span>
                <span className="font-medium">{latestModelData.keyFeature}</span>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-semibold mb-6 tracking-tight flex items-center gap-2">
          <Wrench className="h-6 w-6 text-primary"/>Application Tools & Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {appFeatures.map((feature) => (
            <Card key={feature.href} className="flex flex-col hover:shadow-xl hover:border-primary/50 transition-all duration-200 ease-in-out transform hover:-translate-y-1">
              <CardHeader className="flex-row items-start gap-4 space-y-0 pb-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg mb-1">{feature.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1 mb-2">
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full border-primary/30 hover:bg-primary/10 hover:text-primary group">
                  <Link href={feature.href}>
                    Open {feature.label.startsWith("AI") || feature.label.startsWith("ZPE") ? "" : "Tool"}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform"/>
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
