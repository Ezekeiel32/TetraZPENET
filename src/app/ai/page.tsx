import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Replace, Cog, Scaling, Box, Share2, ArrowRight } from 'lucide-react';

const aiFlows = [
  { href: "/ai/implement-zpe", title: "Simulate ZPE", description: "Simulate Zero-Point Energy effects on model accuracy.", icon: Lightbulb },
  { href: "/ai/approximate-zpe", title: "Approximate Flow Parameter", description: "Dynamically approximate a ZPE flow parameter.", icon: Replace },
  { href: "/ai/adapt-zpe", title: "Adapt ZPE", description: "Adapt ZPE from PyTorch components for model performance.", icon: Cog },
  { href: "/ai/show-scaled-output", title: "Show Scaled Output", description: "Simulate pseudo-quantum circuit and show scaled output.", icon: Scaling },
  { href: "/ai/quantize-model", title: "Quantize Colab Model", description: "Generate code to quantize a PyTorch model from Colab.", icon: Box },
  { href: "/ai/extract-components", title: "Extract High-Gain Components", description: "Identify high-gain components for quantum applications.", icon: Share2 },
];

export default function AiFlowsPage() {
  return (
    <div className="container mx-auto p-4 md:p-6">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight text-primary">AI Powered Flows for Quantum ZPE Networks</CardTitle>
          <CardDescription className="text-lg">
            Explore various GenAI-driven tools to simulate, analyze, and optimize components of your Zero-Point Energy neural networks.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {aiFlows.map((flow) => (
          <Card key={flow.href} className="flex flex-col hover:shadow-lg transition-shadow">
            <CardHeader className="flex-row items-start gap-4 space-y-0 pb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <flow.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle>{flow.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground">{flow.description}</p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={flow.href}>
                  Open Flow <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
