import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, Zap, CircuitBoard, Atom, GitMerge, ArrowRight } from "lucide-react";

const LayerDetail = ({ name, inChannels, outChannels, kernelSize, activation, pooling, params, zpeApplied = false, shortcut = false }) => (
  <div className="p-4 border rounded-lg bg-card shadow-sm transition-all hover:shadow-md">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-lg font-semibold text-primary">{name}</h3>
      {zpeApplied && <Zap className="h-5 w-5 text-purple-500" title="ZPE Applied" />}
    </div>
    <div className="space-y-1 text-sm text-muted-foreground">
      <p><strong>In/Out Channels:</strong> {inChannels} → {outChannels}</p>
      {kernelSize && <p><strong>Kernel:</strong> {kernelSize}</p>}
      {activation && <p><strong>Activation:</strong> {activation}</p>}
      {pooling && <p><strong>Pooling:</strong> {pooling}</p>}
      {shortcut && <p className="text-green-600 dark:text-green-400"><strong>Shortcut Connection Applied</strong></p>}
      <p><strong>Est. Params:</strong> {params}</p>
    </div>
  </div>
);


export default function ModelArchitecturePage() {
  const modelStructure = [
    { type: "input", name: "Input Layer", details: "1x28x28 (MNIST)" },
    { type: "zpe", name: "ZPE Flow 0", details: "Applied to input" },
    { type: "conv_block", name: "Conv Block 1", in: "1 (xZPE)", out: "64", kernel: "3x3", activation: "ReLU", pool: "MaxPool 2x2", params: "~1.8K", shortcut: true, zpe: true },
    { type: "conv_block", name: "Conv Block 2", in: "64 (xZPE)", out: "128", kernel: "3x3", activation: "ReLU", pool: "MaxPool 2x2", params: "~73K", shortcut: true, zpe: true },
    { type: "conv_block", name: "Conv Block 3", in: "128 (xZPE)", out: "256", kernel: "3x3", activation: "ReLU", pool: "MaxPool 2x2", params: "~295K", shortcut: true, zpe: true },
    { type: "conv_block", name: "Conv Block 4", in: "256 (xZPE)", out: "512", kernel: "3x3", activation: "ReLU", pool: "MaxPool 2x2", params: "~1.2M", shortcut: true, zpe: true },
    { type: "zpe", name: "ZPE Flow 4 (Post-Conv)", details: "Applied after all conv blocks" },
    { type: "flatten", name: "Flatten Layer", details: "Converts 512x1x1 to 512 features" },
    { type: "fc_block", name: "FC Block 1", in: "512", out: "2048", activation: "ReLU", dropout: "0.5", params: "~1M" },
    { type: "fc_block", name: "FC Block 2", in: "2048", out: "512", activation: "ReLU", dropout: "0.5", params: "~1M" },
    { type: "fc_block", name: "Output Layer", in: "512", out: "10 (classes)", activation: "None (Logits)", params: "~5K" },
    { type: "zpe", name: "ZPE Flow 5 (Post-FC)", details: "Applied to final output (non-spatial)" },
  ];

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">ZPEDeepNet Architecture</h1>
        <p className="text-muted-foreground">
          Detailed structure of the Zero-Point Energy enhanced deep neural network based on the Colab model.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><CircuitBoard className="h-5 w-5 text-primary"/>Core Type</CardTitle></CardHeader>
          <CardContent><p>Convolutional Neural Network (CNN) with custom ZPE layers and residual connections.</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5 text-primary"/>Total Layers</CardTitle></CardHeader>
          <CardContent><p>4 Conv Blocks, 3 FC Layers, 6 ZPE application points.</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Atom className="h-5 w-5 text-primary"/>Key Feature</CardTitle></CardHeader>
          <CardContent><p>Dynamic ZPE flow perturbations for adaptive scaling and regularization.</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Network Flow Diagram</CardTitle>
          <CardDescription>Visual representation of data flow through ZPEDeepNet layers.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 overflow-x-auto p-2">
            {modelStructure.map((layer, index) => (
              <React.Fragment key={index}>
                <div className={`flex items-center p-3 rounded-md shadow-sm ${
                  layer.type.includes('conv') ? 'bg-blue-500/10 border-l-4 border-blue-500' : 
                  layer.type.includes('fc') ? 'bg-green-500/10 border-l-4 border-green-500' : 
                  layer.type.includes('zpe') ? 'bg-purple-500/10 border-l-4 border-purple-500' : 
                  'bg-muted/50 border-l-4 border-gray-500'
                }`}>
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                    {layer.type.includes('conv') ? <Layers className="h-5 w-5 text-primary"/> : 
                     layer.type.includes('fc') ? <GitMerge className="h-5 w-5 text-primary"/> : 
                     layer.type.includes('zpe') ? <Zap className="h-5 w-5 text-primary"/> :
                     <CircuitBoard className="h-5 w-5 text-primary"/> }
                  </div>
                  <div>
                    <h4 className="font-semibold">{layer.name}</h4>
                    <p className="text-xs text-muted-foreground">{layer.details || 
                      `In: ${layer.in} → Out: ${layer.out} | Kernel: ${layer.kernel || 'N/A'} | Act: ${layer.activation || 'N/A'} | Pool: ${layer.pool || 'N/A'} | Params: ${layer.params || 'N/A'}`
                    }</p>
                    {layer.shortcut && <span className="text-xs text-green-500">Shortcut Active</span>}
                  </div>
                </div>
                {index < modelStructure.length - 1 && (
                  <div className="flex justify-center my-1">
                    <ArrowRight className="h-5 w-5 text-muted-foreground रोटेट-90 md:rotate-0 transform rotate-90" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Layer Configuration Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LayerDetail name="Conv Block 1" inChannels="1 (after ZPE)" outChannels="64" kernelSize="3x3" activation="ReLU" pooling="MaxPool 2x2" params="~1.8K" zpeApplied={true} shortcut={true} />
          <LayerDetail name="Conv Block 2" inChannels="64 (after ZPE)" outChannels="128" kernelSize="3x3" activation="ReLU" pooling="MaxPool 2x2" params="~73K" zpeApplied={true} shortcut={true} />
          <LayerDetail name="Conv Block 3" inChannels="128 (after ZPE)" outChannels="256" kernelSize="3x3" activation="ReLU" pooling="MaxPool 2x2" params="~295K" zpeApplied={true} shortcut={true} />
          <LayerDetail name="Conv Block 4" inChannels="256 (after ZPE)" outChannels="512" kernelSize="3x3" activation="ReLU" pooling="MaxPool 2x2" params="~1.2M" zpeApplied={true} shortcut={true} />
          <LayerDetail name="FC Layer 1" inChannels="512 (after ZPE)" outChannels="2048" activation="ReLU" params="~1M" />
          <LayerDetail name="FC Layer 2 (Output)" inChannels="512 (after ZPE)" outChannels="10" activation="None" params="~5K" zpeApplied={true} />
        </div>
      </div>
       <Card className="mt-8">
        <CardHeader>
          <CardTitle>ZPE Application Strategy</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>ZPE flows are applied after the initial input and after each convolutional block.</li>
            <li>Another ZPE flow is applied after the main convolutional stack, before the fully connected layers.</li>
            <li>A final ZPE flow is applied after the last fully connected layer (output logits), in a non-spatial manner.</li>
            <li>Each ZPE application point uses its own set of flow parameters, perturbed based on batch statistics.</li>
            <li>The `sequence_length` (cycle_length) for ZPE flow perturbation is 10 in this Colab model version. User specified 32 for general cases.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
