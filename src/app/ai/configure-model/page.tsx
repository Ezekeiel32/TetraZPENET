
"use client";
import { useState } from "react";
import { 
  configureModelForDataset, 
  ConfigureModelForDatasetInput, 
  ConfigureModelForDatasetOutput,
  ConfigureModelForDatasetInputSchema
} from "@/ai/flows/configure-model-for-dataset";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Wrench, FileJson, BrainCircuit } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const defaultModelCode = \`
import torch
import torch.nn as nn

class ZPEDeepNet(nn.Module):
    def __init__(self, output_size=10, sequence_length=10):
        super(ZPEDeepNet, self).__init__()
        self.sequence_length = sequence_length
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        # Example ZPE flows, assuming 6 points of application
        self.zpe_flows = [torch.ones(sequence_length, device=self.device) for _ in range(6)] 

        # Convolutional blocks
        self.conv1 = nn.Sequential(
            nn.Conv2d(1, 64, kernel_size=3, padding=1), # Input channels: 1 for MNIST
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2)
        )
        # ... other conv blocks (conv2, conv3, conv4) ...
        self.conv2 = nn.Sequential(nn.Conv2d(64, 128, kernel_size=3, padding=1), nn.BatchNorm2d(128), nn.ReLU(), nn.MaxPool2d(2))
        self.conv3 = nn.Sequential(nn.Conv2d(128, 256, kernel_size=3, padding=1), nn.BatchNorm2d(256), nn.ReLU(), nn.MaxPool2d(2))
        self.conv4 = nn.Sequential(nn.Conv2d(256, 512, kernel_size=3, padding=1), nn.BatchNorm2d(512), nn.ReLU(), nn.MaxPool2d(2))

        # Fully connected layers
        # For MNIST (1x28x28), after 4 MaxPool2d layers, image becomes 1x1.
        # So, 512 * 1 * 1 = 512 input features to FC layer.
        self.fc = nn.Sequential(
            nn.Flatten(),
            nn.Linear(512 * 1 * 1, 2048), 
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(2048, 512),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(512, output_size) # output_size matches number of classes
        )
        # Shortcut connections (simplified, ensure dimensions match after pooling)
        self.shortcut1 = nn.Sequential(nn.Conv2d(1, 64, kernel_size=1, stride=1, padding=0), nn.MaxPool2d(2))
        self.shortcut2 = nn.Sequential(nn.Conv2d(64, 128, kernel_size=1, stride=1, padding=0), nn.MaxPool2d(2))
        self.shortcut3 = nn.Sequential(nn.Conv2d(128, 256, kernel_size=1, stride=1, padding=0), nn.MaxPool2d(2))
        self.shortcut4 = nn.Sequential(nn.Conv2d(256, 512, kernel_size=1, stride=1, padding=0), nn.MaxPool2d(2))


    def perturb_zpe_flow(self, data, zpe_idx, feature_size):
        # Simplified perturbation logic
        batch_mean = torch.mean(data.detach(), dim=0).view(-1)
        divisible_size = (batch_mean.size(0) // self.sequence_length) * self.sequence_length
        if divisible_size == 0 and batch_mean.size(0) > 0: # Handle case where feature_size < sequence_length
             divisible_size = self.sequence_length # Use at least one sequence_length block
        elif divisible_size == 0 and batch_mean.size(0) == 0:
             return # Cannot perturb if no data
        
        batch_mean_truncated = batch_mean[:divisible_size]
        if batch_mean_truncated.nelement() == 0 and batch_mean.nelement() > 0 : # if truncation leads to empty
            batch_mean_padded = torch.cat((batch_mean, torch.zeros(self.sequence_length - batch_mean.nelement() % self.sequence_length, device=self.device)))
            reshaped = batch_mean_padded.view(-1, self.sequence_length)
        elif batch_mean_truncated.nelement() == 0:
            return
        else:
            reshaped = batch_mean_truncated.view(-1, self.sequence_length)

        perturbation = torch.mean(reshaped, dim=0)
        perturbation = torch.tanh(perturbation * 0.3) 
        momentum = 0.9 if zpe_idx < 4 else 0.7 
        with torch.no_grad():
            self.zpe_flows[zpe_idx].data = momentum * self.zpe_flows[zpe_idx].data + (1 - momentum) * (1.0 + perturbation)
            self.zpe_flows[zpe_idx].data = torch.clamp(self.zpe_flows[zpe_idx].data, 0.8, 1.2)

    def apply_zpe(self, x, zpe_idx, spatial=True):
        feature_size = x.size(1) if spatial else x.size(-1)
        if feature_size == 0: return x # Skip if no features
        self.perturb_zpe_flow(x, zpe_idx, feature_size)
        flow = self.zpe_flows[zpe_idx]
        
        if spatial:
            # Correctly handle spatial expansion for images of varying sizes
            num_elements_to_cover = x.size(2) * x.size(3)
            if num_elements_to_cover == 0: return x
            
            repeats = (num_elements_to_cover + self.sequence_length -1) // self.sequence_length
            flow_expanded_flat = flow.repeat(repeats)[:num_elements_to_cover]
            
            flow_expanded = flow_expanded_flat.view(1, 1, x.size(2), x.size(3))
            flow_expanded = flow_expanded.expand_as(x) # expand to match x's shape
        else:
            # Correctly handle non-spatial (FC layer) expansion
            num_elements_to_cover = x.size(-1)
            if num_elements_to_cover == 0: return x

            repeats = (num_elements_to_cover + self.sequence_length -1) // self.sequence_length
            flow_expanded_flat = flow.repeat(repeats)[:num_elements_to_cover]
            
            flow_expanded = flow_expanded_flat.view(1, -1)
            flow_expanded = flow_expanded.expand_as(x) # expand to match x's shape
        return x * flow_expanded

    def forward(self, x):
        # Apply ZPE and pass through conv blocks with residual connections
        x = self.apply_zpe(x, 0)
        residual = self.shortcut1(x)
        x = self.conv1(x) + residual
        
        x = self.apply_zpe(x, 1)
        residual = self.shortcut2(x)
        x = self.conv2(x) + residual
        
        x = self.apply_zpe(x, 2)
        residual = self.shortcut3(x)
        x = self.conv3(x) + residual
        
        x = self.apply_zpe(x, 3)
        residual = self.shortcut4(x)
        x = self.conv4(x) + residual
        
        # Apply ZPE before FC layers
        x = self.apply_zpe(x, 4)
        x = self.fc(x)
        
        # Apply ZPE to output (non-spatial)
        x = self.apply_zpe(x, 5, spatial=False)
        return x
\`;

// Use the input schema for form validation
const formSchema = ConfigureModelForDatasetInputSchema;

export default function ConfigureModelPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ConfigureModelForDatasetOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<ConfigureModelForDatasetInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      datasetDescription: "CIFAR-10 dataset, 32x32 RGB images, 10 classes.",
      modelCode: defaultModelCode,
      currentBatchSize: 32,
      currentSequenceLength: 10,
    },
  });

  const onSubmit = async (data: ConfigureModelForDatasetInput) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const output = await configureModelForDataset(data);
      setResult(output);
      toast({ title: "Configuration Suggested", description: "AI has provided model configuration advice." });
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
      toast({ title: "Configuration Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wrench className="h-6 w-6 text-primary" />AI Model Configurator</CardTitle>
          <CardDescription>
            Provide a dataset description and your PyTorch model code. The AI will suggest batch size, model parameter adjustments (like input/output sizes, sequence length), and necessary code modifications.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Inputs</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="datasetDescription">Dataset Description</Label>
                <Controller name="datasetDescription" control={control} render={({ field }) => <Textarea {...field} rows={5} placeholder="E.g., MNIST handwritten digits, 28x28 grayscale images, 10 classes. Or Kaggle URL: https://www.kaggle.com/datasets/..." />} />
                {errors.datasetDescription && <p className="text-xs text-destructive">{errors.datasetDescription.message}</p>}
                 <p className="text-xs text-muted-foreground mt-1">Include image dimensions, channels (1 for gray, 3 for RGB), number of classes. You can also paste a Kaggle dataset URL.</p>
              </div>
              <div>
                <Label htmlFor="modelCode">PyTorch Model Code</Label>
                <Controller name="modelCode" control={control} render={({ field }) => <Textarea {...field} rows={15} placeholder="Paste your PyTorch nn.Module class definition here..." className="font-mono text-xs"/>} />
                {errors.modelCode && <p className="text-xs text-destructive">{errors.modelCode.message}</p>}
              </div>
               <div>
                <Label htmlFor="currentBatchSize">Current Batch Size (Optional)</Label>
                <Controller name="currentBatchSize" control={control} render={({ field }) => <Input {...field} type="number" placeholder="e.g., 32" />} />
                {errors.currentBatchSize && <p className="text-xs text-destructive">{errors.currentBatchSize.message}</p>}
              </div>
              <div>
                <Label htmlFor="currentSequenceLength">Current Sequence Length (Optional, for ZPE etc.)</Label>
                <Controller name="currentSequenceLength" control={control} render={({ field }) => <Input {...field} type="number" placeholder="e.g., 10 or 32" />} />
                {errors.currentSequenceLength && <p className="text-xs text-destructive">{errors.currentSequenceLength.message}</p>}
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Analyzing..." : "Get AI Configuration Advice"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>AI Configuration Suggestions</CardTitle></CardHeader>
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
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileJson className="h-5 w-5"/>Suggested Parameters</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <p><strong>Suggested Batch Size:</strong> {result.suggestedBatchSize}</p>
                    <p><strong>Estimated Input Channels:</strong> {result.estimatedInputChannels}</p>
                    <p><strong>Estimated Output Size (Classes):</strong> {result.estimatedOutputSize}</p>
                    {result.estimatedSequenceLength && <p><strong>Estimated Sequence Length:</strong> {result.estimatedSequenceLength}</p>}
                  </CardContent>
                </Card>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><BrainCircuit className="h-5 w-5"/>Suggested Model Modifications:</h3>
                  <ScrollArea className="h-[300px] border rounded-md p-3 bg-muted/30">
                    <pre className="text-sm font-mono whitespace-pre-wrap">
                      {result.suggestedModelModifications}
                    </pre>
                  </ScrollArea>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Reasoning:</h3>
                  <Alert variant="default">
                    <Wrench className="h-4 w-4"/>
                    <AlertTitle>AI Analysis</AlertTitle>
                    <AlertDescription>
                       <ScrollArea className="h-[200px]">
                        {result.reasoning}
                       </ScrollArea>
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-10">Submit dataset and model info to get AI-powered configuration advice.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
