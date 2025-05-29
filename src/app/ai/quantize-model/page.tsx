"use client";
import { useState } from "react";
import { quantizeColabModel, QuantizeColabModelInput, QuantizeColabModelOutput } from "@/ai/flows/quantize-colab-model";
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
import { Terminal, Box, FileCode } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Default Colab code based on user's provided script
const defaultColabCode = `
import torch
import torch.nn as nn
# ... (Include necessary parts of ZPEDeepNet class definition if needed by quantization)
# Example:
# class ZPEDeepNet(nn.Module):
#     def __init__(self, output_size=10, sequence_length=10):
#         super(ZPEDeepNet, self).__init__()
#         # ... (model definition from user's Colab script) ...
#     def forward(self, x):
#         # ... (forward pass from user's Colab script) ...
#         return x

# model = ZPEDeepNet()
# model.load_state_dict(torch.load('/content/zpe_deepnet_colab.pth')) # This part is important
# model.eval() 
# ... rest of training/utility code if relevant for context
# This is a placeholder, user should paste their actual relevant Colab code.
# Ensure the model definition and loading of the checkpoint are present.
print("Model definition and loading code should be here.")
`;


const formSchema = z.object({
  colabCode: z.string().min(100, "Colab code seems too short. Ensure model definition and checkpoint loading are included."),
  modelCheckpointPath: z.string().min(1, "Checkpoint path is required").default("/content/zpe_deepnet_colab.pth"),
});

export default function QuantizeModelPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QuantizeColabModelOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<QuantizeColabModelInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      colabCode: defaultColabCode,
      modelCheckpointPath: "/content/zpe_deepnet_colab.pth",
    },
  });

  const onSubmit = async (data: QuantizeColabModelInput) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const output = await quantizeColabModel(data);
      setResult(output);
      toast({ title: "Quantization Processed", description: "Code and report generated." });
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
      toast({ title: "Quantization Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Box className="h-6 w-6 text-primary" />Quantize Colab PyTorch Model</CardTitle>
          <CardDescription>
            Provide Python code from a Colab notebook (defining and training a PyTorch model) and the model checkpoint path. 
            The AI will generate code to quantize the model and a summary report.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle>Input Parameters</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="colabCode">Colab Python Code</Label>
                <Controller name="colabCode" control={control} render={({ field }) => <Textarea {...field} rows={15} placeholder="Paste your Colab code here..." className="font-mono text-xs"/>} />
                {errors.colabCode && <p className="text-xs text-destructive">{errors.colabCode.message}</p>}
              </div>
              <div>
                <Label htmlFor="modelCheckpointPath">Model Checkpoint Path (in Colab environment)</Label>
                <Controller name="modelCheckpointPath" control={control} render={({ field }) => <Input {...field} placeholder="/content/model.pth" />} />
                {errors.modelCheckpointPath && <p className="text-xs text-destructive">{errors.modelCheckpointPath.message}</p>}
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Processing..." : "Generate Quantization Code & Report"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Generated Output</CardTitle></CardHeader>
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
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><FileCode className="h-5 w-5"/>Quantized Model Code (Python)</h3>
                  <ScrollArea className="h-[300px] border rounded-md p-2 bg-muted/30">
                    <pre className="text-xs font-mono whitespace-pre-wrap">
                      {result.quantizedModelCode}
                    </pre>
                  </ScrollArea>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Quantization Report</h3>
                   <Alert>
                    <Box className="h-4 w-4"/>
                    <AlertTitle>AI Generated Report</AlertTitle>
                    <AlertDescription>
                       <ScrollArea className="h-[200px]">
                        {result.quantizationReport}
                       </ScrollArea>
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-10">Submit parameters to generate quantization code and report.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
