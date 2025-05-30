"use client";
import React, { useState, useEffect } from "react";
// import { ModelConfig, PerformanceMetric } from "@/entities/all"; // Commented out
import type { ModelConfig, PerformanceMetric } from "@/types/entities";
import { 
  BarChart3, Gauge, ArrowUp, ChevronDown, ChevronUp, Zap, CheckCircle, XCircle, DownloadCloud 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns"; // Make sure date-fns is installed

export default function PerformancePage() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [configs, setConfigs] = useState<ModelConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeConfig, setActiveConfig] = useState<ModelConfig | null>(null);
  const [comparisonConfig, setComparisonConfig] = useState<ModelConfig | null>(null);
  const [metricType, setMetricType] = useState<"accuracy" | "loss">("accuracy");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // const performanceMetricsData = await PerformanceMetric.list(); // COMMENTED OUT
        // const modelConfigsData = await ModelConfig.list(); // COMMENTED OUT
        const performanceMetricsData: PerformanceMetric[] = []; // Placeholder
        const modelConfigsData: ModelConfig[] = []; // Placeholder
        
        setMetrics(performanceMetricsData);
        setConfigs(modelConfigsData);
        
        if (modelConfigsData.length > 0) {
          setActiveConfig(modelConfigsData[0]);
          if (modelConfigsData.length > 1) {
            setComparisonConfig(modelConfigsData[1]);
          }
        } else {
            // If no real configs, set up activeConfig with demo data structure for generateEpochData
            setActiveConfig({
                id: "demo-active", name: "Demo Active Config", accuracy: 97.5,
                channel_sizes: [], zpe_momentum: [], zpe_strength: [], zpe_noise: [], zpe_coupling: [], use_quantum_noise: true, date_created: new Date().toISOString()
            });
            setComparisonConfig({
                id: "demo-comparison", name: "Demo Comparison Config", accuracy: 96.8,
                channel_sizes: [], zpe_momentum: [], zpe_strength: [], zpe_noise: [], zpe_coupling: [], use_quantum_noise: false, date_created: new Date().toISOString()
            });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const generateEpochData = (configId: string | undefined, numEpochs = 40): PerformanceMetric[] => {
    const result: PerformanceMetric[] = [];
    let baseAccuracy = 90; let baseLoss = 0.6;
    if (configId === "demo-active") { baseAccuracy += 1.5; baseLoss -= 0.08; } 
    else if (configId === "demo-comparison") { baseAccuracy += 1; baseLoss -= 0.05; }

    for (let epoch = 1; epoch <= numEpochs; epoch++) {
      const epochProgress = epoch / numEpochs;
      const accuracyGain = 8 * (1 - Math.exp(-3 * epochProgress));
      const lossDrop = 0.55 * (1 - Math.exp(-4 * epochProgress));
      const accuracyNoise = (Math.random() - 0.5) * 0.3;
      const lossNoise = (Math.random() - 0.5) * 0.02;
      const zpeEffectBase = 0.2 + 0.6 * (1 - Math.exp(-2 * epochProgress)) + (Math.random() - 0.5) * 0.05;
      const accuracy = baseAccuracy + accuracyGain + accuracyNoise;
      const validationAccuracy = accuracy - (Math.random() * 0.6);
      const loss = Math.max(0.02, baseLoss - lossDrop + lossNoise);
      const validationLoss = loss + (Math.random() * 0.04);
      const zpeEffects = Array(6).fill(0).map((_, i) => {
        const layerFactor = [0.4, 0.7, 1.2, 1.0, 0.6, 0.5][i];
        return zpeEffectBase * layerFactor * (0.8 + Math.random() * 0.4);
      });
      result.push({
        epoch, config_id: configId || "unknown", training_loss: loss, validation_loss: validationLoss,
        training_accuracy: accuracy, validation_accuracy: validationAccuracy,
        zpe_effects: zpeEffects, avg_zpe_effect: zpeEffects.reduce((a, b) => a + b, 0) / zpeEffects.length,
        timestamp: new Date(Date.now() - (numEpochs - epoch) * 3600000).toISOString(),
        date: new Date(Date.now() - (numEpochs - epoch) * 3600000).toISOString()
      });
    }
    return result;
  };

  const getConfigMetrics = (configId?: string) => {
    if (!configId) return generateEpochData("default-demo"); // Default demo if no configId
    const configMetricsData = metrics.filter(m => m.config_id === configId);
    return configMetricsData.length > 0 ? configMetricsData : generateEpochData(configId);
  };

  const getLastEpochMetrics = (configId?: string) => {
    const configMetricsData = getConfigMetrics(configId);
    if (configMetricsData.length === 0) return null;
    return configMetricsData.sort((a, b) => b.epoch - a.epoch)[0];
  };

  const compareConfigs = () => {
    if (!activeConfig || !comparisonConfig) return { diff: 0, isImprovement: false, percentChange: 0 };
    const activeMetrics = getLastEpochMetrics(activeConfig.id);
    const comparisonMetrics = getLastEpochMetrics(comparisonConfig.id);
    if (!activeMetrics || !comparisonMetrics) return { diff: 0, isImprovement: false, percentChange: 0 };
    const activeValue = activeMetrics[metricType === "accuracy" ? "validation_accuracy" : "validation_loss"] || 0;
    const comparisonValue = comparisonMetrics[metricType === "accuracy" ? "validation_accuracy" : "validation_loss"] || 0;
    const diff = metricType === "accuracy" ? (activeValue - comparisonValue) : (comparisonValue - activeValue);
    return { diff, isImprovement: diff > 0, percentChange: comparisonValue !== 0 ? (Math.abs(diff) / Math.abs(comparisonValue)) * 100 : 0 };
  };

  const getTrainingCurveData = () => {
    if (!activeConfig ) return []; // Only show active if no comparison
    const activeMetrics = getConfigMetrics(activeConfig.id);
    const comparisonMetrics = comparisonConfig ? getConfigMetrics(comparisonConfig.id) : [];
    const maxEpochs = Math.max(
      activeMetrics.length > 0 ? Math.max(...activeMetrics.map(m => m.epoch)) : 0,
      comparisonMetrics.length > 0 ? Math.max(...comparisonMetrics.map(m => m.epoch)) : 0
    );
    const result = []; const stepSize = Math.max(1, Math.ceil(maxEpochs / 20));
    for (let epoch = 1; epoch <= maxEpochs; epoch += stepSize) {
      const activeM = activeMetrics.find(m=>m.epoch === epoch) || activeMetrics.reduce((c,m)=>Math.abs(m.epoch-epoch)<Math.abs(c.epoch-epoch)?m:c, activeMetrics[0]||{epoch:0, training_accuracy:0, validation_accuracy:0, training_loss:0});
      const compareM = comparisonConfig ? (comparisonMetrics.find(m=>m.epoch === epoch) || comparisonMetrics.reduce((c,m)=>Math.abs(m.epoch-epoch)<Math.abs(c.epoch-epoch)?m:c, comparisonMetrics[0]||{epoch:0, training_accuracy:0, validation_accuracy:0, training_loss:0})) : null;
      
      const dataPoint: any = { epoch, [`${activeConfig.name} Train`]: activeM?.training_accuracy, [`${activeConfig.name} Val`]: activeM?.validation_accuracy, [`${activeConfig.name} Loss`]: activeM?.training_loss };
      if (compareM && comparisonConfig) {
        dataPoint[`${comparisonConfig.name} Train`] = compareM.training_accuracy;
        dataPoint[`${comparisonConfig.name} Val`] = compareM.validation_accuracy;
        dataPoint[`${comparisonConfig.name} Loss`] = compareM.training_loss;
      }
      result.push(dataPoint);
    }
    return result;
  };
  
  const getZPEEffectData = () => {
    if (!activeConfig) return [];
    const lastEpochMetric = getLastEpochMetrics(activeConfig.id);
    if (!lastEpochMetric || !lastEpochMetric.zpe_effects) return [];
    return lastEpochMetric.zpe_effects.map((effect, index) => ({ name: `Layer ${index + 1}`, value: effect }));
  };

  const getModelHealth = () => {
    if (!activeConfig) return { status: "unknown", metrics: {} as any };
    const configMetricsData = getConfigMetrics(activeConfig.id);
    if (configMetricsData.length === 0) return { status: "unknown", metrics: {} as any };
    const sortedMetrics = [...configMetricsData].sort((a, b) => a.epoch - b.epoch);
    const firstEpochMetric = sortedMetrics[0];
    const lastEpochMetric = sortedMetrics[sortedMetrics.length - 1];
    if(!firstEpochMetric || !lastEpochMetric) return { status: "unknown", metrics: {} as any };
    const epochsDiff = lastEpochMetric.epoch - firstEpochMetric.epoch;
    const accuracyDiff = (lastEpochMetric.validation_accuracy || 0) - (firstEpochMetric.validation_accuracy || 0);
    const convergenceRate = epochsDiff > 0 ? accuracyDiff / epochsDiff : 0;
    const overfittingGap = (lastEpochMetric.training_accuracy || 0) - (lastEpochMetric.validation_accuracy || 0);
    const zpeImpact = lastEpochMetric.zpe_effects ? lastEpochMetric.zpe_effects.reduce((s, v) => s + v, 0) / lastEpochMetric.zpe_effects.length : 0;
    let status = "healthy";
    if (overfittingGap > 5) status = "overfitting";
    else if (convergenceRate < 0.05 && epochsDiff > 5) status = "slow_convergence"; // Ensure enough epochs for this check
    else if ((lastEpochMetric.validation_accuracy || 0) < 90) status = "underperforming";
    return { status, metrics: { convergenceRate, overfittingGap, zpeImpact, finalAccuracy: lastEpochMetric.validation_accuracy, finalLoss: lastEpochMetric.validation_loss } };
  };

  const getConfusionMatrixData = () => { /* ... as in your code ... */ 
      const accuracyBase = activeConfig ? (activeConfig.accuracy || 95) / 100 : 0.95;
      const matrix = [];
      for (let actual = 0; actual < 10; actual++) {
        const row = []; const classAccuracy = Math.min(0.99, Math.max(0.7, accuracyBase + (Math.random() - 0.5) * 0.1));
        for (let predicted = 0; predicted < 10; predicted++) {
          if (actual === predicted) { row.push(Math.round(100 * classAccuracy)); } 
          else {
            const confusablePairs: Record<number, number[]> = { 1: [7], 2: [7], 3: [8, 5], 4: [9], 5: [3, 6], 6: [8, 5], 7: [1], 8: [3, 6, 0], 9: [4, 7], 0: [8, 6] };
            let errorProb = confusablePairs[actual]?.includes(predicted) ? Math.random() * (1 - classAccuracy) * 0.7 : Math.random() * (1 - classAccuracy) * 0.1;
            row.push(Math.round(errorProb * 100));
          }
        }
        const rowSum = row.reduce((sum, val) => sum + val, 0);
        if (rowSum !== 100 && row[actual] !== undefined) { row[actual] += (100 - rowSum); }
        matrix.push(row);
      }
      return matrix;
  };

  const getSummaryMetrics = () => { /* ... as in your code ... */ 
    if (!activeConfig) return [];
    const lastMetrics = getLastEpochMetrics(activeConfig.id);
    if (!lastMetrics) return [];
    const health = getModelHealth();
    return [
      { title: "Validation Accuracy", value: `${(lastMetrics.validation_accuracy || 0).toFixed(2)}%`, icon: CheckCircle, description: "Final model performance", change: "+2.3% from baseline", changeType: "positive" },
      { title: "ZPE Impact", value: `+${(health.metrics.zpeImpact || 0).toFixed(2)}`, icon: Zap, description: "Zero-point energy effect", change: (health.metrics.zpeImpact || 0) > 0.3 ? "Strong" : "Moderate", changeType: (health.metrics.zpeImpact || 0) > 0.3 ? "positive" : "neutral" },
      { title: "Overfitting Gap", value: `${(health.metrics.overfittingGap || 0).toFixed(2)}%`, icon: Gauge, description: "Train-validation difference", change: (health.metrics.overfittingGap || 0) < 2 ? "Minimal" : (health.metrics.overfittingGap || 0) < 5 ? "Acceptable" : "High", changeType: (health.metrics.overfittingGap || 0) < 5 ? "positive" : "negative" },
      { title: "Convergence Rate", value: `${((health.metrics.convergenceRate || 0) * 100).toFixed(2)}%`, icon: ArrowUp, description: "Accuracy gain per epoch", change: (health.metrics.convergenceRate || 0) > 0.2 ? "Fast" : (health.metrics.convergenceRate || 0) > 0.1 ? "Normal" : "Slow", changeType: (health.metrics.convergenceRate || 0) > 0.1 ? "positive" : "negative" }
    ];
  };

  const modelHealth = getModelHealth();
  const confusionMatrix = getConfusionMatrixData();
  const summaryMetrics = getSummaryMetrics();
  const comparisonResult = compareConfigs();
  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
  const accuracyColors = { train: 'hsl(var(--primary))', validation: 'hsl(var(--chart-2))' };
  const lossColors = { train: 'hsl(var(--chart-3))', validation: 'hsl(var(--destructive))' };

  if (isLoading) return <div className="p-6 text-center">Loading performance data...</div>;

  return (
    <div className="p-6 bg-background text-foreground">
      <div className="max-w-7xl mx-auto">
        {/* ... rest of the JSX from your Performance.js, unchanged ... */}
        <div className="flex flex-col space-y-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Model Performance</h1>
          <p className="text-muted-foreground">Comprehensive analysis of model training and accuracy metrics</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {summaryMetrics.map((metric, i) => (
            <Card key={i}><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">{metric.title}</CardTitle><metric.icon className={`h-4 w-4 ${metric.changeType === "positive" ? "text-green-500" : metric.changeType === "negative" ? "text-red-500" : "text-amber-500"}`} /></CardHeader><CardContent><div className="text-2xl font-bold">{metric.value}</div><p className="text-xs text-muted-foreground flex items-center gap-1">{metric.changeType === "positive" ? <ChevronUp className="h-3 w-3 text-green-500" /> : metric.changeType === "negative" ? <ChevronDown className="h-3 w-3 text-red-500" /> : null}{metric.change}</p></CardContent></Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-6 mb-6">
          <Card className="md:col-span-4"><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Training Progress</CardTitle><CardDescription>Performance metrics over training epochs</CardDescription></div><Tabs defaultValue="accuracy" onValueChange={(val) => setMetricType(val as "accuracy" | "loss")}><TabsList><TabsTrigger value="accuracy">Accuracy</TabsTrigger><TabsTrigger value="loss">Loss</TabsTrigger></TabsList></Tabs></CardHeader>
            <CardContent className="pt-0"><div className="h-[350px]"><ResponsiveContainer width="100%" height="100%">
              {metricType === "accuracy" ? (<LineChart data={getTrainingCurveData()}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="epoch" /><YAxis domain={[80, 100]} /><Tooltip /><Legend />
                  <Line type="monotone" dataKey={`${activeConfig?.name || 'Config A'} Train`} stroke={accuracyColors.train} strokeWidth={2}/>
                  <Line type="monotone" dataKey={`${activeConfig?.name || 'Config A'} Val`} stroke={accuracyColors.validation} strokeWidth={2}/>
                  {comparisonConfig && <> <Line type="monotone" dataKey={`${comparisonConfig?.name || 'Config B'} Train`} stroke={accuracyColors.train} strokeDasharray="5 5"/> <Line type="monotone" dataKey={`${comparisonConfig?.name || 'Config B'} Val`} stroke={accuracyColors.validation} strokeDasharray="5 5"/> </>}
              </LineChart>) : 
              (<LineChart data={getTrainingCurveData()}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="epoch" /><YAxis domain={[0, 'auto']} /><Tooltip /><Legend />
                  <Line type="monotone" dataKey={`${activeConfig?.name || 'Config A'} Loss`} stroke={lossColors.train} strokeWidth={2}/>
                  {comparisonConfig && <Line type="monotone" dataKey={`${comparisonConfig?.name || 'Config B'} Loss`} stroke={lossColors.train} strokeDasharray="5 5"/>}
              </LineChart>)}
            </ResponsiveContainer></div></CardContent>
          </Card>
          <Card className="md:col-span-2"><CardHeader><CardTitle>Configuration Comparison</CardTitle><CardDescription>Performance delta between configs</CardDescription></CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-4">
              <div className="text-center space-y-1"><h3 className="text-lg font-medium">{activeConfig?.name || 'Config A'} vs {comparisonConfig?.name || 'Config B'}</h3><div className={`text-4xl font-bold ${comparisonResult.isImprovement ? "text-green-500" : "text-red-500"}`}>{comparisonResult.isImprovement ? "+" : ""}{(comparisonResult.diff || 0).toFixed(2)}{metricType === "accuracy" ? "%" : ""}</div><p className="text-sm text-muted-foreground">{(comparisonResult.percentChange || 0).toFixed(1)}% {comparisonResult.isImprovement ? "improvement" : "decline"}</p></div>
              <div className="w-32 h-32"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={[{name: activeConfig?.name || 'Config A', value: 100 + ((comparisonResult.percentChange || 0) * (comparisonResult.isImprovement ? 1 : -1))}, {name: comparisonConfig?.name || 'Config B', value: 100 }]} cx="50%" cy="50%" innerRadius={30} outerRadius={60} paddingAngle={5} dataKey="value"><Cell fill={comparisonResult.isImprovement ? "#22c55e" : "#ef4444"} /><Cell fill="#64748b" /></Pie></PieChart></ResponsiveContainer></div>
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="text-center"><div className="text-sm font-medium">{activeConfig?.name || 'Config A'}</div><div className="text-2xl font-semibold">{metricType === "accuracy" ? `${((getLastEpochMetrics(activeConfig?.id)?.validation_accuracy || 0)).toFixed(2)}%`: ((getLastEpochMetrics(activeConfig?.id)?.validation_loss || 0)).toFixed(4)}</div></div>
                <div className="text-center"><div className="text-sm font-medium">{comparisonConfig?.name || 'Config B'}</div><div className="text-2xl font-semibold">{metricType === "accuracy" ? `${((getLastEpochMetrics(comparisonConfig?.id)?.validation_accuracy || 0)).toFixed(2)}%`: ((getLastEpochMetrics(comparisonConfig?.id)?.validation_loss || 0)).toFixed(4)}</div></div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Tabs defaultValue="detailed" className="space-y-6"><TabsList><TabsTrigger value="detailed">Detailed Analysis</TabsTrigger><TabsTrigger value="confusion">Confusion Matrix</TabsTrigger><TabsTrigger value="zpe">ZPE Effects</TabsTrigger></TabsList>
          <TabsContent value="detailed"><div className="grid gap-6 md:grid-cols-2"><Card><CardHeader><CardTitle>Model Health Assessment</CardTitle><CardDescription>Analysis of model training stability and performance</CardDescription></CardHeader>
                <CardContent className="pt-0"><div className="flex items-center justify-between mb-6">
                    <div className="text-center"><h3 className="text-sm font-medium text-muted-foreground">Status</h3><div className="mt-1 flex items-center gap-2"><Badge className={modelHealth.status === "healthy" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : modelHealth.status === "overfitting" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"}>{modelHealth.status === "healthy" ? "Healthy" : modelHealth.status === "overfitting" ? "Overfitting" : modelHealth.status === "slow_convergence" ? "Slow Convergence" : modelHealth.status === "underperforming" ? "Underperforming" : "Unknown"}</Badge></div></div>
                    <div className="text-center"><h3 className="text-sm font-medium text-muted-foreground">Training Epochs</h3><div className="mt-1 text-2xl font-bold">{getConfigMetrics(activeConfig?.id).length}</div></div>
                    <div className="text-center"><h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3><div className="mt-1 text-sm">{getLastEpochMetrics(activeConfig?.id)?.date ? format(new Date(getLastEpochMetrics(activeConfig?.id)!.date!), "MMM d, yyyy") : "Unknown"}</div></div>
                  </div><div className="space-y-4"><div><h3 className="text-sm font-medium mb-2">Performance Trajectory</h3><div className="h-52"><ResponsiveContainer width="100%" height="100%"><AreaChart data={getConfigMetrics(activeConfig?.id).map(m => ({epoch: m.epoch, accuracy: m.validation_accuracy, training: m.training_accuracy}))}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="epoch" /><YAxis domain={[85, 100]} /><Tooltip /><Area type="monotone" dataKey="training" strokeWidth={0} fill="hsl(var(--primary), 0.4)" /><Area type="monotone" dataKey="accuracy" fill="hsl(var(--chart-2), 0.4)" stroke="hsl(var(--chart-2))" /></AreaChart></ResponsiveContainer></div></div>
                    <div><h3 className="text-sm font-medium mb-2">Model Analysis</h3><Table><TableBody>
                          <TableRow><TableCell className="font-medium">Train-Val Gap</TableCell><TableCell>{(modelHealth.metrics.overfittingGap || 0).toFixed(2)}%</TableCell><TableCell className="text-right"><Badge variant="outline" className={modelHealth.metrics.overfittingGap < 2 ? "bg-green-100 dark:bg-green-900/30" : modelHealth.metrics.overfittingGap < 5 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-red-100 dark:bg-red-900/30"}>{modelHealth.metrics.overfittingGap < 2 ? "Excellent" : modelHealth.metrics.overfittingGap < 5 ? "Good" : "Needs Attention"}</Badge></TableCell></TableRow>
                          <TableRow><TableCell className="font-medium">ZPE Impact</TableCell><TableCell>+{(modelHealth.metrics.zpeImpact || 0).toFixed(2)}</TableCell><TableCell className="text-right"><Badge variant="outline" className={(modelHealth.metrics.zpeImpact || 0) > 0.3 ? "bg-green-100 dark:bg-green-900/30" : (modelHealth.metrics.zpeImpact || 0) > 0.1 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-red-100 dark:bg-red-900/30"}>{(modelHealth.metrics.zpeImpact || 0) > 0.3 ? "Strong" : (modelHealth.metrics.zpeImpact || 0) > 0.1 ? "Moderate" : "Weak"}</Badge></TableCell></TableRow>
                          <TableRow><TableCell className="font-medium">Convergence</TableCell><TableCell>{((modelHealth.metrics.convergenceRate || 0) * 100).toFixed(2)}% per epoch</TableCell><TableCell className="text-right"><Badge variant="outline" className={(modelHealth.metrics.convergenceRate || 0) > 0.2 ? "bg-green-100 dark:bg-green-900/30" : (modelHealth.metrics.convergenceRate || 0) > 0.1 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-red-100 dark:bg-red-900/30"}>{(modelHealth.metrics.convergenceRate || 0) > 0.2 ? "Fast" : (modelHealth.metrics.convergenceRate || 0) > 0.1 ? "Normal" : "Slow"}</Badge></TableCell></TableRow>
                    </TableBody></Table></div></div></CardContent>
                <CardFooter className="justify-between border-t pt-5"><div className="flex items-center gap-2"><Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">{activeConfig?.name || "Current Config"}</Badge></div><Button variant="outline" disabled><DownloadCloud className="w-4 h-4 mr-2" />Export Analysis</Button></CardFooter></Card>
              <Card><CardHeader><CardTitle>Training Metrics Log</CardTitle><CardDescription>Detailed performance data by epoch</CardDescription></CardHeader>
                <CardContent className="p-0"><div className="max-h-[500px] overflow-y-auto"><Table><TableHeader className="sticky top-0 bg-card z-10"><TableRow><TableHead>Epoch</TableHead><TableHead>Train Acc.</TableHead><TableHead>Val. Acc.</TableHead><TableHead>Loss</TableHead><TableHead>ZPE Effect</TableHead></TableRow></TableHeader>
                      <TableBody>{getConfigMetrics(activeConfig?.id).sort((a, b) => b.epoch - a.epoch).map((metric, i) => (<TableRow key={i}><TableCell className="font-medium">{metric.epoch}</TableCell><TableCell>{(metric.training_accuracy || 0).toFixed(2)}%</TableCell><TableCell className="font-medium">{(metric.validation_accuracy || 0).toFixed(2)}%</TableCell><TableCell>{(metric.training_loss || 0).toFixed(4)}</TableCell><TableCell><div className="flex items-center gap-2"><div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2"><div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.min(100, (metric.avg_zpe_effect || 0) * 100 * 2)}%` }}/></div><span>{(metric.avg_zpe_effect || 0).toFixed(2)}</span></div></TableCell></TableRow>))}</TableBody>
                </Table></div></CardContent></Card></div></TabsContent>
          <TabsContent value="confusion"><Card><CardHeader><CardTitle>Confusion Matrix</CardTitle><CardDescription>Classification accuracy across different classes</CardDescription></CardHeader>
                <CardContent><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead className="w-10"></TableHead>{Array(10).fill(0).map((_, i) => (<TableHead key={i} className="text-center">Predicted {i}</TableHead>))}</TableRow></TableHeader>
                      <TableBody>{confusionMatrix.map((row, actual) => (<TableRow key={actual}><TableCell className="font-bold">Actual {actual}</TableCell>{row.map((value, predicted) => (<TableCell key={predicted} className={`text-center ${actual === predicted ? 'bg-green-100 dark:bg-green-900/30 font-bold' : value > 5 ? 'bg-red-100 dark:bg-red-900/30' : value > 0 ? 'bg-amber-50 dark:bg-amber-900/10' : ''}`}>{value}%</TableCell>))}</TableRow>))}</TableBody>
                </Table></div><div className="grid md:grid-cols-3 gap-6 mt-8">
                    <div><h3 className="text-lg font-medium mb-2">Class Performance</h3><div className="h-60"><ResponsiveContainer width="100%" height="100%"><BarChart data={confusionMatrix.map((row, i) => ({name: i.toString(), accuracy: row[i]}))}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="accuracy" fill="hsl(var(--chart-2))" /></BarChart></ResponsiveContainer></div></div>
                    <div><h3 className="text-lg font-medium mb-2">Error Distribution</h3><div className="h-60"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={[{ name: "Correct", value: activeConfig?.accuracy || 98.7 },{ name: "Errors", value: 100 - (activeConfig?.accuracy || 98.7) }]} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}><Cell fill="hsl(var(--chart-2))" /><Cell fill="hsl(var(--destructive))" /></Pie><Tooltip /></PieChart></ResponsiveContainer></div></div>
                    <div><h3 className="text-lg font-medium mb-2">Common Confusions</h3><Table><TableHeader><TableRow><TableHead>Actual</TableHead><TableHead>Predicted</TableHead><TableHead>Rate</TableHead></TableRow></TableHeader><TableBody>{confusionMatrix.flatMap((row, actual) => row.map((value, predicted) => actual !== predicted && value > 2 ? { actual, predicted, value } : null).filter(Boolean)).sort((a,b) => b.value - a.value).slice(0,5).map((error, i) => (<TableRow key={i}><TableCell>{error!.actual}</TableCell><TableCell>{error!.predicted}</TableCell><TableCell><Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">{error!.value}%</Badge></TableCell></TableRow>))}</TableBody></Table></div>
                </div></CardContent></Card></TabsContent>
          <TabsContent value="zpe"><div className="grid gap-6 md:grid-cols-2"><Card><CardHeader><CardTitle>ZPE Effects By Layer</CardTitle><CardDescription>Zero-point energy influence across network</CardDescription></CardHeader>
                <CardContent><div className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={getZPEEffectData()}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="hsl(var(--chart-4))" /></BarChart></ResponsiveContainer></div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-6">{getZPEEffectData().map((data, i) => (<div key={i} className="text-center"><div className="text-xs text-muted-foreground mb-1">{data.name}</div><div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1"><div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.min(100, data.value * 200)}%` }}/></div><span className="text-xs font-medium">{data.value.toFixed(2)}</span></div>))}</div>
                </CardContent></Card>
              <Card><CardHeader><CardTitle>ZPE Evolution</CardTitle><CardDescription>Changes in ZPE impact during training</CardDescription></CardHeader>
                <CardContent><div className="h-80"><ResponsiveContainer width="100%" height="100%"><LineChart data={getConfigMetrics(activeConfig?.id).map(m => ({epoch: m.epoch, "Layer 1": m.zpe_effects[0], "Layer 2": m.zpe_effects[1], "Layer 3": m.zpe_effects[2], "Layer 4": m.zpe_effects[3], "Layer 5": m.zpe_effects[4], "Layer 6": m.zpe_effects[5]}))}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="epoch" /><YAxis /><Tooltip /><Legend />
                        {["Layer 1", "Layer 2", "Layer 3", "Layer 4", "Layer 5", "Layer 6"].map((layer, i) => (<Line key={layer} type="monotone" dataKey={layer} stroke={COLORS[i % COLORS.length]} />))}</LineChart></ResponsiveContainer></div>
                  <div className="mt-6"><h3 className="text-sm font-medium mb-2">ZPE Impact Analysis</h3><div className="text-sm text-muted-foreground space-y-2"><p>ZPE effects show strongest influence in the middle layers (3 and 4), where feature complexity is highest. Effects grow steadily through training, stabilizing in later epochs.</p><p>The quantum noise injection in layer 4 shows particularly strong effects, with a {(Math.random() * 20 + 15).toFixed(1)}% contribution to overall accuracy improvement.</p></div></div>
                </CardContent></Card></div></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
