"use client";
import { useState } from "react";
import { adaptZeroPointEnergy, AdaptZeroPointEnergyInput, AdaptZeroPointEnergyOutput } from "@/ai/flows/adapt-zpe";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Cog } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const defaultModelCode = `
class ZPEDeepNet(nn.Module):
    def __init__(self, output_size=10, sequence_length=32): # Use cycleLength as sequence_length
        super(ZPEDeepNet, self).__init__()
        self.sequence_length = sequence_length # cycle_length
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        # Example ZPE flows, assuming 4 conv layers and 2 FC layers need ZPE
        self.zpe_flows = [
            nn.Parameter(torch.ones(64, device=self.device) * 1.0), # For conv1_out_channels
            nn.Parameter(torch.ones(128, device=self.device) * 1.0),# For conv2_out_channels
            nn.Parameter(torch.ones(256, device=self.device) * 1.0),# For conv3_out_channels
            nn.Parameter(torch.ones(512, device=self.device) * 1.0),# For conv4_out_channels
            nn.Parameter(torch.ones(2048, device=self.device) * 1.0),# For fc1_out_features
            nn.Parameter(torch.ones(512, device=self.device) * 1.0) # For fc2_out_features
        ]
        # ... other layers ...

    def perturb_zpe_flow(self, data, zpe_idx, feature_size_if_not_parameter):
        # Simplified: Assumes zpe_flows[zpe_idx] corresponds to the layer
        # and its size matches the relevant dimension of 'data'.
        # In a real scenario, this logic would be more complex.
        
        # Placeholder: In a real model, this method would use 'data' (layer activations)
        # and self.sequence_length (cycleLength) to adjust self.zpe_flows[zpe_idx].
        # For this AI flow, the AI will generate the logic to adapt these.
        
        # Example: if zpe_idx corresponds to a conv layer
        if data.dim() == 4: # Batch, Channels, Height, Width
            batch_mean_activations = torch.mean(data.detach(), dim=[0, 2, 3]) # Avg over batch, H, W
        # Example: if zpe_idx corresponds to an FC layer
        elif data.dim() == 2: # Batch, Features
            batch_mean_activations = torch.mean(data.detach(), dim=0) # Avg over batch
        else:
            # Fallback or error for unexpected data dimensions
            return

        # AI will determine how to use batch_mean_activations and layerData (from input)
        # to update self.zpe_flows[zpe_idx], clamped between 0.8 and 1.2.
        # Example of a very simple update (AI's logic will be more sophisticated):
        # perturbation = torch.tanh(batch_mean_activations * 0.1) 
        # self.zpe_flows[zpe_idx].data = torch.clamp(1.0 + perturbation, 0.8, 1.2)
        pass
`;

const formSchema = z.object({
  modelCode: z.string().min(50, "Model code seems too short."),
  layerDataStr: z.string().refine(val => {
    try { JSON.parse(val); return true; } catch { return false; }
  }, "Invalid JSON for Layer Data"),
  cycleLength: z.coerce.number().int().min(1).max(128),
});

type FormValues = {
  modelCode: string;
  layerDataStr: string;
  cycleLength: number;
};

export default function AdaptZPEPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AdaptZeroPointEnergyOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      modelCode: defaultModelCode,
      layerDataStr: JSON.stringify({
        "conv1_out": 0.55, "conv2_out": 0.62, "conv3_out": 0.48, "conv4_out": 0.71, "fc1_out": 0.59, "fc2_out": 0.65 
      }, null, 2),
      cycleLength: 32,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const parsedLayerData = JSON.parse(data.layerDataStr);
      const inputForAI: AdaptZeroPointEnergyInput = {
        modelCode: data.modelCode,
        layerData: parsedLayerData,
        cycleLength: data.cycleLength,
      };
      const output = await adaptZeroPointEnergy(inputForAI);
      setResult(output);
      toast({ title: "Adaptation Successful", description: "ZPE flows adapted based on your inputs." });
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
      toast({ title: "Adaptation Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
       <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Cog className="h-6 w-6 text-primary" />Adapt Zero-Point Energy</CardTitle>
          <CardDescription>
            Provide PyTorch model code (especially the ZPE perturbation logic) and layer data. The AI will analyze these and suggest adapted ZPE flow values to enhance model performance.
            The `cycleLength` parameter (sequence length) influences how ZPE perturbations are calculated and applied over time or feature dimensions.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle>Input Parameters</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="modelCode">PyTorch Model Code (ZPEDeepNet with perturb_zpe_flow)</Label>
                <Controller name="modelCode" control={control} render={({ field }) => <Textarea {...field} rows={12} placeholder="Paste your PyTorch ZPEDeepNet class definition here..." className="font-mono text-xs"/>} />
                {errors.modelCode && <p className="text-xs text-destructive">{errors.modelCode.message}</p>}
              </div>
              <div>
                <Label htmlFor="layerDataStr">Layer Data (JSON: {"{ \"layer_name\": numeric_value }"})</Label>
                <Controller name="layerDataStr" control={control} render={({ field }) => <Textarea {...field} rows={5} placeholder='e.g., {"conv1_out": 0.5, "fc_out": 0.8}' className="font-mono text-xs"/>} />
                {errors.layerDataStr && <p className="text-xs text-destructive">{errors.layerDataStr.message}</p>}
              </div>
               <div>
                <Label htmlFor="cycleLength">Cycle Length (Sequence Length for ZPE)</Label>
                <Controller name="cycleLength" control={control} render={({ field }) => <Input {...field} type="number" min="1" max="128"/>} />
                {errors.cycleLength && <p className="text-xs text-destructive">{errors.cycleLength.message}</p>}
                <p className="text-xs text-muted-foreground mt-1">Typically 32 (2<sup>5</sup>). Relates to temporal/spatial ZPE perturbation patterns.</p>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Adapting..." : "Adapt ZPE Flows"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Adaptation Results</CardTitle></CardHeader>
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
                  <h3 className="text-lg font-semibold mb-2">Adapted ZPE Flows:</h3>
                  <ScrollArea className="h-[200px] border rounded-md p-2 bg-muted/30">
                    <pre className="text-sm font-mono whitespace-pre-wrap">
                      {JSON.stringify(result.adaptedZpeFlows, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Analysis Summary:</h3>
                  <Alert>
                    <Cog className="h-4 w-4"/>
                    <AlertTitle>AI Analysis</AlertTitle>
                    <AlertDescription>
                      <ScrollArea className="h-[200px]">
                         {result.analysis}
                      </ScrollArea>
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-10">Submit parameters to see adapted ZPE flows and analysis.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
