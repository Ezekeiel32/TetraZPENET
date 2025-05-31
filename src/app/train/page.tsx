
"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useForm, Controller, Control, FieldPath, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { TrainingParameters, TrainingJob, TrainingJobSummary } from "@/types/training";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Play, StopCircle, List, Zap, Settings, RefreshCw, AlertTriangle, CheckCircle, ExternalLink } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useRouter, useSearchParams } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

const trainingFormSchema = z.object({
  modelName: z.string().min(3, "Model name must be at least 3 characters"),
  totalEpochs: z.coerce.number().int().min(1).max(200),
  batchSize: z.coerce.number().int().min(8).max(256),
  learningRate: z.coerce.number().min(0.00001).max(0.1),
  weightDecay: z.coerce.number().min(0).max(0.1),
  momentumParams: z.array(z.coerce.number().min(0).max(1)).length(6, "Must have 6 momentum values"),
  strengthParams: z.array(z.coerce.number().min(0).max(1)).length(6, "Must have 6 strength values"),
  noiseParams: z.array(z.coerce.number().min(0).max(1)).length(6, "Must have 6 noise values"),
  quantumCircuitSize: z.coerce.number().int().min(4).max(64),
  labelSmoothing: z.coerce.number().min(0).max(0.5),
  quantumMode: z.boolean(),
  baseConfigId: z.string().nullable().optional(), // Updated to allow null
});

const defaultZPEParams = {
  momentum: [0.9, 0.85, 0.8, 0.75, 0.7, 0.65],
  strength: [0.35, 0.33, 0.31, 0.60, 0.27, 0.50],
  noise: [0.3, 0.28, 0.26, 0.35, 0.22, 0.25],
};

export default function TrainModelPage() {
  const [activeJob, setActiveJob] = useState<TrainingJob | null>(null);
  const [jobsList, setJobsList] = useState<TrainingJobSummary[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pollingIntervalId, setPollingIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillEffectRan = useRef(false);

  const defaultFormValues: TrainingParameters = {
    modelName: "ZPE-Sim-V1",
    totalEpochs: 30,
    batchSize: 32,
    learningRate: 0.001,
    weightDecay: 0.0001,
    momentumParams: defaultZPEParams.momentum,
    strengthParams: defaultZPEParams.strength,
    noiseParams: defaultZPEParams.noise,
    quantumCircuitSize: 32,
    labelSmoothing: 0.1,
    quantumMode: true,
    baseConfigId: undefined,
  };

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<TrainingParameters>({
    resolver: zodResolver(trainingFormSchema),
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    if (prefillEffectRan.current || typeof window === 'undefined') return;

    const prefillJobId = searchParams.get("prefill");
    const paramsToPrefill: Partial<TrainingParameters> = {};
    let hasDirectParams = false;

    // Check for direct parameters from query
    for (const key in defaultFormValues) {
        if (searchParams.has(key)) {
            hasDirectParams = true;
            const value = searchParams.get(key);
            if (value !== null) {
                if (Array.isArray(defaultFormValues[key as keyof TrainingParameters])) {
                    try {
                        (paramsToPrefill as any)[key] = JSON.parse(value);
                    } catch (e) {
                        console.error(`Error parsing query param ${key}:`, e);
                        toast({ title: "Prefill Error", description: `Could not parse ${key} from URL. Using default.`, variant: "destructive" });
                    }
                } else if (typeof defaultFormValues[key as keyof TrainingParameters] === 'number') {
                    (paramsToPrefill as any)[key] = parseFloat(value);
                } else if (typeof defaultFormValues[key as keyof TrainingParameters] === 'boolean') {
                    (paramsToPrefill as any)[key] = value === 'true';
                } else {
                    (paramsToPrefill as any)[key] = value;
                }
            }
        }
    }
    
    const loadAndPrefill = async () => {
      if (hasDirectParams) {
          toast({ title: "Pre-filling form...", description: "Loading parameters from URL." });
          // Validate and reset
          const validatedParams = trainingFormSchema.safeParse({...defaultFormValues, ...paramsToPrefill});
          if (validatedParams.success) {
              reset(validatedParams.data);
              toast({ title: "Form Pre-filled", description: "Parameters loaded from URL." });
          } else {
              console.error("Direct prefill validation error:", validatedParams.error);
              toast({ title: "Prefill Validation Error", description: "Some parameters from URL were invalid. Defaults used where necessary.", variant: "destructive" });
              reset({...defaultFormValues, ...paramsToPrefill}); // Reset with what we have, let validation show errors
          }
      } else if (prefillJobId) {
          toast({ title: "Pre-filling form...", description: `Loading parameters from job ${prefillJobId.slice(-6)}` });
          try {
            const response = await fetch(`${API_BASE_URL}/status/${prefillJobId}`);
            if (!response.ok) {
              throw new Error(`Failed to fetch job details for prefill: ${response.statusText}`);
            }
            const jobToPrefill: TrainingJob = await response.json();
            
            const paramsWithNewNameAndBaseId = {
                ...jobToPrefill.parameters,
                modelName: `${jobToPrefill.parameters.modelName}_retrain_${Date.now().toString().slice(-4)}`,
                baseConfigId: prefillJobId,
            };
            
            const validatedParams = trainingFormSchema.safeParse(paramsWithNewNameAndBaseId);
            if (validatedParams.success) {
                reset(validatedParams.data);
                toast({ title: "Form Pre-filled", description: `Loaded parameters from job ${jobToPrefill.parameters.modelName}. Model name updated.` });
            } else {
                console.error("Job prefill validation error:", validatedParams.error);
                let errorMessages = "Validation errors: ";
                validatedParams.error.errors.forEach(err => {
                    errorMessages += `${err.path.join('.')}: ${err.message}. `;
                });
                throw new Error(`Parameters from job ${prefillJobId.slice(-6)} are not valid. ${errorMessages}`);
            }
          } catch (e: any) {
            console.error("Error pre-filling form from job ID:", e);
            toast({ title: "Pre-fill Failed", description: e.message, variant: "destructive" });
          }
      }
      prefillEffectRan.current = true;
    };

    if (hasDirectParams || prefillJobId) {
        loadAndPrefill();
    } else {
        prefillEffectRan.current = true; // Mark as run even if no prefill params
    }

  }, [searchParams, reset]);


  const fetchJobsList = useCallback(async () => {
    setIsLoadingJobs(true);
    try {
      const response = await fetch(API_BASE_URL + '/jobs?limit=20');
      if (!response.ok) throw new Error("Failed to fetch jobs list");
      const data = await response.json();
      setJobsList(data.jobs || []);
    } catch (error) {
      toast({ title: "Error fetching jobs", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingJobs(false);
    }
  }, []);

  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/status/${jobId}`);
      if (!response.ok) {
        if (pollingIntervalId) clearInterval(pollingIntervalId);
        setPollingIntervalId(null);
        throw new Error(`Failed to fetch job status for ${jobId}`);
      }
      const jobData: TrainingJob = await response.json();
      setActiveJob(jobData);
      
      if (jobData.status === "running" || jobData.status === "completed") {
        setChartData(prev => {
          const newPoint = { 
            epoch: jobData.current_epoch, 
            accuracy: jobData.accuracy, 
            loss: jobData.loss,
            avg_zpe: jobData.zpe_effects && jobData.zpe_effects.length > 0 ? jobData.zpe_effects.reduce((a,b)=>a+b,0) / (jobData.zpe_effects.length) : 0
          };
          const existingPointIndex = prev.findIndex(p => p.epoch === newPoint.epoch);
          if (existingPointIndex > -1) {
            const updatedPrev = [...prev];
            updatedPrev[existingPointIndex] = newPoint;
            return updatedPrev;
          }
          return [...prev, newPoint].sort((a,b) => a.epoch - b.epoch);
        });
      }

      if (jobData.status === "completed" || jobData.status === "failed" || jobData.status === "stopped") {
        if (pollingIntervalId) clearInterval(pollingIntervalId);
        setPollingIntervalId(null);
        fetchJobsList(); 
        toast({ title: `Job ${jobData.status}`, description: `Job ${jobId} finished with status: ${jobData.status}. Accuracy: ${jobData.accuracy.toFixed(2)}%` });
      }
    } catch (error) {
      toast({ title: "Error polling job status", description: (error as Error).message, variant: "destructive" });
      if (pollingIntervalId) clearInterval(pollingIntervalId);
      setPollingIntervalId(null);
    }
  }, [pollingIntervalId, fetchJobsList]);

  useEffect(() => {
    fetchJobsList();
    return () => {
      if (pollingIntervalId) clearInterval(pollingIntervalId);
    };
  }, [fetchJobsList, pollingIntervalId]);

  const onSubmit = async (data: TrainingParameters) => {
    setIsSubmitting(true);
    setChartData([]); 
    try {
      const response = await fetch(`${API_BASE_URL}/train`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to start training job");
      const result = await response.json();
      setActiveJob({
        job_id: result.job_id,
        status: "pending",
        current_epoch: 0,
        total_epochs: data.totalEpochs,
        accuracy: 0,
        loss: 0,
        zpe_effects: [],
        log_messages: [`Job ${result.job_id} submitted.`],
        parameters: data,
      });
      const intervalId = setInterval(() => pollJobStatus(result.job_id), 2000);
      setPollingIntervalId(intervalId);
      fetchJobsList(); 
      toast({ title: "Training Started", description: `Job ID: ${result.job_id}` });
    } catch (error) {
      toast({ title: "Error starting training", description: (error as Error).message, variant: "destructive" });
      setActiveJob(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStopJob = async (jobId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/stop/${jobId}`, { method: "POST" });
      if (!response.ok) throw new Error("Failed to stop job");
      toast({ title: "Stop Request Sent", description: `Requested stop for job ${jobId}` });
    } catch (error) {
      toast({ title: "Error stopping job", description: (error as Error).message, variant: "destructive" });
    }
  };
  
  const handleViewJobDetails = async (jobId: string) => {
    if (pollingIntervalId) clearInterval(pollingIntervalId); 
    setChartData([]); 
    const jobDetail = jobsList.find(j => j.job_id === jobId);
    if (jobDetail && jobDetail.status !== "running" && jobDetail.status !== "pending") {
      try {
        const response = await fetch(`${API_BASE_URL}/status/${jobId}`);
        if (!response.ok) throw new Error("Failed to fetch job details");
        const data: TrainingJob = await response.json();
        setActiveJob(data);
        if (data.log_messages && (data.status === "completed" || data.status === "failed" || data.status === "stopped")) {
          const parsedChartData = data.log_messages
            .map(log => {
              const match = log.match(/Epoch (\d+)\/\d+ - Accuracy: ([\d.]+)\%, Loss: ([\d.]+)/) 
                         || log.match(/E(\d+) END - TrainL: [\d.]+, ValAcc: ([\d.]+)%, ValL: ([\d.]+)/); // Added fallback match for end of epoch log
              if (match) {
                return {
                  epoch: parseInt(match[1]),
                  accuracy: parseFloat(match[2]),
                  loss: parseFloat(match[3]),
                  avg_zpe: data.zpe_effects && data.zpe_effects.length > 0 ? data.zpe_effects.reduce((a,b)=>a+b,0) / data.zpe_effects.length : 0
                };
              }
              return null;
            })
            .filter(Boolean)
            .sort((a,b) => a!.epoch - b!.epoch);

            if (parsedChartData.length > 0) {
              setChartData(parsedChartData as any[]);
            } else if (data.status === "completed") { 
               setChartData([{ epoch: data.current_epoch, accuracy: data.accuracy, loss: data.loss, avg_zpe: data.zpe_effects && data.zpe_effects.length > 0 ? data.zpe_effects.reduce((a,b)=>a+b,0) / data.zpe_effects.length : 0}]);
            }
        }
      } catch (error) {
        toast({ title: "Error fetching job details", description: (error as Error).message, variant: "destructive"});
      }
    } else { 
      pollJobStatus(jobId); 
      const intervalId = setInterval(() => pollJobStatus(jobId), 2000);
      setPollingIntervalId(intervalId);
    }
  };

  const renderParamArrayFields = (paramName: "momentumParams" | "strengthParams" | "noiseParams", labelPrefix: string) => (
    <div className="space-y-2">
      <Label className="text-base">{labelPrefix} (6 layers)</Label>
      <div className="grid grid-cols-3 gap-2">
        {(watch(paramName) || []).map((_, index) => (
          <div key={index} className="space-y-1">
            <Label htmlFor={`${paramName}.${index}`} className="text-xs">L{index + 1}</Label>
            <Controller
              name={`${paramName}.${index}` as `momentumParams.${number}` | `strengthParams.${number}` | `noiseParams.${number}`}
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    className="h-8"
                    value={typeof field.value === 'number' ? field.value : ''}
                    onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  />
                  {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
                </>
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold tracking-tight mb-8 text-primary">ZPE Model Training Orchestrator</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Training Configuration</CardTitle>
            <CardDescription>Define parameters for your ZPE model training job.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Tabs defaultValue="general">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="zpe">ZPE</TabsTrigger>
                  <TabsTrigger value="quantum">Quantum</TabsTrigger>
                </TabsList>
                <TabsContent value="general" className="space-y-3 pt-3">
                  <FieldController control={control} name="modelName" label="Model Name" placeholder="e.g., MyZPEModel_V1" />
                  <FieldController control={control} name="totalEpochs" label="Total Epochs" type="number" min="1" />
                  <FieldController control={control} name="batchSize" label="Batch Size" type="number" min="1" />
                  <FieldController control={control} name="learningRate" label="Learning Rate" type="number" step="0.0001" />
                  <FieldController control={control} name="weightDecay" label="Weight Decay" type="number" step="0.00001" />
                  <FieldController control={control} name="labelSmoothing" label="Label Smoothing" type="number" step="0.01" />
                </TabsContent>
                <TabsContent value="zpe" className="space-y-3 pt-3">
                  {renderParamArrayFields("momentumParams", "Momentum Parameters")}
                  {renderParamArrayFields("strengthParams", "Strength Parameters")}
                  {renderParamArrayFields("noiseParams", "Noise Parameters")}
                </TabsContent>
                <TabsContent value="quantum" className="space-y-3 pt-3">
                  <FieldControllerSwitch control={control} name="quantumMode" label="Enable Quantum Mode" />
                  <FieldController control={control} name="quantumCircuitSize" label="Quantum Circuit Size (Qubits)" type="number" min="1" />
                </TabsContent>
              </Tabs>
               <div className="space-y-1 pt-2">
                <Label htmlFor="baseConfigId">Base Config ID (Optional)</Label>
                <Controller
                    name="baseConfigId"
                    control={control}
                    render={({ field, fieldState }) => (
                        <>
                            <Input
                                {...field}
                                id="baseConfigId"
                                placeholder="Previous job ID to build upon"
                                value={field.value || ''}
                                className={fieldState.error ? "border-destructive" : ""}
                            />
                            {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
                        </>
                    )}
                />
                <p className="text-xs text-muted-foreground">If continuing/evolving from a previous job.</p>
              </div>
              <Button type="submit" className="w-full mt-4" disabled={isSubmitting || (activeJob?.status === "running" || activeJob?.status === "pending")}>
                {isSubmitting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                Start Training
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary"/> Training Monitor</CardTitle>
            {activeJob ? (
              <CardDescription>Status for Job ID: <span className="font-mono">{activeJob.job_id.replace('zpe_job_','')}</span> ({activeJob.parameters.modelName})</CardDescription>
            ) : (
              <CardDescription>No active training job. Start one or select from history.</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {activeJob ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant={
                    activeJob.status === "running" ? "default" :
                    activeJob.status === "completed" ? "default" : 
                    activeJob.status === "failed" || activeJob.status === "stopped" ? "destructive" : "secondary"
                  }
                  className={
                    activeJob.status === "completed" ? "bg-green-500 hover:bg-green-600 text-white" : ""
                  }
                  >
                    {activeJob.status.toUpperCase()}
                  </Badge>
                  {(activeJob.status === "running" || activeJob.status === "pending") && (
                    <Button variant="destructive" size="sm" onClick={() => handleStopJob(activeJob.job_id)}>
                      <StopCircle className="mr-2 h-4 w-4" /> Stop Job
                    </Button>
                  )}
                </div>
                <Progress value={(activeJob.current_epoch / activeJob.total_epochs) * 100} className="w-full" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <MetricDisplay label="Epoch" value={`${activeJob.current_epoch}/${activeJob.total_epochs}`} />
                  <MetricDisplay label="Accuracy" value={`${activeJob.accuracy.toFixed(2)}%`} />
                  <MetricDisplay label="Loss" value={`${activeJob.loss.toFixed(4)}`} />
                  <MetricDisplay label="Avg ZPE Effect" value={`${(activeJob.zpe_effects && activeJob.zpe_effects.length > 0 ? activeJob.zpe_effects.reduce((a,b)=>a+b,0) / activeJob.zpe_effects.length : 0).toFixed(3)}`} />
                </div>
                
                <div className="h-[250px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="epoch" name="Epoch" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis yAxisId="left" name="Accuracy" stroke="hsl(var(--primary))" fontSize={12} domain={[70,100]}/>
                      <YAxis yAxisId="right" name="Loss" orientation="right" stroke="hsl(var(--destructive))" fontSize={12} domain={[0, 'auto']}/>
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="accuracy" stroke="hsl(var(--primary))" name="Accuracy (%)" dot={false} />
                      <Line yAxisId="right" type="monotone" dataKey="loss" stroke="hsl(var(--destructive))" name="Loss" dot={false} />
                      <Line yAxisId="left" type="monotone" dataKey="avg_zpe" stroke="hsl(var(--accent))" name="Avg ZPE" dot={false} strokeDasharray="3 3"/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <Label>Logs</Label>
                <ScrollArea className="h-40 w-full rounded-md border p-2">
                  {activeJob.log_messages && activeJob.log_messages.slice().reverse().map((log, index) => (
                    <p key={index} className="text-xs font-mono">{log}</p>
                  ))}
                </ScrollArea>
              </div>
            ) : (
              <p className="text-muted-foreground">Select a job from history or start a new training session.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><List className="h-5 w-5"/> Training Job History</CardTitle>
            <CardDescription>View past and ongoing training jobs.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingJobs && <RefreshCw className="mx-auto my-4 h-6 w-6 animate-spin" />}
            {!isLoadingJobs && jobsList.length === 0 && <p className="text-muted-foreground">No training jobs found.</p>}
            {!isLoadingJobs && jobsList.length > 0 && (
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job ID</TableHead>
                      <TableHead>Model Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Accuracy</TableHead>
                      <TableHead>Epochs</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobsList.map(job => (
                      <TableRow key={job.job_id} className={activeJob?.job_id === job.job_id ? "bg-muted" : ""}>
                        <TableCell className="font-mono text-xs">{job.job_id.replace('zpe_job_', '')}</TableCell>
                        <TableCell>{job.model_name}</TableCell>
                        <TableCell>
                          <Badge variant={
                            job.status === "running" ? "default" :
                            job.status === "completed" ? "default" :
                            job.status === "failed" || job.status === "stopped" ? "destructive" : "secondary"
                          }
                          className={job.status === "completed" ? "bg-green-500 hover:bg-green-600 text-white" : ""}
                          >{job.status}</Badge>
                        </TableCell>
                        <TableCell>{job.accuracy > 0 ? `${job.accuracy.toFixed(2)}%` : '-'}</TableCell>
                        <TableCell>{`${job.current_epoch}/${job.total_epochs}`}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => handleViewJobDetails(job.job_id)}>
                            <ExternalLink className="mr-1 h-3 w-3"/>View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface FieldControllerProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  type?: string;
  placeholder?: string;
  min?: string | number;
  step?: string | number;
}

const FieldController = <TFieldValues extends FieldValues = TrainingParameters>({
  control,
  name,
  label,
  type = "text",
  placeholder,
  min,
  step,
}: FieldControllerProps<TFieldValues, FieldPath<TFieldValues>>) => (
  <div className="space-y-1">
    <Label htmlFor={name as string}>{label}</Label>
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (type === 'number') {
                const value = e.target.value;
                // Allow empty string for temporary input state, coerce to number on blur/submit
                field.onChange(value === '' ? '' : parseFloat(value));
            } else {
                field.onChange(e.target.value);
            }
        };
        return (
            <>
                <Input
                    {...field}
                    id={name as string}
                    type={type}
                    placeholder={placeholder}
                    min={min}
                    step={step}
                    // For controlled number inputs, ensure value is string or number
                    value={(type === 'number' && (typeof field.value === 'number' && !isNaN(field.value))) ? field.value : (field.value || '')}
                    onChange={handleChange}
                    className={fieldState.error ? "border-destructive" : ""}
                />
                {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
            </>
        );
    }}
    />
  </div>
);

interface FieldControllerSwitchProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
}

const FieldControllerSwitch = <TFieldValues extends FieldValues = TrainingParameters>({
  control,
  name,
  label,
}: FieldControllerSwitchProps<TFieldValues, FieldPath<TFieldValues>>) => (
  <div className="flex items-center justify-between space-x-2 border p-3 rounded-md">
    <Label htmlFor={name as string} className="cursor-pointer">{label}</Label>
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Switch
          id={name as string}
          checked={field.value as boolean}
          onCheckedChange={field.onChange}
        />
      )}
    />
  </div>
);

const MetricDisplay = ({ label, value }: { label: string; value: string | number }) => (
  <div className="bg-muted p-2 rounded-md text-center">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="font-semibold">{value}</p>
  </div>
);
