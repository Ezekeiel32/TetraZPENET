"use client";
import { useState } from "react";
import { showScaledOutput, ShowScaledOutputInput, ShowScaledOutputOutput } from "@/ai/flows/show-scaled-output";
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
import { Terminal, Scaling } from "lucide-react";

const formSchema = z.object({
  numQubits: z.coerce.number().int().min(1).max(64),
  zpeStrength: z.coerce.number().min(0).max(5),
});

export default function ShowScaledOutputPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ShowScaledOutputOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<ShowScaledOutputInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numQubits: 8,
      zpeStrength: 1.0,
    },
  });

  const onSubmit = async (data: ShowScaledOutputInput) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const output = await showScaledOutput(data);
      setResult(output);
      toast({ title: "Simulation Successful", description: "Scaled output generated." });
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
      toast({ title: "Simulation Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const chartData = result?.scaledOutput.map((val, index) => ({
    name: `Qubit ${index + 1}`,
    value: val,
  })) || [];

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Scaling className="h-6 w-6 text-primary" />Show Scaled Output (Pseudo-Quantum Circuit)</CardTitle>
          <CardDescription>
            Simulate a pseudo-quantum circuit with custom Zero-Point Energy (ZPE) strength and display the scaled output. 
            The output values are normalized to the range [0, 1].
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle>Input Parameters</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="numQubits">Number of Qubits</Label>
                <Controller name="numQubits" control={control} render={({ field }) => <Input {...field} type="number" min="1" max="64" />} />
                {errors.numQubits && <p className="text-xs text-destructive">{errors.numQubits.message}</p>}
              </div>
              <div>
                <Label htmlFor="zpeStrength">ZPE Strength</Label>
                <Controller name="zpeStrength" control={control} render={({ field }) => <Input {...field} type="number" step="0.1" min="0" max="5" />} />
                {errors.zpeStrength && <p className="text-xs text-destructive">{errors.zpeStrength.message}</p>}
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Simulating..." : "Generate Scaled Output"}
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
                <Card className="bg-muted/50 p-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground mb-1">Scaled Output Values</CardTitle>
                  {result.scaledOutput.length > 0 ? (
                    <div className="h-[300px]">
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
                  ) : <p className="text-muted-foreground">No output data to display.</p>}
                </Card>
                 <Alert>
                  <Scaling className="h-4 w-4" />
                  <AlertTitle>Output Interpretation</AlertTitle>
                  <AlertDescription>
                    Each bar represents a simulated qubit's output, scaled between 0 and 1. The ZPE strength influences the initial range of values before scaling. This flow demonstrates a basic simulation of quantum-like behavior with ZPE.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-10">Run simulation to see the scaled output.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

