
"use client";
import React, { useState, useEffect } from "react";
// import { QuantumNoiseSample } from "@/entities/all"; // Commented out
import type { QuantumNoiseSample } from "@/types/entities";
import {
  Atom,
  Braces, // Added Braces
  FileDown,
  RefreshCw,
  Boxes,
  Dices,
  Activity, 
  Maximize
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
// import { InvokeLLM } from "@/integrations/Core"; // Commented out
import type { InvokeLLMResponse } from "@/types/entities"; // Using existing types
import { InvokeLLM } from "@/types/entities"; // Using placeholder from types

import QuantumNoiseGenerator from "@/components/quantum/QuantumNoiseGenerator"; 
import QuantumDistribution from "@/components/quantum/QuantumDistribution"; 

export default function QuantumNoisePage() {
  const [samples, setSamples] = useState<QuantumNoiseSample[]>([]); 
  const [activeTab, setActiveTab] = useState("generator");  
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quantumExplanation, setQuantumExplanation] = useState("");
  const [parameters, setParameters] = useState({
    numQubits: 32,
    tanhStrength: 0.6,
    noise: 0.35, // This might be classical noise added to quantum output
    coupling: 0.76 // Conceptual coupling if used in a model
  });
  const [sampleValues, setSampleValues] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<"distribution" | "waveform">("distribution");

  const generateQuantumNoiseDemo = useCallback((numQubits: number) => {
    const data = [];
    for (let i = 0; i < numQubits; i++) {
      const quantumBit = Math.random() > 0.5 ? 1 : 0; // Simulate qubit measurement (0 or 1)
      // Transform bit to [-1, 1] range, apply tanh strength
      let perturbation = Math.tanh((2.0 * quantumBit - 1.0) * parameters.tanhStrength);
      data.push(perturbation);
    }
    return data;
  }, [parameters.tanhStrength]);
  
  const fetchQuantumExplanation = useCallback(async () => {
    try {
      const result: InvokeLLMResponse = await InvokeLLM({ 
        prompt: "Explain in about 150 words how quantum fluctuations and zero-point energy could theoretically affect neural networks. Focus on quantum noise and its potential impact on network performance.",
        response_json_schema: { type: "object", properties: { explanation: { type: "string" } } }
      });
      
      if (result && result.explanation) {
        setQuantumExplanation(result.explanation);
      } else {
         setQuantumExplanation("Quantum fluctuations, derived from zero-point energy (ZPE) in quantum field theory, represent the lowest possible energy state of a quantum mechanical system. When applied to neural networks, these microscopic quantum effects could create non-deterministic perturbations in network weights. This quantum noise might help escape local minima during training by inducing small, random weight adjustments. The theoretical advantage comes from quantum superposition, allowing the network to probabilistically explore multiple parameter configurations simultaneously. By carefully calibrating the quantum coupling strength, these fluctuations could enhance generalization by preventing overfitting to training data. This approach combines quantum mechanical principles with classical neural computation, potentially offering advantages in specific learning scenarios where controlled randomness benefits optimization.");
      }
    } catch (error) {
      console.error("Error fetching explanation:", error);
      setQuantumExplanation("Quantum fluctuations, derived from zero-point energy (ZPE) in quantum field theory, represent the lowest possible energy state of a quantum mechanical system. When applied to neural networks, these microscopic quantum effects could create non-deterministic perturbations in network weights. This quantum noise might help escape local minima during training by inducing small, random weight adjustments. The theoretical advantage comes from quantum superposition, allowing the network to probabilistically explore multiple parameter configurations simultaneously. By carefully calibrating the quantum coupling strength, these fluctuations could enhance generalization by preventing overfitting to training data. This approach combines quantum mechanical principles with classical neural computation, potentially offering advantages in specific learning scenarios where controlled randomness benefits optimization.");
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // const noiseSamplesData = await QuantumNoiseSample.list(); // Data fetching commented out
        const noiseSamplesData: QuantumNoiseSample[] = []; // Placeholder
        setSamples(noiseSamplesData);
        
        if (noiseSamplesData.length === 0) {
          const generatedData = generateQuantumNoiseDemo(parameters.numQubits);
          setSampleValues(generatedData);
        } else {
          setSampleValues(noiseSamplesData[0]?.values || generateQuantumNoiseDemo(parameters.numQubits));
        }
        
        fetchQuantumExplanation();
      } catch (error) {
        console.error("Error fetching data:", error);
        setSampleValues(generateQuantumNoiseDemo(parameters.numQubits));
        fetchQuantumExplanation(); 
      }
      setIsLoading(false);
    };

    fetchData();
  }, [parameters.numQubits, generateQuantumNoiseDemo, fetchQuantumExplanation]);


  const handleGenerateNoise = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const newData = generateQuantumNoiseDemo(parameters.numQubits);
      setSampleValues(newData);
      setIsGenerating(false);
    }, 1500); 
  };

  const handleParameterChange = (param: keyof typeof parameters, value: number | number[]) => {
    setParameters(prev => ({
      ...prev,
      [param]: Array.isArray(value) ? value[0] : value
    }));
  };

  const getNoiseStats = () => {
    if (sampleValues.length === 0) return { mean: 0, std: 0, min: 0, max: 0 };
    const mean = sampleValues.reduce((a, b) => a + b, 0) / sampleValues.length;
    const variance = sampleValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / sampleValues.length;
    const std = Math.sqrt(variance);
    const minVal = Math.min(...sampleValues);
    const maxVal = Math.max(...sampleValues);
    return { mean, std, min: minVal, max: maxVal };
  };

  const stats = getNoiseStats();

  const generateResponseData = () => {
    const data = [];
    for (let i = 0; i < 20; i++) {
      const x = -1 + i * 0.1;
      const tanh = Math.tanh(x * parameters.tanhStrength);
      data.push({ name: x.toFixed(1), value: tanh });
    }
    return data;
  };

  const spectralData = Array(16).fill(0).map((_, i) => {
    const freq = i + 1;
    let amplitude = 0.2 * Math.exp(-Math.pow((freq - 4) / 2, 2));
    amplitude += 0.5 * Math.exp(-Math.pow((freq - 8) / 1.5, 2));
    amplitude += 0.3 * Math.exp(-Math.pow((freq - 12) / 3, 2));
    amplitude += Math.random() * 0.1;
    return { name: `${freq} Hz`, value: amplitude };
  });

  const zpeFlowEffectData = Array(8).fill(0).map((_, i) => {
    const strength = 0.2 + i * 0.1;
    return { name: strength.toFixed(1), "Accuracy": 96 + Math.sin(strength * 10) * 2.5, "Overfitting": 5 + Math.cos(strength * 15) * 3 };
  });

  const performanceAcrossLayersData = [
    { name: "Layer 1", "With Quantum": 0.8, "Without Quantum": 0.5 },
    { name: "Layer 2", "With Quantum": 1.2, "Without Quantum": 0.7 },
    { name: "Layer 3", "With Quantum": 1.5, "Without Quantum": 0.9 },
    { name: "Layer 4", "With Quantum": 2.1, "Without Quantum": 1.1 }
  ];
  
  if (isLoading) {
    return <div className="container mx-auto p-4 md:p-6 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto my-10 text-primary" /> Loading quantum noise data...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col space-y-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Quantum Noise Analysis</h1>
          <p className="text-muted-foreground">
            Explore and generate quantum-derived perturbations for ZPE network
          </p>
        </div>

        <Tabs defaultValue="generator" className="space-y-4" onValueChange={(value) => setActiveTab(value as "generator" | "analysis" | "application")}>
          <TabsList>
            <TabsTrigger value="generator">Noise Generator</TabsTrigger>
            <TabsTrigger value="analysis">Distribution Analysis</TabsTrigger>
            <TabsTrigger value="application">Network Application</TabsTrigger>
          </TabsList>
          
          <TabsContent value="generator" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Atom className="h-5 w-5 text-primary" />
                    Quantum Noise Generator
                  </CardTitle>
                  <CardDescription>
                    Generate quantum-derived noise patterns for neural perturbation
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px] relative">
                  <QuantumNoiseGenerator 
                    values={sampleValues}
                    isGenerating={isGenerating}
                    viewMode={viewMode}
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewMode(viewMode === "distribution" ? "waveform" : "distribution")}
                    >
                      <Maximize className="h-4 w-4 mr-2" />
                      {viewMode === "distribution" ? "View Waveform" : "View Distribution"}
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      <FileDown className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </div>
                  <Button 
                    onClick={handleGenerateNoise} 
                    disabled={isGenerating}
                    className="bg-primary text-primary-foreground"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Dices className="h-4 w-4 mr-2" />
                        Generate New Sample
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Generator Parameters</CardTitle>
                    <CardDescription className="text-xs">Adjust quantum circuit parameters</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <Label htmlFor="numQubits">Number of Qubits</Label>
                        <span className="font-mono text-xs">{parameters.numQubits}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" className="h-7 w-7"
                          onClick={() => handleParameterChange('numQubits', Math.max(8, parameters.numQubits - 8))}
                        > - </Button>
                        <Slider
                          id="numQubits"
                          min={8} max={64} step={8}
                          value={[parameters.numQubits]}
                          onValueChange={(value) => handleParameterChange('numQubits', value)}
                          className="flex-1"
                        />
                        <Button 
                          variant="outline" size="icon" className="h-7 w-7"
                          onClick={() => handleParameterChange('numQubits', Math.min(64, parameters.numQubits + 8))}
                        > + </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <Label htmlFor="tanhStrength">Tanh Strength</Label>
                        <span className="font-mono text-xs">{parameters.tanhStrength.toFixed(2)}</span>
                      </div>
                      <Slider id="tanhStrength" min={0.1} max={1.0} step={0.05} value={[parameters.tanhStrength]}
                        onValueChange={(value) => handleParameterChange('tanhStrength', value)} className="flex-1" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <Label htmlFor="noise">Classical Noise Factor</Label>
                        <span className="font-mono text-xs">{parameters.noise.toFixed(2)}</span>
                      </div>
                      <Slider id="noise" min={0} max={0.5} step={0.01} value={[parameters.noise]}
                        onValueChange={(value) => handleParameterChange('noise', value)} className="flex-1" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <Label htmlFor="coupling">Conceptual Coupling</Label>
                        <span className="font-mono text-xs">{parameters.coupling.toFixed(2)}</span>
                      </div>
                      <Slider id="coupling" min={0.5} max={1.0} step={0.01} value={[parameters.coupling]}
                        onValueChange={(value) => handleParameterChange('coupling', value)} className="flex-1" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2 pt-4"><CardTitle className="text-base">Sample Statistics</CardTitle></CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Mean:</span><span className="font-mono">{stats.mean.toFixed(4)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Std Dev:</span><span className="font-mono">{stats.std.toFixed(4)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Min Value:</span><span className="font-mono">{stats.min.toFixed(4)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Max Value:</span><span className="font-mono">{stats.max.toFixed(4)}</span></div>
                  </CardContent>
                </Card>
              </div>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What are Quantum Fluctuations?</CardTitle>
                <CardDescription>Understanding quantum noise in neural networks</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed text-muted-foreground text-sm">
                  {quantumExplanation || "Loading explanation..."}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analysis" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Quantum Distribution</CardTitle>
                  <CardDescription>Histogram of quantum noise values</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <QuantumDistribution values={sampleValues} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Tanh Response Function</CardTitle>
                  <CardDescription>How quantum bits are transformed via tanh</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={generateResponseData()}>
                        <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" />
                        <YAxis domain={[-1, 1]}/><Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="value" stroke="hsl(var(--chart-2))" name="Tanh Output" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Spectral Analysis</CardTitle>
                <CardDescription>Frequency components of quantum noise</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={spectralData}>
                      <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" />
                      <YAxis /><Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="hsl(var(--chart-1))" name="Amplitude" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="application" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Neural Network Integration</CardTitle>
                  <CardDescription>How quantum noise is applied to neural network layers</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center p-8">
                  <div className="w-full h-full relative flex items-center justify-center">
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <svg className="w-full h-full max-w-3xl" viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {Array(6).fill(0).map((_, i) => (<circle key={`input-${i}`} cx={100} cy={80 + i * 50} r={10} className="fill-blue-500"/>))}
                        {Array(8).fill(0).map((_, i) => (<circle key={`h1-${i}`} cx={250} cy={55 + i * 40} r={10} className="fill-primary"/>))}
                        <rect x={330} y={150} width={120} height={100} rx={8} className="fill-purple-500/10 stroke-purple-500 stroke-2" />
                        <text x={390} y={200} textAnchor="middle" className="fill-purple-500 text-sm">Quantum ZPE</text>
                        {Array(8).fill(0).map((_, i) => (<circle key={`h2-${i}`} cx={550} cy={55 + i * 40} r={10} className="fill-primary"/>))}
                        {Array(3).fill(0).map((_, i) => (<circle key={`output-${i}`} cx={700} cy={150 + i * 50} r={10} className="fill-green-500"/>))}
                        {Array(6).fill(0).map((_, i) => Array(8).fill(0).map((_, j) => (<line key={`in-h1-${i}-${j}`} x1={110} y1={80 + i * 50} x2={240} y2={55 + j * 40} className="stroke-gray-400/40 dark:stroke-gray-600/40 stroke-1"/>)))}
                        {Array(8).fill(0).map((_, i) => Array(8).fill(0).map((_, j) => (<line key={`h1-h2-${i}-${j}`} x1={260} y1={55 + i * 40} x2={540} y2={55 + j * 40} className="stroke-gray-400/40 dark:stroke-gray-600/40 stroke-1"/>)))}
                        {Array(8).fill(0).map((_, i) => Array(3).fill(0).map((_, j) => (<line key={`h2-out-${i}-${j}`} x1={560} y1={55 + i * 40} x2={690} y2={150 + j * 50} className="stroke-gray-400/40 dark:stroke-gray-600/40 stroke-1"/>)))}
                        {Array(15).fill(0).map((_, i) => (<circle key={`quantum-${i}`} cx={390 + (Math.random() * 2 - 1) * 40} cy={200 + (Math.random() * 2 - 1) * 40} r={2 + Math.random() * 3} className="fill-purple-500"><animate attributeName="opacity" values="0;1;0" dur={`${1 + Math.random() * 2}s`} repeatCount="indefinite" /><animate attributeName="r" values={`${2 + Math.random() * 3};${4 + Math.random() * 5};${2 + Math.random() * 3}`} dur={`${1 + Math.random() * 2}s`} repeatCount="indefinite" /></circle>))}
                        {Array(8).fill(0).map((_, i) => (<line key={`h1-q-${i}`} x1={260} y1={55 + i * 40} x2={330} y2={200} className="stroke-purple-500/60 stroke-[1.5]"/>))}
                        {Array(8).fill(0).map((_, i) => (<line key={`q-h2-${i}`} x1={450} y1={200} x2={540} y2={55 + i * 40} className="stroke-purple-500/60 stroke-[1.5]"/>))}
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>ZPE Flow Effect</CardTitle><CardDescription>Performance impact of quantum noise strength</CardDescription></CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={zpeFlowEffectData}>
                        <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--chart-1))" name="Accuracy" />
                        <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--destructive))" name="Overfitting" />
                        <Tooltip /><Legend/>
                        <Line yAxisId="left" type="monotone" dataKey="Accuracy" stroke="hsl(var(--chart-1))" />
                        <Line yAxisId="right" type="monotone" dataKey="Overfitting" stroke="hsl(var(--destructive))" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Performance Across Layers</CardTitle><CardDescription>ZPE effect on different network depths</CardDescription></CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performanceAcrossLayersData}>
                        <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" />
                        <YAxis /><Tooltip /><Legend/>
                        <Bar dataKey="With Quantum" fill="hsl(var(--chart-2))" />
                        <Bar dataKey="Without Quantum" fill="hsl(var(--muted-foreground))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Implementation Details</CardTitle>
                <CardDescription>Code snippets for quantum noise integration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-md p-4 overflow-auto">
                  <pre className="text-xs md:text-sm font-mono text-foreground">
{`# Generating quantum noise using cirq
def generate_quantum_noise(num_channels, zpe_idx):
    qubits_per_run = 32
    # ... (rest of cirq code snippet) ...
    return torch.tensor(perturbation, device=self.device, dtype=torch.float32)`}
                  </pre>
                </div>
                <div className="mt-6 grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3"><Activity className="h-8 w-8 text-blue-500 mt-0.5" /><div><h3 className="font-medium">Application in Forward Pass</h3><p className="text-sm text-muted-foreground mt-1">Quantum noise is applied during the forward pass by modulating activation functions.</p></div></div>
                  <div className="flex items-start gap-3"><Braces className="h-8 w-8 text-green-500 mt-0.5" /><div><h3 className="font-medium">Parameter Updates</h3><p className="text-sm text-muted-foreground mt-1">ZPE flow momentum is updated with quantum perturbations.</p></div></div>
                  <div className="flex items-start gap-3"><Boxes className="h-8 w-8 text-purple-500 mt-0.5" /><div><h3 className="font-medium">Layer-specific Effects</h3><p className="text-sm text-muted-foreground mt-1">Layers receive tailored quantum noise according to sensitivity.</p></div></div>
                  <div className="flex items-start gap-3"><Atom className="h-8 w-8 text-orange-500 mt-0.5" /><div><h3 className="font-medium">Coupling Mechanism</h3><p className="text-sm text-muted-foreground mt-1">Covariance matrices establish correlations between channels.</p></div></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

