
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { adviseHSQNNParameters, HSQNNAdvisorInput, HSQNNAdvisorOutput } from "@/ai/flows/hs-qnn-parameter-advisor";
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

const advisorFormSchema = z.object({
  previousJobId: z.string().min(1, "Please select a previous job."),
  hnnObjective: z.string().min(20, "Objective must be at least 20 characters long.").max(500, "Objective is too long."),
});

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
      // Filter for completed jobs only, as they have final ZPE effects
      const completedJobs = (data.jobs || []).filter((job: TrainingJobSummary) => job.status === "completed")
        .sort((a: TrainingJobSummary, b: TrainingJobSummary) => new Date(b.start_time || 0).getTime() - new Date(a.start_time || 0).getTime());
      setJobsList(completedJobs);
      
      const preselectJobId = searchParams.get("jobId");
      if (preselectJobId && completedJobs.find(j => j.job_id === preselectJobId)) {
        setValue("previousJobId", preselectJobId);
      } else if (completedJobs.length > 0 && !watchedJobId) {
         setValue("previousJobId", completedJobs[0].job_id); // Auto-select the latest completed job if none selected
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
    }
  }, [watchedJobId]);

  const onSubmit = async (data: AdvisorFormValues) => {
    if (!selectedJobDetails) {
      toast({ title: "Error", description: "Previous job details not loaded.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setError(null);
    setAdviceResult(null);

    const inputForAI: HSQNNAdvisorInput = {
      previousJobId: selectedJobDetails.job_id,
      previousZpeEffects: selectedJobDetails.zpe_effects,
      previousTrainingParameters: selectedJobDetails.parameters,
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
    if (adviceResult?.suggestedNextTrainingParameters) {
      const paramsToPrefill = {
        ...selectedJobDetails?.parameters, // Start with all previous params
        ...adviceResult.suggestedNextTrainingParameters, // Override with AI suggestions
      };
      // Ensure array parameters are correctly stringified if they are arrays
      const queryParams = new URLSearchParams();
      for (const [key, value] of Object.entries(paramsToPrefill)) {
        if (Array.isArray(value)) {
          queryParams.append(key, JSON.stringify(value));
        } else if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      }
       // Ensure new model name from suggestions is used
      if (adviceResult.suggestedNextTrainingParameters.modelName) {
        queryParams.set('modelName', adviceResult.suggestedNextTrainingParameters.modelName);
      } else if (selectedJobDetails?.parameters.modelName) {
         queryParams.set('modelName', `${selectedJobDetails.parameters.modelName}_hnn`);
      }


      router.push(`/train?${queryParams.toString()}`);
    }
  };
  
  const ParamList = ({ params }: { params: Partial<TrainingParameters> | TrainingParameters | undefined }) => {
    if (!params) return <p className="text-sm text-muted-foreground">N/A</p>;
    return (
      <ul className="space-y-1 text-sm">
        {Object.entries(params).map(([key, value]) => (
          <li key={key}>
            <span className="font-semibold">{key}:</span>{' '}
            {Array.isArray(value) ? `[${value.map(v => typeof v === 'number' ? v.toFixed(4) : v).join(', ')}]` : String(value)}
          </li>
        ))}
      </ul>
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
                        <SelectValue placeholder="Loading completed jobs..." />
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
                    <p><strong>ZPE Effects:</strong> [{selectedJobDetails.zpe_effects.map(z => z.toFixed(3)).join(', ')}]</p>
                     <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-muted-foreground hover:underline">View All Previous Parameters</summary>
                        <ScrollArea className="h-32 mt-1 border p-2 rounded-md bg-background">
                           <ParamList params={selectedJobDetails.parameters} />
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

              <Button type="submit" className="w-full" disabled={isLoading || !selectedJobDetails}>
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
              <p className="text-muted-foreground text-center py-10">Submit configuration to get AI advice.</p>
            )}
            {adviceResult && (
              <>
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><SlidersHorizontal className="h-5 w-5"/>Suggested Next Training Parameters</CardTitle></CardHeader>
                  <CardContent>
                    <ScrollArea className="h-48">
                      <ParamList params={adviceResult.suggestedNextTrainingParameters} />
                    </ScrollArea>
                  </CardContent>
                   <CardFooter>
                    <Button onClick={handleUseParameters} className="w-full">
                      <ArrowRight className="mr-2 h-4 w-4"/> Use these parameters in Train Model
                    </Button>
                  </CardFooter>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-lg">Reasoning from AI</CardTitle></CardHeader>
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
