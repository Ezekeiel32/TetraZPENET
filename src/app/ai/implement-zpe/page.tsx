"use client";
import { useState } from "react";
import { implementZPESimulation, ImplementZPESimulationInput, ImplementZPESimulationOutput } from "@/ai/flows/implement-zpe";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Lightbulb } from "lucide-react";

const formSchema = z.object({
  baseAccuracy: z.coerce.number().min(0).max(100),
  epochsRatio: z.coerce.number().min(0).max(1),
  strengthParams: z.array(z.coerce.number().min(0).max(1)).min(1, "At least one strength param needed"),
  momentumParams: z.array(z.coerce.number().min(0).max(1)).min(1, "At least one momentum param needed"),
  noiseParams: z.array(z.coerce.number().min(0).max(1)).min(1, "At least one noise param needed"),
  quantumMode: z.boolean(),
});

export default function ImplementZPEPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImplementZPESimulationOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<ImplementZPESimulationInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      baseAccuracy: 90.0,
      epochsRatio: 0.5,
      strengthParams: [0.35, 0.33, 0.31, 0.60, 0.27, 0.50],
      momentumParams: [0.9, 0.85, 0.8, 0.75, 0.7, 0.65],
      noiseParams: [0.3, 0.28, 0.26, 0.35, 0.22, 0.25],
      quantumMode: true,
    },
  });

  const { fields: strengthFields, append: appendStrength, remove: removeStrength } = useFieldArray({ control, name: "strengthParams" });
  // Similar for momentum and noise if dynamic length is desired. For fixed 6, direct is fine.

  const onSubmit = async (data: ImplementZPESimulationInput) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const output = await implementZPESimulation(data);
      setResult(output);
      toast({ title: "Simulation Successful", description: `Achieved accuracy: ${output.accuracy.toFixed(2)}%` });
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
      toast({ title: "Simulation Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderArrayInput = (paramName: "strengthParams" | "momentumParams" | "noiseParams", label: string) => (
     <div className="space-y-2 col-span-1 md:col-span-2">
        <Label className="text-base">{label} (6 Layers)</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {control.getValues(paramName).map((_, index) => (
            <div key={index} className="flex flex-col space-y-1">
              <Label htmlFor={`${paramName}.${index}`} className="text-xs">L{index+1}</Label>
              <Controller
                name={`${paramName}.${index}`}
                control={control}
                render={({ field, fieldState: itemError }) => (
                  <>
                  <Input {...field} type="number" step="0.01" min="0" max="1" className="h-8 text-sm"/>
                  {itemError.error && <p className="text-xs text-destructive">{itemError.error.message}</p>}
                  </>
                )}
              />
            </div>
          ))}
        </div>
        {errors[paramName] && <p className="text-xs text-destructive">{errors[paramName]?.message}</p>}
      </div>
  );


  return (
    <div className="container mx-auto p-4 md:p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lightbulb className="h-6 w-6 text-primary" />Implement ZPE Simulation</CardTitle>
          <CardDescription>
            Simulate Zero-Point Energy effects on model accuracy using various parameters.
            This flow mimics how ZPE might influence model training dynamics, affecting final accuracy and layer-specific energy contributions.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle>Input Parameters</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="baseAccuracy">Base Accuracy (%)</Label>
                <Controller name="baseAccuracy" control={control} render={({ field }) => <Input {...field} type="number" step="0.1" />} />
                {errors.baseAccuracy && <p className="text-xs text-destructive">{errors.baseAccuracy.message}</p>}
              </div>
              <div>
                <Label htmlFor="epochsRatio">Epochs Ratio (Current/Total)</Label>
                <Controller name="epochsRatio" control={control} render={({ field }) => <Input {...field} type="number" step="0.01" min="0" max="1" />} />
                {errors.epochsRatio && <p className="text-xs text-destructive">{errors.epochsRatio.message}</p>}
              </div>
              
              {renderArrayInput("strengthParams", "Strength Parameters")}
              {renderArrayInput("momentumParams", "Momentum Parameters")}
              {renderArrayInput("noiseParams", "Noise Parameters")}

              <div className="flex items-center space-x-2 pt-2">
                <Controller name="quantumMode" control={control} render={({ field }) => <Switch id="quantumMode" checked={field.value} onCheckedChange={field.onChange} />} />
                <Label htmlFor="quantumMode">Enable Quantum Mode</Label>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Simulating..." : "Run Simulation"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Simulation Results</CardTitle></CardHeader>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                  <Card className="bg-muted/50 p-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Simulated Accuracy</CardTitle>
                    <CardDescription className="text-3xl font-bold text-primary">{result.accuracy.toFixed(2)}%</CardDescription>
                  </Card>
                   <Card className="bg-muted/50 p-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total ZPE Effect</CardTitle>
                    <CardDescription className="text-3xl font-bold text-primary">{result.zpeEffects.reduce((a,b)=>a+b,0).toFixed(3)}</CardDescription>
                  </Card>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">ZPE Effects per Layer</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={result.zpeEffects.map((eff, i) => ({ name: `Layer ${i+1}`, value: eff }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                        <Bar dataKey="value" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                 <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertTitle>Interpretation</AlertTitle>
                  <AlertDescription>
                    The simulated accuracy reflects the potential impact of ZPE parameters. Higher ZPE effects per layer suggest stronger influence, which could be beneficial or detrimental depending on overall model stability and task.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-10">Run simulation to see results.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
