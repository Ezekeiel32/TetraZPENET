"use client";
import React, { useState, useEffect } from "react";
// import { ModelConfig } from "@/entities/all"; // Commented out
import type { ModelConfig } from "@/types/entities";
import { 
  Gauge, 
  Shield, 
  Braces, 
  Zap,
  PlusCircle,
  MinusCircle,
  ArrowUpDown
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Assuming Tabs are used or planned
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ZpeFlowVisualization from "@/components/zpe/ZpeFlowVisualization"; // Adjusted path

export default function ZpeFlowAnalysisPage() {
  const [configs, setConfigs] = useState<ModelConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<ModelConfig | null>(null);
  const [simulatedParams, setSimulatedParams] = useState({
    momentum: [0.9, 0.85, 0.8, 0.75, 0.7, 0.65],
    strength: [0.35, 0.33, 0.31, 0.60, 0.27, 0.50],
    noise: [0.3, 0.28, 0.26, 0.35, 0.22, 0.25],
    coupling: [0.85, 0.82, 0.79, 0.76, 0.73, 0.7]
  });
  const [activeParam, setActiveParam] = useState<"momentum" | "strength" | "noise" | "coupling">("momentum");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // const modelConfigsData = await ModelConfig.list(); // COMMENTED OUT
        const modelConfigsData: ModelConfig[] = []; // Using empty array as placeholder
        setConfigs(modelConfigsData);
        if (modelConfigsData.length > 0) {
          setSelectedConfig(modelConfigsData[0]);
          if (modelConfigsData[0].zpe_momentum && modelConfigsData[0].zpe_momentum.length > 0) {
            setSimulatedParams({
              momentum: modelConfigsData[0].zpe_momentum,
              strength: modelConfigsData[0].zpe_strength,
              noise: modelConfigsData[0].zpe_noise,
              coupling: modelConfigsData[0].zpe_coupling
            });
          }
        } else {
          // Use default simulatedParams if no configs are loaded
           setSimulatedParams({
            momentum: [0.9, 0.85, 0.8, 0.75, 0.7, 0.65],
            strength: [0.35, 0.33, 0.31, 0.60, 0.27, 0.50],
            noise: [0.3, 0.28, 0.26, 0.35, 0.22, 0.25],
            coupling: [0.85, 0.82, 0.79, 0.76, 0.73, 0.7]
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
         setSimulatedParams({ // Fallback to default on error
            momentum: [0.9, 0.85, 0.8, 0.75, 0.7, 0.65],
            strength: [0.35, 0.33, 0.31, 0.60, 0.27, 0.50],
            noise: [0.3, 0.28, 0.26, 0.35, 0.22, 0.25],
            coupling: [0.85, 0.82, 0.79, 0.76, 0.73, 0.7]
          });
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const handleParamChange = (value: number[]) => {
    setSimulatedParams(prev => {
      const newParamsList = [...prev[activeParam]];
      newParamsList[activeIndex] = value[0];
      return { ...prev, [activeParam]: newParamsList };
    });
  };

  const getEstimatedAccuracy = () => {
    const baseAccuracy = 96.5;
    const momentumEffect = simulatedParams.momentum.reduce((sum, val) => sum + (val - 0.75) * 2, 0);
    const strengthEffect = simulatedParams.strength.reduce((sum, val) => sum + Math.sin(val * 10) * 0.5, 0);
    const noiseEffect = simulatedParams.noise.reduce((sum, val) => sum - Math.abs(val - 0.25) * 3, 0);
    const couplingEffect = simulatedParams.coupling.reduce((sum, val) => sum + (val - 0.7) * 1.5, 0);
    const totalEffect = momentumEffect + strengthEffect + noiseEffect + couplingEffect;
    const nonLinearBoost = (simulatedParams.momentum[3] || 0) * (simulatedParams.strength[3] || 0) * 2;
    const accuracy = baseAccuracy + totalEffect + nonLinearBoost;
    return Math.min(99.2, Math.max(95.0, accuracy)).toFixed(2);
  };

  const paramLabels: Record<string, string> = {
    momentum: "Momentum", strength: "Strength", noise: "Noise", coupling: "Coupling"
  };

  const getParamDescription = (param: string) => {
    const descriptions: Record<string, string> = {
      momentum: "Controls how much previous ZPE states influence the current state",
      strength: "Determines the magnitude of the ZPE perturbation effect",
      noise: "Regulates the stochastic component of the ZPE flow",
      coupling: "Defines how strongly ZPE effects are coupled across channels"
    };
    return descriptions[param] || "";
  };

  const getColorClass = (param: string) => {
    const colors: Record<string, string> = {
      momentum: "text-blue-500", strength: "text-purple-500",
      noise: "text-orange-500", coupling: "text-green-500"
    };
    return colors[param] || "text-gray-500";
  };
  
  const getChartColor = (param: string) => {
    const chartColors: Record<string, string> = {
      momentum: "hsl(var(--chart-1))", strength: "hsl(var(--chart-2))",
      noise: "hsl(var(--chart-3))", coupling: "hsl(var(--chart-4))"
    };
    return chartColors[param] || "hsl(var(--chart-5))";
  };

  const getBgColorClass = (param: string) => {
     const bgColors: Record<string, string> = {
      momentum: "bg-blue-100 dark:bg-blue-900/30", strength: "bg-purple-100 dark:bg-purple-900/30",
      noise: "bg-orange-100 dark:bg-orange-900/30", coupling: "bg-green-100 dark:bg-green-900/30"
    };
    return bgColors[param] || "bg-gray-100 dark:bg-gray-800/30";
  };

  const generateLayerImpactData = () => {
    return (simulatedParams[activeParam] || []).map((value, idx) => {
      const baseImpact = value * 5;
      const nonLinearFactor = Math.sin(value * Math.PI) * 2;
      let impact = baseImpact + nonLinearFactor;
      impact *= (1 + (idx % 3) * 0.1); // Arbitrary variation
      return { name: `Layer ${idx + 1}`, value: impact };
    });
  };

  const generateResponseCurve = () => {
    const parameter = activeParam;
    const points = 10; const data = []; let min, max;
    switch(parameter) {
      case "momentum": [min, max] = [0.5, 1.0]; break;
      case "strength": [min, max] = [0.1, 0.8]; break;
      case "noise": [min, max] = [0.1, 0.5]; break;
      case "coupling": [min, max] = [0.5, 1.0]; break;
      default: [min, max] = [0, 1];
    }
    for (let i = 0; i < points; i++) {
      const value = min + (max - min) * (i / (points - 1));
      let response;
      switch(parameter) {
        case "momentum": response = 0.7 + Math.pow(value, 2) * 0.3; break;
        case "strength": response = Math.sin(value * 7) * 0.3 + 0.7; break;
        case "noise": response = 1 - Math.pow(value - 0.25, 2) * 5; break;
        case "coupling": response = value * 0.8 + Math.sin(value * 5) * 0.2; break;
        default: response = value;
      }
      const currentParamValue = simulatedParams[parameter]?.[activeIndex] ?? 0;
      const stability = 1 - Math.abs(value - currentParamValue) * 2;
      data.push({ name: value.toFixed(2), "Response": response, "Stability": Math.max(0, Math.min(1, stability)) });
    }
    return data;
  };
  
  if (isLoading) {
    return <div className="p-6 text-center">Loading ZPE Flow Analysis data...</div>;
  }

  return (
    <div className="p-6 bg-background text-foreground">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col space-y-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">ZPE Flow Analysis</h1>
          <p className="text-muted-foreground">
            Explore and modify the Zero-Point Energy flow parameters across network layers
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Parameters</CardTitle>
                <CardDescription>Select parameter to modify</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.keys(paramLabels).map(param => (
                    <div
                      key={param}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        activeParam === param ? getBgColorClass(param) : "hover:bg-muted"
                      }`}
                      onClick={() => setActiveParam(param as any)}
                    >
                      <div className="flex items-center gap-2">
                        {param === "momentum" && <Braces className={`h-5 w-5 ${getColorClass(param)}`} />}
                        {param === "strength" && <Zap className={`h-5 w-5 ${getColorClass(param)}`} />}
                        {param === "noise" && <Shield className={`h-5 w-5 ${getColorClass(param)}`} />}
                        {param === "coupling" && <ArrowUpDown className={`h-5 w-5 ${getColorClass(param)}`} />}
                        <span className="font-medium">{paramLabels[param]}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getParamDescription(param)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estimated Performance</CardTitle>
                <CardDescription>Based on current parameters</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className="text-3xl font-bold">{getEstimatedAccuracy()}%</div>
                  <p className="text-sm text-muted-foreground mt-1">Accuracy</p>
                </div>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">ZPE Effect</TableCell>
                      <TableCell className="text-right">
                        {(parseFloat(getEstimatedAccuracy()) - 96.5).toFixed(2)}%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Stability</TableCell>
                      <TableCell className="text-right">
                        {(0.85 + Math.random() * 0.1).toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Convergence</TableCell>
                      <TableCell className="text-right">
                        {(0.9 + Math.random() * 0.09).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Gauge className="h-5 w-5 text-primary" />
                      {paramLabels[activeParam]} ZPE Flow
                    </CardTitle>
                    <CardDescription>
                      Adjust the parameters for each layer
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className={`${getBgColorClass(activeParam)} border-0 text-foreground`}>
                    Layer {activeIndex + 1} Selected
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-8">
                  <ZpeFlowVisualization 
                    values={simulatedParams[activeParam]} 
                    activeIndex={activeIndex}
                    setActiveIndex={setActiveIndex}
                    paramType={activeParam}
                  />
                </div>
                <div className="pt-4 border-t">
                  <Label className="mb-6 block">
                    Adjust {paramLabels[activeParam]} for Layer {activeIndex + 1}
                  </Label>
                  <div className="flex items-center gap-4">
                    <MinusCircle className="h-5 w-5 text-muted-foreground" />
                    <Slider
                      value={[simulatedParams[activeParam]?.[activeIndex] ?? 0]}
                      max={1}
                      step={0.01}
                      onValueChange={handleParamChange}
                      className="flex-1"
                    />
                    <PlusCircle className="h-5 w-5 text-muted-foreground" />
                    <span className="font-mono font-medium w-12 text-right">
                      {(simulatedParams[activeParam]?.[activeIndex] ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Layer Impact Analysis</CardTitle>
                  <CardDescription>
                    Effect of {paramLabels[activeParam]} across layers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={generateLayerImpactData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill={getChartColor(activeParam)} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Parameter Response Curve</CardTitle>
                  <CardDescription>
                    Model response to different {paramLabels[activeParam]} values
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={generateResponseCurve()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend/>
                        <Line type="monotone" dataKey="Response" stroke={getChartColor(activeParam)} />
                        <Line type="monotone" dataKey="Stability" stroke="hsl(var(--muted-foreground))" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
