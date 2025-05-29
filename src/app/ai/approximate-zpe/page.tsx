"use client";
import { useState } from "react";
import { approximateZPE, ApproximateZPEInput, ApproximateZPEOutput } from "@/ai/flows/approximate-zpe";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Replace } from "lucide-react";

const formSchema = z.object({
  baseValue: z.coerce.number(),
  fluctuationRange: z.coerce.number().min(0),
  numEntangledProbabilities: z.coerce.number().int().min(1).max(20),
});

export default function ApproximateZPEPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ApproximateZPEOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<ApproximateZPEInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      baseValue: 1.0,
      fluctuationRange: 0.2,
      numEntangledProbabilities: 6,
    },
  });

  const onSubmit = async (data: ApproximateZPEInput) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const output = await approximateZPE(data);
      setResult(output);
      toast({ title: "Approximation Successful", description: `Approximated Value: ${output.approximatedValue.toFixed(4)}` });
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
      toast({ title: "Approximation Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const chartData = result?.entangledProbabilities.map((prob, index) => ({
    name: `P${index + 1}`,
    value: prob,
  })) || [];

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Replace className="h-6 w-6 text-primary" />Approximate ZPE Flow Parameter</CardTitle>
          <CardDescription>
            Dynamically approximates a ZPE flow parameter to mimic quantum entanglement and probabilistic states. 
            This explores an alternative to fixed float values, using a base value and fluctuation range.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle>Input Parameters</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="baseValue">Base Value</Label>
                <Controller name="baseValue" control={control} render={({ field }) => <Input {...field} type="number" step="0.01" />} />
                {errors.baseValue && <p className="text-xs text-destructive">{errors.baseValue.message}</p>}
              </div>
              <div>
                <Label htmlFor="fluctuationRange">Fluctuation Range (±)</Label>
                <Controller name="fluctuationRange" control={control} render={({ field }) => <Input {...field} type="number" step="0.01" min="0" />} />
                {errors.fluctuationRange && <p className="text-xs text-destructive">{errors.fluctuationRange.message}</p>}
              </div>
              <div>
                <Label htmlFor="numEntangledProbabilities">Number of Entangled Probabilities</Label>
                <Controller name="numEntangledProbabilities" control={control} render={({ field }) => <Input {...field} type="number" step="1" min="1" max="20" />} />
                {errors.numEntangledProbabilities && <p className="text-xs text-destructive">{errors.numEntangledProbabilities.message}</p>}
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Approximating..." : "Run Approximation"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Approximation Results</CardTitle></CardHeader>
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
                <Card className="bg-muted/50 p-4 text-center">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Approximated ZPE Value</CardTitle>
                  <CardDescription className="text-3xl font-bold text-primary">{result.approximatedValue.toFixed(4)}</CardDescription>
                  <p className="text-xs text-muted-foreground mt-1">
                    (Range: {(result.approximatedValue - formSchema.parse(control.getValues()).fluctuationRange).toFixed(4)} to {(result.approximatedValue + formSchema.parse(control.getValues()).fluctuationRange).toFixed(4)})
                  </p>
                </Card>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Entangled Probabilities Used</h3>
                  {result.entangledProbabilities.length > 0 ? (
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis domain={[0, 1]}/>
                          <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}/>
                          <Bar dataKey="value" fill="hsl(var(--primary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <p className="text-muted-foreground">No probability data to display.</p>}
                </div>
                <Alert>
                  <Replace className="h-4 w-4" />
                  <AlertTitle>Interpretation</AlertTitle>
                  <AlertDescription>
                    The approximated value fluctuates around the base value within the specified range, influenced by simulated entangled probabilities. This demonstrates a dynamic parameter rather than a static float.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-10">Run approximation to see results.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
