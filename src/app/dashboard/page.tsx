"use client";
import React, { useState, useEffect } from "react";
// import { ModelConfig, PerformanceMetric } from "@/entities/all"; // Commented out
import type { ModelConfig, PerformanceMetric } from "@/types/entities"; // Using existing types
import { 
  BarChart3, 
  Atom, 
  CircuitBoard, 
  TrendingUp, 
  Zap,
  Brain // Added Brain
} from "lucide-react"; // Removed Gauge, ArrowUp, ArrowRight as they are not used in this specific file
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

import ModelSummary from "@/components/dashboard/ModelSummary";
import LatestPerformance from "@/components/dashboard/LatestPerformance";

export default function Dashboard() {
  const [configs, setConfigs] = useState<ModelConfig[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // eslint-disable-line @typescript-eslint/no-unused-vars

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // const modelConfigsData = await ModelConfig.list(); // Your entity/data fetching logic - COMMENTED OUT
        // const performanceMetricsData = await PerformanceMetric.list(); // Your entity/data fetching logic - COMMENTED OUT
        
        // Using empty arrays as placeholders since actual fetching is commented out
        const modelConfigsData: ModelConfig[] = []; 
        const performanceMetricsData: PerformanceMetric[] = [];

        setConfigs(modelConfigsData);
        setMetrics(performanceMetricsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setConfigs([]); 
        setMetrics([]);
      }
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const generateDemoData = () => {
    if (!isLoading && configs.length === 0) {
      return {
        accuracy: 98.7,
        layers: 6,
        parameters: "3.2M",
        bestConfig: "ZPE-Q3",
        improvement: 2.4,
        quantumEffect: 1.8
      };
    }
    
    if (configs.length > 0) {
        const sortedConfigs = [...configs].sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0));
        const bestConfig = sortedConfigs[0];
        return {
            accuracy: bestConfig?.accuracy || 98.7,
            layers: bestConfig?.channel_sizes?.length || 6, // Example: get layers from channel_sizes
            parameters: "3.2M", // This would ideally come from model analysis
            bestConfig: bestConfig?.name || "ZPE-Q3",
            improvement: 2.4, // Example, would calculate based on history
            quantumEffect: 1.8 // Example, would calculate if quantum model
        };
    }
    
    return { 
      accuracy: 98.7,
      layers: 6,
      parameters: "3.2M",
      bestConfig: "ZPE-Q3",
      improvement: 2.4,
      quantumEffect: 1.8
    };
  };

  const demoData = generateDemoData();

  const accuracyData = [
    { name: "Baseline CNN", value: 96.3 },
    { name: "ZPE Network", value: 97.9 },
    { name: "ZPE + Quantum", value: demoData.accuracy }
  ];

  const generateChartData = () => {
    const data = [];
    for (let i = 0; i < 15; i++) {
      data.push({
        name: `Epoch ${i+1}`,
        "ZPE Effect": 0.2 + Math.random() * 0.1,
        "Quantum Noise": 0.15 + Math.random() * 0.15,
        "Accuracy": 95 + Math.random() * 3.5
      });
    }
    return data;
  };

  const chartData = generateChartData();

  const zpeFlowLabels = ["Layer 1", "Layer 2", "Layer 3", "Layer 4", "FC 1", "FC 2"];
  const zpeFlowValues = [0.9, 0.85, 0.8, 0.75, 0.7, 0.65];
  const zpeFlowData = zpeFlowLabels.map((label, index) => ({
    name: label,
    value: zpeFlowValues[index]
  }));

  if (isLoading && configs.length === 0) { 
    return <div className="p-6 text-center"><p>Loading dashboard data...</p></div>;
  }

  return (
    <div className="p-6 bg-background text-foreground">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col space-y-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Quantum ZPE Network Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and analyze the Zero-Point Energy neural network with quantum fluctuations
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Accuracy
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{demoData.accuracy}%</div>
              <p className="text-xs text-muted-foreground">
                +{demoData.improvement}% from baseline model
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Model Architecture
              </CardTitle>
              <CircuitBoard className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{demoData.layers} Layers</div>
              <p className="text-xs text-muted-foreground">
                {demoData.parameters} parameters
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Quantum Effect
              </CardTitle>
              <Atom className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{demoData.quantumEffect}%</div>
              <p className="text-xs text-muted-foreground">
                Contribution from quantum noise
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Best Configuration
              </CardTitle>
              <Zap className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{demoData.bestConfig}</div>
              <p className="text-xs text-muted-foreground">
                Latest experiment
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="mt-6" onValueChange={setActiveTab}>
          <TabsList className="grid w-full md:w-auto grid-cols-3 md:grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="quantum">Quantum Effects</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="lg:col-span-4">
                <CardHeader>
                  <CardTitle>Performance Comparison</CardTitle>
                  <CardDescription>
                    Comparison between different model configurations
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={accuracyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[95, 100]} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Accuracy" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>ZPE Flow Parameters</CardTitle>
                  <CardDescription>
                    Momentum values across network layers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={zpeFlowData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0.5, 1]} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Momentum" fill="hsl(var(--accent))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Training Progress</CardTitle>
                  <CardDescription>
                    ZPE effects and accuracy over training
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="h-[384px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="ZPE Effect" stroke="hsl(var(--primary))" />
                        <Line type="monotone" dataKey="Quantum Noise" stroke="hsl(var(--accent))" />
                        <Line type="monotone" dataKey="Accuracy" stroke="hsl(var(--chart-2))" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <ModelSummary />
            </div>
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-4">
            <LatestPerformance />
          </TabsContent>
          
          <TabsContent value="quantum" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Quantum Noise Distribution</CardTitle>
                  <CardDescription>
                    Generated quantum noise patterns
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={Array(30).fill(0).map((_, i) => ({
                          name: `Sample ${i+1}`,
                          value: Math.tanh((Math.random() * 2 - 1) * 0.6) * 0.5 + 0.5
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="value" fill="hsl(var(--accent))" stroke="hsl(var(--accent))" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>ZPE Strength Impact</CardTitle>
                  <CardDescription>
                    Effect of ZPE strength on model performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={Array(6).fill(0).map((_, i) => {
                          const strength = 0.25 + i * 0.05;
                          return {
                            name: strength.toFixed(2),
                            "Accuracy": 96 + Math.sin(strength * 10) * 2.5,
                            "Stability": 0.8 - Math.cos(strength * 8) * 0.15
                          };
                        })}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="Accuracy" stroke="hsl(var(--primary))" />
                        <Line type="monotone" dataKey="Stability" stroke="hsl(var(--chart-2))" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
