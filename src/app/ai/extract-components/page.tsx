"use client";
import { useState } from "react";
import { extractHighGainComponents, ExtractHighGainComponentsInput, ExtractHighGainComponentsOutput } from "@/ai/flows/extract-high-gain-components";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Share2, ListChecks } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
  modelArchitectureDescription: z.string().min(50, "Model architecture description seems too short."),
  performanceMetrics: z.string().min(50, "Performance metrics description seems too short."),
  quantumApplicationTarget: z.string().min(20, "Quantum application target description seems too short."),
});

export default function ExtractComponentsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ExtractHighGainComponentsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<ExtractHighGainComponentsInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      modelArchitectureDescription: "ZPEDeepNet: 4 Conv Blocks (64-128-256-512 channels) with ReLU, MaxPool, SEBlocks, and ZPE. 3 FC layers (2048-512-10). Skip connections present.",
      performanceMetrics: "Epoch 30: Val Acc 97.58%. ZPE Effects (avg per layer): [0.02, 0.015, 0.023, 0.08, 0.01, 0.02]. Layer 4 (Conv 512 channels) shows highest ZPE effect and sensitivity to quantum noise.",
      quantumApplicationTarget: "Targeting quantum-enhanced feature extraction for image classification, aiming to improve robustness against adversarial attacks by leveraging quantum-inspired noise patterns in high-gain layers.",
    },
  });

  const onSubmit = async (data: ExtractHighGainComponentsInput) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const output = await extractHighGainComponents(data);
      setResult(output);
      toast({ title: "Extraction Successful", description: `${output.highGainComponents.length} components identified.` });
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
      toast({ title: "Extraction Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
       <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Share2 className="h-6 w-6 text-primary" />Extract High-Gain Components</CardTitle>
          <CardDescription>
            Provide model architecture, performance metrics, and the target quantum application. The AI will identify high-gain components suitable for this quantum application.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle>Input Information</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="modelArchitectureDescription">Model Architecture Description</Label>
                <Controller name="modelArchitectureDescription" control={control} render={({ field }) => <Textarea {...field} rows={6} placeholder="Describe layer types, connections, parameters..." />} />
                {errors.modelArchitectureDescription && <p className="text-xs text-destructive">{errors.modelArchitectureDescription.message}</p>}
              </div>
              <div>
                <Label htmlFor="performanceMetrics">Performance Metrics</Label>
                <Controller name="performanceMetrics" control={control} render={({ field }) => <Textarea {...field} rows={6} placeholder="Detail accuracy, loss, ZPE effects per layer, etc." />} />
                {errors.performanceMetrics && <p className="text-xs text-destructive">{errors.performanceMetrics.message}</p>}
              </div>
              <div>
                <Label htmlFor="quantumApplicationTarget">Quantum Application Target</Label>
                <Controller name="quantumApplicationTarget" control={control} render={({ field }) => <Textarea {...field} rows={4} placeholder="Specific quantum application objectives and constraints." />} />
                {errors.quantumApplicationTarget && <p className="text-xs text-destructive">{errors.quantumApplicationTarget.message}</p>}
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Analyzing..." : "Extract Components"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Extraction Results</CardTitle></CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {result ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><ListChecks className="h-5 w-5"/>Identified High-Gain Components:</h3>
                  {result.highGainComponents.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 pl-4 bg-muted/30 p-3 rounded-md">
                      {result.highGainComponents.map((component, index) => (
                        <li key={index} className="text-sm">{component}</li>
                      ))}
                    </ul>
                  ): <p className="text-muted-foreground">No specific components identified with high gain based on input.</p>}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Justification:</h3>
                   <Alert>
                    <Share2 className="h-4 w-4"/>
                    <AlertTitle>AI Justification</AlertTitle>
                    <AlertDescription>
                       <ScrollArea className="h-[250px]">
                         {result.justification}
                       </ScrollArea>
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-10">Submit information to extract high-gain components.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
