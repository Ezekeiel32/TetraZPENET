"use client";
import React, { useState, useEffect, useCallback } from "react";
// import { ModelConfig } from "@/entities/all"; // Commented out
import type { ModelConfig } from "@/types/entities";
import { 
  Settings, Plus, Trash, Copy, Eye, EyeOff, SlidersHorizontal, ChevronDown
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "@/hooks/use-toast"; // For user feedback

export default function ModelConfigurationsPage() {
  const [configs, setConfigs] = useState<ModelConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<ModelConfig | null>(null);
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [shownParameters, setShownParameters] = useState<Record<string, boolean>>({});
  
  const initialNewConfig: ModelConfig = {
    name: "",
    channel_sizes: [64, 128, 256, 512],
    zpe_momentum: [0.9, 0.85, 0.8, 0.75, 0.7, 0.65],
    zpe_strength: [0.35, 0.33, 0.31, 0.6, 0.27, 0.5],
    zpe_noise: [0.3, 0.28, 0.26, 0.35, 0.22, 0.25],
    zpe_coupling: [0.85, 0.82, 0.79, 0.76, 0.73, 0.7],
    use_quantum_noise: true,
    accuracy: 98.5, // Default placeholder accuracy
    date_created: new Date().toISOString().split('T')[0]
  };
  const [newConfig, setNewConfig] = useState<ModelConfig>(initialNewConfig);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // const modelConfigsData = await ModelConfig.list(); // COMMENTED OUT
      const modelConfigsData: ModelConfig[] = []; // Placeholder
      setConfigs(modelConfigsData);
      if (modelConfigsData.length > 0) {
        setSelectedConfig(modelConfigsData[0]);
        const initialShown: Record<string, boolean> = {};
        modelConfigsData.forEach(config => {
          if(config.id) initialShown[config.id] = false;
        });
        setShownParameters(initialShown);
      }
    } catch (error) {
      console.error("Error fetching configurations:", error);
      toast({ title: "Error", description: "Failed to fetch configurations.", variant: "destructive"});
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleParameterVisibility = (configId: string) => {
    setShownParameters(prev => ({ ...prev, [configId]: !prev[configId] }));
  };

  const handleConfigSelect = (config: ModelConfig) => { setSelectedConfig(config); };

  const handleCreateConfig = async () => {
    setIsSubmitting(true);
    try {
      const configToCreate = { ...newConfig };
      if (!configToCreate.name) {
        configToCreate.name = `ZPE-Config-${Date.now().toString().slice(-4)}`;
      }
      // const createdConfig = await ModelConfig.create(configToCreate); // COMMENTED OUT
      const createdConfig: ModelConfig = {...configToCreate, id: `demo-${Date.now()}`}; // Placeholder
      
      setConfigs(prev => [...prev, createdConfig]);
      setSelectedConfig(createdConfig);
      if(createdConfig.id) setShownParameters(prev => ({ ...prev, [createdConfig.id!]: false }));
      setNewConfig(initialNewConfig);
      setIsCreating(false);
      toast({ title: "Success", description: `Configuration "${createdConfig.name}" created.`});
    } catch (error) {
      console.error("Error creating configuration:", error);
      toast({ title: "Error", description: "Failed to create configuration.", variant: "destructive"});
    }
    setIsSubmitting(false);
  };

  const handleCloneConfig = async (config: ModelConfig) => {
    try {
      const cloned: ModelConfig = {
        ...config,
        id: undefined, // Ensure ID is not copied
        name: `${config.name}-Clone-${Date.now().toString().slice(-4)}`,
        date_created: new Date().toISOString().split('T')[0]
      };
      // const createdConfig = await ModelConfig.create(cloned); // COMMENTED OUT
      const createdConfig: ModelConfig = {...cloned, id: `demo-clone-${Date.now()}`}; // Placeholder

      setConfigs(prev => [...prev, createdConfig]);
      if(createdConfig.id) setShownParameters(prev => ({ ...prev, [createdConfig.id!]: false }));
      toast({ title: "Success", description: `Configuration "${createdConfig.name}" cloned.`});
    } catch (error) {
      console.error("Error cloning configuration:", error);
      toast({ title: "Error", description: "Failed to clone configuration.", variant: "destructive"});
    }
  };

  const confirmDeleteConfig = async () => {
    if (!selectedConfig || !selectedConfig.id) return;
    try {
      // await ModelConfig.delete(selectedConfig.id); // COMMENTED OUT
      console.log(`Simulating delete for config ID: ${selectedConfig.id}`); // Placeholder action
      
      setConfigs(prev => prev.filter(config => config.id !== selectedConfig.id));
      setSelectedConfig(configs.length > 1 ? configs.find(c => c.id !== selectedConfig.id) || null : null);
      setShowDeletePrompt(false);
      toast({ title: "Success", description: `Configuration "${selectedConfig.name}" deleted.`});
    } catch (error) {
      console.error("Error deleting configuration:", error);
      toast({ title: "Error", description: "Failed to delete configuration.", variant: "destructive"});
    }
  };

  const updateNewConfigParam = (paramType: keyof ModelConfig, index: number, value: number) => {
    setNewConfig(prev => {
      const updatedArray = [...(prev[paramType] as number[])];
      updatedArray[index] = value;
      return { ...prev, [paramType]: updatedArray };
    });
  };
  
  const formatArray = (arr?: number[]) => {
    if (!arr || !Array.isArray(arr)) return "[]";
    return `[${arr.map(v => typeof v === 'number' ? v.toFixed(2) : String(v)).join(', ')}]`;
  };

  return (
    <div className="p-6 bg-background text-foreground">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col space-y-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Model Configurations</h1>
          <p className="text-muted-foreground">Manage and compare different neural network configurations</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/3 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Configurations</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setIsCreating(!isCreating)}>
                  {isCreating ? "Cancel" : <><Plus className="h-4 w-4 mr-2" />Create New</>}
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow><TableHead>Name</TableHead><TableHead>Accuracy</TableHead><TableHead>Date</TableHead><TableHead className="w-12"></TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading && <TableRow><TableCell colSpan={4} className="text-center py-6">Loading...</TableCell></TableRow>}
                      {!isLoading && configs.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No configurations found.</TableCell></TableRow>}
                      {configs.map((config) => (
                        <TableRow key={config.id} className={`cursor-pointer hover:bg-muted/50 ${selectedConfig?.id === config.id ? 'bg-muted' : ''}`} onClick={() => handleConfigSelect(config)}>
                          <TableCell className="font-medium"><div className="flex items-center gap-2"><Settings className="h-4 w-4 text-muted-foreground" />{config.name}</div></TableCell>
                          <TableCell><span className="font-mono">{config.accuracy}%</span></TableCell>
                          <TableCell>{format(new Date(config.date_created), "MMM d, yyyy")}</TableCell>
                          <TableCell><Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); config.id && toggleParameterVisibility(config.id); }}>{config.id && shownParameters[config.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
            
            {isCreating && (
              <Card>
                <CardHeader><CardTitle>Create New Configuration</CardTitle><CardDescription>Define parameters for a new model configuration</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label htmlFor="config-name">Name</Label><Input id="config-name" placeholder="Config Name" value={newConfig.name} onChange={(e) => setNewConfig(prev => ({ ...prev, name: e.target.value }))}/></div>
                  <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="quantum-noise">Use Quantum Noise</Label><Switch id="quantum-noise" checked={newConfig.use_quantum_noise} onCheckedChange={(checked) => setNewConfig(prev => ({ ...prev, use_quantum_noise: checked }))}/></div></div>
                  <Tabs defaultValue="momentum" className="mt-6">
                    <TabsList className="grid grid-cols-4">
                      <TabsTrigger value="momentum">Momentum</TabsTrigger><TabsTrigger value="strength">Strength</TabsTrigger>
                      <TabsTrigger value="noise">Noise</TabsTrigger><TabsTrigger value="coupling">Coupling</TabsTrigger>
                    </TabsList>
                    {["momentum", "strength", "noise", "coupling"].map((param) => (
                      <TabsContent key={param} value={param} className="space-y-4 mt-2">
                        {(newConfig[`zpe_${param}` as keyof ModelConfig] as number[]).map((value, idx) => (
                          <div key={idx} className="space-y-2">
                            <div className="flex justify-between"><Label>Layer {idx + 1}</Label><span className="font-mono text-sm">{value.toFixed(2)}</span></div>
                            <Slider min={0} max={1} step={0.01} value={[value]} onValueChange={(newValue) => updateNewConfigParam(`zpe_${param}` as keyof ModelConfig, idx, newValue[0])}/>
                          </div>
                        ))}
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
                <CardFooter className="border-t pt-6"><Button onClick={handleCreateConfig} className="w-full" disabled={isSubmitting}>{isSubmitting ? "Creating..." : <><Plus className="h-4 w-4 mr-2" />Create</>}</Button></CardFooter>
              </Card>
            )}
          </div>
          
          <div className="w-full lg:w-2/3 space-y-6">
            {selectedConfig ? (
              <>
                <Card>
                  <CardHeader className="flex flex-row justify-between">
                    <div><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-primary" />{selectedConfig.name}</CardTitle><CardDescription>Created on {format(new Date(selectedConfig.date_created), "MMMM d, yyyy")}</CardDescription></div>
                    <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => handleCloneConfig(selectedConfig)}><Copy className="h-4 w-4 mr-2" />Clone</Button><Button variant="destructive" size="sm" onClick={() => setShowDeletePrompt(true)}><Trash className="h-4 w-4 mr-2" />Delete</Button></div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-muted rounded-lg p-4 flex flex-col items-center justify-center"><Badge className="mb-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Accuracy</Badge><div className="text-3xl font-bold">{selectedConfig.accuracy}%</div></div>
                      <div className="bg-muted rounded-lg p-4 flex flex-col items-center justify-center"><Badge className="mb-2 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">Quantum</Badge><div className="text-3xl font-bold">{selectedConfig.use_quantum_noise ? <CheckCircle className="h-6 w-6 text-green-500" /> : <XCircle className="h-6 w-6 text-red-500" />}</div></div>
                      <div className="bg-muted rounded-lg p-4 flex flex-col items-center justify-center"><Badge className="mb-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Channels</Badge><div className="text-lg font-mono">{selectedConfig.channel_sizes?.join('-') || "N/A"}</div></div>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="p-4 border-b bg-muted/50 flex items-center justify-between"><div className="font-semibold">Parameter Summary</div><Badge variant="outline">6 layers</Badge></div>
                      <Table><TableHeader><TableRow><TableHead>Parameter</TableHead><TableHead>Values</TableHead><TableHead>Range</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {(["momentum", "strength", "noise", "coupling"] as const ).map(paramKey => (
                            <TableRow key={paramKey}>
                              <TableCell className="font-medium capitalize">ZPE {paramKey}</TableCell>
                              <TableCell className="font-mono text-xs">{formatArray(selectedConfig[`zpe_${paramKey}` as keyof ModelConfig] as number[] | undefined)}</TableCell>
                              <TableCell className="font-mono">{(selectedConfig[`zpe_${paramKey}` as keyof ModelConfig] as number[] | undefined) ? `${Math.min(...(selectedConfig[`zpe_${paramKey}` as keyof ModelConfig] as number[])).toFixed(2)} - ${Math.max(...(selectedConfig[`zpe_${paramKey}` as keyof ModelConfig] as number[])).toFixed(2)}` : 'N/A'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Parameter Visualization</CardTitle><CardDescription>Visual representation of ZPE parameters across layers</CardDescription></CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div><h3 className="text-sm font-medium mb-4 text-muted-foreground">Values by Layer</h3><div className="space-y-6">
                        {(["momentum", "strength", "noise", "coupling"] as const).map((param) => (<Collapsible key={param}>
                            <CollapsibleTrigger asChild><div className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer">
                                <div className="flex items-center gap-2">
                                  {param === "momentum" && <SlidersHorizontal className="h-4 w-4 text-blue-500" />}
                                  {param === "strength" && <Zap className="h-4 w-4 text-purple-500" />}
                                  {param === "noise" && <Atom className="h-4 w-4 text-orange-500" />}
                                  {param === "coupling" && <Settings className="h-4 w-4 text-green-500" />}
                                  <span className="font-medium capitalize">{param}</span></div><ChevronDown className="h-4 w-4 text-muted-foreground" /></div></CollapsibleTrigger>
                            <CollapsibleContent><div className="pl-8 pr-2 pb-2 space-y-2">
                                {(selectedConfig[`zpe_${param}` as keyof ModelConfig] as number[] | undefined)?.map((value, idx) => (<div key={idx} className="flex items-center gap-2">
                                    <div className="w-24 text-xs">Layer {idx + 1}</div><div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${param === "momentum" ? "bg-blue-500" : param === "strength" ? "bg-purple-500" : param === "noise" ? "bg-orange-500" : "bg-green-500"}`} style={{ width: `${value * 100}%` }}></div></div>
                                    <div className="w-12 text-right font-mono text-xs">{value.toFixed(2)}</div></div>))}</div></CollapsibleContent></Collapsible>))}</div></div>
                      <div><h3 className="text-sm font-medium mb-4 text-muted-foreground">Relationships</h3><div className="aspect-square bg-muted/50 rounded-lg flex items-center justify-center p-4">
                          <svg width="100%" height="100%" viewBox="0 0 400 400">{/* SVG content from original code */}
                            <circle cx="200" cy="200" r="150" fill="none" stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="5,5" />
                            <circle cx="200" cy="200" r="100" fill="none" stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="5,5" />
                            <circle cx="200" cy="200" r="50" fill="none" stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="5,5" />
                            <line x1="50" y1="200" x2="350" y2="200" stroke="hsl(var(--border))" strokeWidth="1" /><line x1="200" y1="50" x2="200" y2="350" stroke="hsl(var(--border))" strokeWidth="1" />
                            <text x="355" y="205" fill="hsl(var(--muted-foreground))" fontSize="10" textAnchor="start">Strength</text><text x="200" y="45" fill="hsl(var(--muted-foreground))" fontSize="10" textAnchor="middle">Momentum</text>
                            <text x="45" y="205" fill="hsl(var(--muted-foreground))" fontSize="10" textAnchor="end">Noise</text><text x="200" y="360" fill="hsl(var(--muted-foreground))" fontSize="10" textAnchor="middle">Coupling</text>
                            {(selectedConfig.zpe_momentum)?.map((momentum, idx) => {
                              const strength = (selectedConfig.zpe_strength)?.[idx] ?? 0; const noise = (selectedConfig.zpe_noise)?.[idx] ?? 0; const coupling = (selectedConfig.zpe_coupling)?.[idx] ?? 0;
                              const x = 200 + (strength - noise) * 140; const y = 200 + (coupling - momentum) * 140; /* Scaled to 140 to fit better */
                              return (<g key={idx}><circle cx={x} cy={y} r={6} fill={idx === 3 && selectedConfig.use_quantum_noise ? "hsl(var(--chart-2))" : "hsl(var(--chart-1))"} fillOpacity="0.7"/><text x={x} y={y - 8} fill="hsl(var(--foreground))" fontSize="10" textAnchor="middle">L{idx+1}</text></g>);
                            })}
                          </svg></div></div></div>
                    <div className="mt-8 border-t pt-6"><h3 className="text-sm font-medium mb-4">Parameter Notes</h3><div className="grid md:grid-cols-2 gap-4 text-sm"><div className="space-y-2"><p className="text-muted-foreground"><span className="font-medium text-foreground">Momentum:</span> Controls smoothness of ZPE flow updates.</p><p className="text-muted-foreground"><span className="font-medium text-foreground">Strength:</span> Magnitude of ZPE perturbation.</p></div><div className="space-y-2"><p className="text-muted-foreground"><span className="font-medium text-foreground">Noise:</span> Stochastic components of ZPE flow.</p><p className="text-muted-foreground"><span className="font-medium text-foreground">Coupling:</span> Correlation between channels.</p></div></div></div>
                  </CardContent></Card></>) 
            : (<Card><CardContent className="flex flex-col items-center justify-center py-16"><Settings className="h-16 w-16 text-muted-foreground/50 mb-4" /><h3 className="text-xl font-medium mb-2">No Configuration Selected</h3><p className="text-muted-foreground text-center max-w-md">Select or create a configuration to view details.</p><Button className="mt-6" onClick={() => setIsCreating(true)}><Plus className="h-4 w-4 mr-2" />Create Configuration</Button></CardContent></Card>)}
          </div>
        </div>
        
        {showDeletePrompt && selectedConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="max-w-md w-full shadow-xl"><CardHeader><CardTitle className="text-destructive">Confirm Deletion</CardTitle><CardDescription>Delete "{selectedConfig.name}"? This cannot be undone.</CardDescription></CardHeader><CardFooter className="flex justify-end gap-3 border-t pt-6"><Button variant="outline" onClick={() => setShowDeletePrompt(false)}>Cancel</Button><Button variant="destructive" onClick={confirmDeleteConfig}><Trash className="h-4 w-4 mr-2" />Delete</Button></CardFooter></Card>
          </div>)}
      </div>
    </div>
  );
}
