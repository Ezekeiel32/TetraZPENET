
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod"; // Import Zod
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { adviseHSQNNParameters, type HSQNNAdvisorInput, type HSQNNAdvisorOutput } from "@/ai/flows/hs-qnn-parameter-advisor";
import type { TrainingParameters, TrainingJob, TrainingJobSummary } from "@/types/training";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrainCircuit, Lightbulb, Terminal, Wand2, ArrowRight, RefreshCw, SlidersHorizontal } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

// Define TrainingParametersSchema locally for client-side validation
const TrainingParametersSchema = z.object({
  totalEpochs: z.number().int().min(1).max(200),
  batchSize: z.number().int().min(8).max(256),
  learningRate: z.number().min(0.00001).max(0.1),
  weightDecay: z.number().min(0).max(0.1),
  momentumParams: z.array(z.number().min(0).max(1)).length(6),
  strengthParams: z.array(z.number().min(0).max(1)).length(6),
  noiseParams: z.array(z.number().min(0).max(1)).length(6),
  quantumCircuitSize: z.number().int().min(4).max(64),
  labelSmoothing: z.number().min(0).max(0.5),
  quantumMode: z.boolean(),
  modelName: z.string().min(3),
  baseConfigId: z.string().optional(),
});

// Define HSQNNAdvisorInputSchema locally for client-side validation
const HSQNNAdvisorInputSchema = z.object({
  previousJobId: z.string().min(1, "Please select a previous job."),
  // The actual previousZpeEffects and previousTrainingParameters will be fetched and passed directly to the AI flow,
  // so they are not part of the form schema directly validated here.
  // They are part of the HSQNNAdvisorInput type for the AI call.
  hnnObjective: z.string().min(20, "Objective must be at least 20 characters long.").max(500, "Objective is too long."),
});


const advisorFormSchema = HSQNNAdvisorInputSchema; // Use the locally defined schema

type AdvisorFormValues = z.infer<typeof advisorFormSchema>;

export default function HSQNNParameterAdvisorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [jobsList, setJobsList] = useState<TrainingJobSummary[]>([]);
  const [selectedJobDetails, setSelectedJobDetails] = useState<TrainingJob | null>(null);
  const [adviceResult, setAdviceResult] = useState<HSQNNAdvisorOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<AdvisorFormValues>({
    resolver: zodResolver(advisorFormSchema),
    defaultValues: {
      previousJobId: "",
      hnnObjective: "Maximize validation accuracy while maintaining ZPE effects for all layers between 0.05 and 0.15. Explore slight increase in learning rate if previous accuracy was high.",
    },
  });

  const watchedJobId = watch("previousJobId");

  const fetchJobsList = useCallback(async () => {
    setIsLoadingJobs(true);
    try {
      const response = await fetch(`${API_BASE_URL}/jobs?limit=50`);
      if (!response.ok) throw new Error("Failed to fetch jobs list");
      const data = await response.json();
      const completedJobs = (data.jobs || []).filter((job: TrainingJobSummary) => job.status === "completed")
        .sort((a: TrainingJobSummary, b: TrainingJobSummary) => new Date(b.start_time || 0).getTime() - new Date(a.start_time || 0).getTime());
      setJobsList(completedJobs);
      
      const preselectJobId = searchParams.get("jobId");
      if (preselectJobId && completedJobs.find(j => j.job_id === preselectJobId)) {
        setValue("previousJobId", preselectJobId);
      } else if (completedJobs.length > 0 && !watchedJobId) {
         setValue("previousJobId", completedJobs[0].job_id); 
      }

    } catch (e: any) {
      toast({ title: "Error fetching jobs", description: e.message, variant: "destructive" });
    } finally {
      setIsLoadingJobs(false);
    }
  }, [setValue, searchParams, watchedJobId]);

  useEffect(() => {
    fetchJobsList();
  }, [fetchJobsList]);

  useEffect(() => {
    if (watchedJobId) {
      const fetchJobDetails = async () => {
        setIsLoading(true);
        setAdviceResult(null); // Clear previous advice when job changes
        try {
          const response = await fetch(`${API_BASE_URL}/status/${watchedJobId}`);
          if (!response.ok) throw new Error(`Failed to fetch details for job ${watchedJobId}`);
          const data: TrainingJob = await response.json();
          setSelectedJobDetails(data);
          setError(null);
        } catch (e: any) {
          setSelectedJobDetails(null);
          setError(e.message);
          toast({ title: "Error fetching job details", description: e.message, variant: "destructive" });
        } finally {
          setIsLoading(false);
        }
      };
      fetchJobDetails();
    } else {
      setSelectedJobDetails(null);
      setAdviceResult(null); // Clear advice if no job selected
    }
  }, [watchedJobId]);

  const onSubmit = async (data: AdvisorFormValues) => {
    if (!selectedJobDetails) {
      toast({ title: "Error", description: "Previous job details not loaded or job not completed.", variant: "destructive" });
      return;
    }
    if (selectedJobDetails.status !== 'completed') {
      toast({ title: "Invalid Job", description: "Please select a 'completed' job for HNN advice.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setError(null);
    setAdviceResult(null);

    const inputForAI: HSQNNAdvisorInput = {
      previousJobId: selectedJobDetails.job_id,
      previousZpeEffects: selectedJobDetails.zpe_effects,
      // Ensure previousTrainingParameters aligns with the schema used in the flow
      // The TrainingParameters type from @/types/training should be compatible
      previousTrainingParameters: selectedJobDetails.parameters as TrainingParameters, 
      hnnObjective: data.hnnObjective,
    };

    try {
      const output = await adviseHSQNNParameters(inputForAI);
      setAdviceResult(output);
      toast({ title: "Advice Generated", description: "AI has provided suggestions for the next HNN step." });
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
      toast({ title: "Advice Generation Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseParameters = () => {
    if (adviceResult?.suggestedNextTrainingParameters && selectedJobDetails) {
      // Start with all parameters from the *selectedJobDetails.parameters* as base
      const baseParams = { ...selectedJobDetails.parameters };
      
      // Override with AI suggestions. Critical: AI might return partial parameters.
      const suggestedParams = adviceResult.suggestedNextTrainingParameters;
      
      const combinedParams: Partial<TrainingParameters> = { ...baseParams };

      for (const key in suggestedParams) {
        if (Object.prototype.hasOwnProperty.call(suggestedParams, key)) {
          // Type assertion as suggestedParams keys are from Partial<TrainingParameters>
          (combinedParams as any)[key] = (suggestedParams as any)[key];
        }
      }
      
      // Ensure model name is handled: use AI's suggestion, or derive from previous
      if (suggestedParams.modelName) {
        combinedParams.modelName = suggestedParams.modelName;
      } else if (baseParams.modelName) {
        combinedParams.modelName = `${baseParams.modelName}_hnn_step`;
      } else {
        combinedParams.modelName = "HNN_Model_Next"; // Fallback
      }

      // Set baseConfigId to the ID of the job we just analyzed
      combinedParams.baseConfigId = selectedJobDetails.job_id;


      const queryParams = new URLSearchParams();
      for (const [key, value] of Object.entries(combinedParams)) {
        if (Array.isArray(value)) {
          queryParams.append(key, JSON.stringify(value));
        } else if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      }
      router.push(`/train?${queryParams.toString()}`);
    }
  };
  
  const ParamList = ({ params, title }: { params: Partial<TrainingParameters> | TrainingParameters | undefined, title: string }) => {
    if (!params || Object.keys(params).length === 0) return <p className="text-sm text-muted-foreground italic">{title}: No parameters to display or not applicable.</p>;
    
    const displayParams = { ...params };
    // Remove baseConfigId from display if it was the same as the previous job ID, as it's implied.
    if (title === "Suggested Changes" && selectedJobDetails && displayParams.baseConfigId === selectedJobDetails.job_id) {
      delete displayParams.baseConfigId;
    }


    return (
      <div className="space-y-1 text-sm">
         <h4 className="font-semibold text-muted-foreground">{title}:</h4>
        {Object.entries(displayParams).map(([key, value]) => (
          <li key={key} className="ml-4 list-disc list-inside">
            <span className="font-medium">{key}:</span>{' '}
            {Array.isArray(value) ? `[${value.map(v => typeof v === 'number' ? v.toFixed(4) : String(v)).join(', ')}]` : String(value)}
          </li>
        ))}
      </div>
    );
  };


  return (
    <div className="container mx-auto p-4 md:p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BrainCircuit className="h-6 w-6 text-primary" />HS-QNN Parameter Advisor</CardTitle>
          <CardDescription>
            Get AI-driven advice for the next training parameters in your Hilbert Space Quantum Neural Network sequence based on a previous job's ZPE state and your objectives.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Input Configuration</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="previousJobId">Select Previous Completed Job</Label>
                <Controller
                  name="previousJobId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingJobs}>
                      <SelectTrigger id="previousJobId">
                        <SelectValue placeholder={isLoadingJobs ? "Loading jobs..." : "Select a completed job"} />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingJobs && <SelectItem value="loading" disabled>Loading jobs...</SelectItem>}
                        {!isLoadingJobs && jobsList.length === 0 && <SelectItem value="no-jobs" disabled>No completed jobs found.</SelectItem>}
                        {jobsList.map(job => (
                          <SelectItem key={job.job_id} value={job.job_id}>
                            {job.model_name} ({job.job_id.slice(-8)}) - Acc: {job.accuracy.toFixed(2)}%
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.previousJobId && <p className="text-xs text-destructive mt-1">{errors.previousJobId.message}</p>}
              </div>

              {selectedJobDetails && (
                <Card className="bg-muted/50">
                  <CardHeader className="pb-2 pt-4"><CardTitle className="text-base">Previous Job Summary</CardTitle></CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p><strong>Model:</strong> {selectedJobDetails.parameters.modelName}</p>
                    <p><strong>Accuracy:</strong> {selectedJobDetails.accuracy.toFixed(2)}%</p>
                    <p><strong>Loss:</strong> {selectedJobDetails.loss.toFixed(4)}</p>
                    <p><strong>ZPE Effects (avg per layer):</strong> [{selectedJobDetails.zpe_effects.map(z => z.toFixed(3)).join(', ')}]</p>
                     <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-muted-foreground hover:underline">View All Previous Parameters</summary>
                        <ScrollArea className="h-32 mt-1 border p-2 rounded-md bg-background">
                           <ParamList params={selectedJobDetails.parameters} title="Previous Parameters"/>
                        </ScrollArea>
                    </details>
                  </CardContent>
                </Card>
              )}

              <div>
                <Label htmlFor="hnnObjective">HNN Objective for Next Step</Label>
                <Controller
                  name="hnnObjective"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      id="hnnObjective"
                      rows={4}
                      placeholder="e.g., Maximize accuracy while exploring higher ZPE for layer 3..."
                    />
                  )}
                />
                {errors.hnnObjective && <p className="text-xs text-destructive mt-1">{errors.hnnObjective.message}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || !selectedJobDetails || selectedJobDetails.status !== 'completed'}>
                {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4" />}
                Get HNN Advice
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary"/>AI Generated Advice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {!isLoading && !adviceResult && !error && (
              <p className="text-muted-foreground text-center py-10">Submit configuration to get AI advice for the next HNN step.</p>
            )}
            {adviceResult && (
              <>
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><SlidersHorizontal className="h-5 w-5"/>Suggested Parameter Changes for Next Job</CardTitle></CardHeader>
                  <CardContent>
                    <ScrollArea className="h-48">
                      <ParamList params={adviceResult.suggestedNextTrainingParameters} title="Suggested Changes"/>
                      <p className="text-xs text-muted-foreground mt-2">Note: Parameters not listed here should typically be inherited from the previous job. The AI might suggest a new model name.</p>
                    </ScrollArea>
                  </CardContent>
                   <CardFooter>
                    <Button 
                      onClick={handleUseParameters} 
                      className="w-full"
                      disabled={!selectedJobDetails || !adviceResult?.suggestedNextTrainingParameters}
                    >
                      <ArrowRight className="mr-2 h-4 w-4"/> Use these parameters in Train Model
                    </Button>
                  </CardFooter>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-lg">Reasoning from AI</CardTitle></CardHeader
                  <CardContent>
                    <ScrollArea className="h-48">
                      <p className="text-sm whitespace-pre-wrap">{adviceResult.reasoning}</p>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

