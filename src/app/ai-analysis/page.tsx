
"use client";

import React, { useState, useEffect, Suspense, useCallback, useRef } from "react";
import type { ModelConfig, PerformanceMetric } from "@/types/entities";
import {
  getInitialZpeAnalysis,
  type GetInitialZpeAnalysisInput,
  type GetInitialZpeAnalysisOutput,
} from "@/ai/flows/get-initial-zpe-analysis-flow";
import {
  adviseHSQNNParameters,
  type HSQNNAdvisorInput,
  type HSQNNAdvisorOutput,
} from "@/ai/flows/hs-qnn-parameter-advisor";
import {
  getZpeChatResponseFlow,
  type GetZpeChatResponseInput,
  type GetZpeChatResponseOutput,
} from "@/ai/flows/get-zpe-chat-response-flow";
import type {
  TrainingParameters,
  TrainingJob,
  TrainingJobSummary,
} from "@/types/training";
import {
  Brain,
  Sparkles,
  TrendingUp,
  Lightbulb,
  MessageSquare,
  Send,
  Loader2,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Target,
  Zap,
  Play,
  SlidersHorizontal,
  Wand2,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

interface ChatMessage {
  id: string; // Changed to string for potential UUIDs
  type: "user" | "ai";
  content: string;
  followUp?: string[];
  timestamp: Date;
  formattedTimestamp?: string;
}

// Define TrainingParametersSchema locally to match the one in hs-qnn-parameter-advisor.ts
const TrainingParametersSchema = z.object({
  totalEpochs: z.number().int().min(1).max(200),
  batchSize: z.number().int().min(8).max(256),
  learningRate: z.number().min(0.00001).max(0.1),
  weightDecay: z.number().min(0).max(0.1),
  momentumParams: z.array(z.number().min(0).max(1)).length(6, "Momentum parameters must have 6 values."),
  strengthParams: z.array(z.number().min(0).max(1)).length(6, "Strength parameters must have 6 values."),
  noiseParams: z.array(z.number().min(0).max(1)).length(6, "Noise parameters must have 6 values."),
  couplingParams: z.array(z.number().min(0).max(1)).length(6, "Coupling parameters must have 6 values."),
  quantumCircuitSize: z.number().int().min(4).max(64),
  labelSmoothing: z.number().min(0).max(0.5),
  quantumMode: z.boolean(),
  modelName: z.string().min(1, "Model name is required."),
  baseConfigId: z.string().nullable().optional(),
});


function AIAnalysisPageComponent() {
  const router = useRouter();
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const [userInput, setUserInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  const [configs, setConfigs] = useState<ModelConfig[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: Date.now().toString(),
      type: "ai",
      content:
        "Welcome to the ZPE Quantum Neural Network AI Assistant! I can help analyze performance, provide insights, or suggest next steps for HNN training. How can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [aiInsights, setAiInsights] = useState<GetInitialZpeAnalysisOutput | null>(null);
  
  const [selectedJobIdForAdvice, setSelectedJobIdForAdvice] = useState<string | null>(null);
  const [specificAdviceResult, setSpecificAdviceResult] = useState<HSQNNAdvisorOutput | null>(null);
  const [specificAdviceError, setSpecificAdviceError] = useState<string | null>(null);
  const [adviceObjective, setAdviceObjective] = useState<string>(
    "Maximize validation accuracy while maintaining ZPE effects for all layers between 0.05 and 0.15. Explore slight increase in learning rate if previous accuracy was high."
  );
  const [isLoadingSpecificAdvice, setIsLoadingSpecificAdvice] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [completedJobsList, setCompletedJobsList] = useState<TrainingJobSummary[]>([]);
  const [selectedPreviousJobDetails, setSelectedPreviousJobDetails] = useState<TrainingJob | null>(null);


  const fetchCompletedJobsList = useCallback(async () => {
    setIsLoadingJobs(true);
    setSpecificAdviceError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/jobs?limit=50`); // Fetch more for history
      if (!response.ok) {
        throw new Error(`Failed to fetch jobs list. Status: ${response.status}`);
      }
      const data = await response.json();
      const completedJobs = (data.jobs || [])
        .filter((job: TrainingJobSummary) => job.status === "completed")
        .sort(
          (a: TrainingJobSummary, b: TrainingJobSummary) =>
            new Date(b.start_time || 0).getTime() -
            new Date(a.start_time || 0).getTime()
        );
      setCompletedJobsList(completedJobs);
      if (completedJobs.length > 0 && !selectedJobIdForAdvice) {
        setSelectedJobIdForAdvice(completedJobs[0].job_id);
      } else if (completedJobs.length === 0) {
        setSelectedJobIdForAdvice(null); // Ensure no job is selected if list is empty
      }
    } catch (e: any) {
      setSpecificAdviceError("Failed to fetch jobs: " + String(e.message));
      toast({
        title: "Error fetching jobs",
        description: String(e.message),
        variant: "destructive",
      });
    } finally {
      setIsLoadingJobs(false);
    }
  }, [selectedJobIdForAdvice]); // selectedJobIdForAdvice ensures re-fetch if it changes elsewhere

  useEffect(() => {
    fetchCompletedJobsList();
  }, [fetchCompletedJobsList]);

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!selectedJobIdForAdvice) {
        setSelectedPreviousJobDetails(null); // Clear details if no job is selected
        return;
      }
      setIsLoadingSpecificAdvice(true); // Indicate loading for job details
      setSpecificAdviceResult(null); // Clear previous advice
      setSpecificAdviceError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/status/${selectedJobIdForAdvice}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch job details for ${selectedJobIdForAdvice}. Status: ${response.status}`);
        }
        const jobDetails: TrainingJob = await response.json();
        setSelectedPreviousJobDetails(jobDetails);
      } catch (e: any) {
        setSelectedPreviousJobDetails(null);
        setSpecificAdviceError("Error fetching job details: " + String(e.message));
        toast({
          title: "Error fetching job details",
          description: String(e.message),
          variant: "destructive",
        });
      } finally {
        setIsLoadingSpecificAdvice(false);
      }
    };

    fetchJobDetails();
  }, [selectedJobIdForAdvice]);

  const handleGetSpecificAdvice = async () => {
    if (!selectedPreviousJobDetails) {
      toast({ title: "Error", description: "Previous job details not loaded. Please select a job.", variant: "destructive" });
      return;
    }
    if (selectedPreviousJobDetails.status !== "completed") {
      toast({ title: "Invalid Job", description: "Please select a 'completed' job for HNN advice.", variant: "destructive" });
      return;
    }
    if (!selectedPreviousJobDetails.parameters) {
      toast({ title: "Error", description: "Selected job is missing training parameters.", variant: "destructive" });
      return;
    }

    setIsLoadingSpecificAdvice(true);
    setSpecificAdviceError(null);
    setSpecificAdviceResult(null);

    const validationResult = TrainingParametersSchema.safeParse(selectedPreviousJobDetails.parameters);
    if (!validationResult.success) {
      const errorDetails = validationResult.error.errors?.map((err) => `${err.path.join(".") || "parameter"}: ${err.message}`).join("; ") || "Unknown validation error.";
      setSpecificAdviceError("Previous job parameters are invalid or incomplete. Details: " + errorDetails);
      toast({ title: "Parameter Validation Failed", description: "Previous job parameters are invalid. " + errorDetails, variant: "destructive", duration: 7000 });
      setIsLoadingSpecificAdvice(false);
      return;
    }

    const validatedPreviousParams = validationResult.data;
    const inputForAI: HSQNNAdvisorInput = {
      previousJobId: selectedPreviousJobDetails.job_id,
      previousZpeEffects: selectedPreviousJobDetails.zpe_effects || Array(6).fill(0),
      previousTrainingParameters: validatedPreviousParams,
      hnnObjective: adviceObjective,
    };

    try {
      const output = await adviseHSQNNParameters(inputForAI);
      setSpecificAdviceResult(output);
      toast({ title: "Specific Advice Generated", description: "AI has provided suggestions for the selected job." });
    } catch (e: any) {
      setSpecificAdviceError(String(e.message));
      toast({ title: "Specific Advice Failed", description: String(e.message), variant: "destructive" });
    } finally {
      setIsLoadingSpecificAdvice(false);
    }
  };

  const handleLoadSuggestionInTrainer = async (suggestionParams: Partial<TrainingParameters> | undefined) => {
    if (!suggestionParams) {
      toast({ title: "Error", description: "No parameters provided for suggestion.", variant: "destructive" });
      return;
    }
    const baseParamsForRouter = selectedPreviousJobDetails?.parameters ? { ...selectedPreviousJobDetails.parameters } : {};
    const combinedParamsForRouter: Record<string, any> = { ...baseParamsForRouter, ...suggestionParams };

    if (suggestionParams.modelName) {
      combinedParamsForRouter.modelName = suggestionParams.modelName;
    } else if (baseParamsForRouter.modelName) {
      combinedParamsForRouter.modelName = `${baseParamsForRouter.modelName}_hnn_advised_${Date.now().toString().slice(-4)}`;
    } else {
      combinedParamsForRouter.modelName = `HNN_Advised_Model_${Date.now().toString().slice(-4)}`;
    }
    if (selectedPreviousJobDetails?.job_id) { combinedParamsForRouter.baseConfigId = selectedPreviousJobDetails.job_id; }

    const query = new URLSearchParams();
    Object.entries(combinedParamsForRouter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) { query.set(String(key), JSON.stringify(value)); }
        else { query.set(String(key), String(value)); }
      }
    });
    router.push(`/train?${query.toString()}`);
  };

  interface ParamListProps {
    params: Partial<TrainingParameters> | TrainingParameters | undefined;
    title: string;
  }

  const ParamList = ({ params, title }: ParamListProps) => {
    if (!params || Object.keys(params).length === 0) {
      let message = `${title}: No parameters to display or not applicable.`;
      if (title === "Suggested Changes" && selectedPreviousJobDetails && (!params || Object.keys(params).length === 0)) {
        message = `${title}: AI suggests inheriting most parameters. Model Name will be updated. BaseConfigID will link to previous job.`;
      }
      return <p className="text-sm text-muted-foreground italic">{message}</p>;
    }
    const orderedKeys: (keyof TrainingParameters)[] = [
      "modelName", "totalEpochs", "batchSize", "learningRate", "weightDecay", 
      "quantumCircuitSize", "labelSmoothing", "quantumMode", 
      "momentumParams", "strengthParams", "noiseParams", "couplingParams", "baseConfigId"
    ];
    return (
      <div className="space-y-1 text-sm">
        <h4 className="font-semibold text-muted-foreground">{title}:</h4>
        <ul className="list-disc list-inside pl-4 space-y-1 bg-background/50 p-2 rounded">
          {orderedKeys.map((key) => {
            const value = params[key as keyof typeof params];
            if (value === undefined || value === null) return null;
             if (title === "Suggested Changes" && key === "baseConfigId" && value === selectedPreviousJobDetails?.job_id) {
                return null; 
            }
            if (title === "Suggested Changes" && key === "modelName" && 
                value === selectedPreviousJobDetails?.parameters.modelName && 
                !adviceResult?.suggestedNextTrainingParameters?.modelName) {
              return null;
            }
            return (
              <li key={key}>
                <span className="font-medium">{key}:</span>{" "}
                {Array.isArray(value) ? `[${value.map((v) => typeof v === "number" ? v.toFixed(4) : String(v)).join(", ")}]` : String(value)}
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  const generateInitialAnalysis = async () => {
    if (!configs) return; // Added null check for configs
    setIsGeneratingInsights(true);
    setAiInsights(null); // Clear previous insights
    try {
      const analysisData: GetInitialZpeAnalysisInput = {
        totalConfigs: configs.length,
        bestAccuracy: configs.length > 0 ? Math.max(...configs.map((c) => c.accuracy || 0)) : 0,
        averageAccuracy: configs.length > 0 ? configs.reduce((sum, c) => sum + (c.accuracy || 0), 0) / configs.length : 0,
        quantumConfigs: configs.filter(c => c.parameters.quantumMode).length,
        recentMetricsCount: metrics.length,
      };
      const insights = await getInitialZpeAnalysis(analysisData);
      setAiInsights(insights);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      setAiInsights({
        performance_assessment: "Error fetching model data. Cannot perform analysis.",
        quantum_insights: "N/A",
        optimization_recommendations: [],
        attention_areas: ["Data fetching failed."],
      });
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const handleChatSubmit = async () => {
    if (!userInput.trim()) return;
    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: userInput,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, newUserMessage]);
    setUserInput("");
    setIsChatLoading(true);

    try {
      const aiResponse = await getZpeChatResponseFlow({ userPrompt: userInput });
      const newAiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: aiResponse.response,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, newAiMessage]);
    } catch (e: any) {
      const errorAiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: "Sorry, I encountered an error trying to respond. " + e.message,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorAiMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    // Fetch initial data for overview if needed (currently placeholders)
    // For example, if configs and metrics were from a DB:
    // const fetchOverviewData = async () => {
    //   // setIsLoadingInitialData(true);
    //   // const fetchedConfigs = await fetch('/api/all-configs'); // example
    //   // const fetchedMetrics = await fetch('/api/all-metrics'); // example
    //   // setConfigs(await fetchedConfigs.json());
    //   // setMetrics(await fetchedMetrics.json());
    //   // setIsLoadingInitialData(false);
    //   // generateInitialAnalysis(await fetchedConfigs.json(), await fetchedMetrics.json());
    // };
    // fetchOverviewData();
    // Since configs/metrics are empty, we call generateInitialAnalysis with empty arrays.
    generateInitialAnalysis(); // Call it once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run once on mount


  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);


  return (
    <div className="p-6 bg-background text-foreground">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col space-y-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" /> AI Analysis & Assistant
          </h1>
          <p className="text-muted-foreground">
            Analyze your models, get optimization recommendations, and interact
            with the AI assistant.
          </p>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview Analysis</TabsTrigger>
            <TabsTrigger value="specific-advice">HNN Advice</TabsTrigger>
            <TabsTrigger value="chat">AI Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Model Performance Analysis</CardTitle>
                <CardDescription>
                  AI-generated insights based on overall model statistics.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isGeneratingInsights || isLoadingInitialData ? (
                  <div className="text-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground mt-2">
                      {isLoadingInitialData ? "Loading initial data..." : "Generating insights..."}
                    </p>
                  </div>
                ) : aiInsights ? (
                  <div className="space-y-4">
                    <Alert>
                      <Sparkles className="h-4 w-4" />
                      <AlertTitle>Performance Assessment</AlertTitle>
                      <AlertDescription>{aiInsights.performance_assessment}</AlertDescription>
                    </Alert>
                    <Alert>
                      <Zap className="h-4 w-4" />
                      <AlertTitle>Quantum Insights</AlertTitle>
                      <AlertDescription>{aiInsights.quantum_insights}</AlertDescription>
                    </Alert>
                    
                    <Card className="pt-4">
                        <CardHeader className="pt-0 pb-2"><CardTitle className="text-lg">Optimization Recommendations</CardTitle></CardHeader>
                        <CardContent>
                            {aiInsights.optimization_recommendations.length > 0 ? (
                                <ScrollArea className="h-60 pr-3">
                                    <div className="space-y-3">
                                        {aiInsights.optimization_recommendations.map((rec, idx) => (
                                        <Card key={idx} className="bg-muted/50 p-3">
                                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                                {rec.priority === "High" && <AlertCircle className="h-4 w-4 text-destructive" />}
                                                {rec.priority === "Medium" && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                                                {rec.priority === "Low" && <Lightbulb className="h-4 w-4 text-green-500" />}
                                                {rec.title} <Badge variant={rec.priority === "High" ? "destructive" : rec.priority === "Medium" ? "secondary": "outline"}>{rec.priority}</Badge>
                                            </h4>
                                            <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                                            <p className="text-xs mt-1"><strong>Impact:</strong> {rec.expected_impact}</p>
                                            {rec.suggested_parameters && Object.keys(rec.suggested_parameters).length > 0 && (
                                                <details className="text-xs mt-1">
                                                    <summary className="cursor-pointer hover:underline">Suggested Parameters</summary>
                                                    <pre className="text-xs font-mono bg-background p-1 mt-1 rounded overflow-x-auto">{JSON.stringify(rec.suggested_parameters, null, 2)}</pre>
                                                </details>
                                            )}
                                        </Card>
                                        ))}
                                    </div>
                                </ScrollArea>
                            ) : <p className="text-sm text-muted-foreground">No specific optimization recommendations at this time.</p>}
                        </CardContent>
                    </Card>

                    <Card className="pt-4">
                        <CardHeader className="pt-0 pb-2"><CardTitle className="text-lg">Attention Areas</CardTitle></CardHeader>
                        <CardContent>
                             {aiInsights.attention_areas.length > 0 ? (
                                <ul className="list-disc list-inside pl-4 space-y-1 text-sm">
                                {aiInsights.attention_areas.map((area, idx) => ( <li key={idx}>{area}</li> ))}
                                </ul>
                             ): <p className="text-sm text-muted-foreground">No specific areas requiring immediate attention identified.</p>}
                        </CardContent>
                    </Card>
                  </div>
                ) : (
                    <p className="text-muted-foreground text-center py-10">Could not generate insights. Please ensure model data is available.</p>
                )}
              </CardContent>
               <CardFooter>
                <Button onClick={() => generateInitialAnalysis()} disabled={isGeneratingInsights || isLoadingInitialData}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isGeneratingInsights ? 'animate-spin':''}`}/> Re-analyze Overview
                </Button>
               </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="specific-advice">
            <Card>
              <CardHeader>
                <CardTitle>Get Specific HNN Advice</CardTitle>
                <CardDescription>
                  Select a previous completed job and provide an objective to receive tailored advice for the next step in your HNN sequence.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="jobSelection">Select a Completed Job:</Label>
                    <Select
                      value={selectedJobIdForAdvice || ""}
                      onValueChange={(value) => setSelectedJobIdForAdvice(value)}
                      disabled={isLoadingJobs || isLoadingSpecificAdvice}
                    >
                      <SelectTrigger id="jobSelection">
                        <SelectValue placeholder={
                          isLoadingJobs ? "Loading jobs..." : 
                          !isLoadingJobs && completedJobsList.length === 0 ? "No completed jobs found" :
                          "Choose a completed job..."
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingJobs && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                        {!isLoadingJobs && completedJobsList.length === 0 && <SelectItem value="no-jobs" disabled>No completed jobs.</SelectItem>}
                        {completedJobsList.map((job) => (
                          <SelectItem key={job.job_id} value={job.job_id}>
                            {job.model_name || job.job_id.slice(-8)} (Acc: {job.accuracy.toFixed(2)}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isLoadingSpecificAdvice && selectedJobIdForAdvice && <p className="text-xs text-muted-foreground mt-1">Loading details for job {selectedJobIdForAdvice.slice(-8)}...</p>}
                  </div>

                  {selectedPreviousJobDetails && (
                    <Card className="bg-muted/50 p-4">
                      <CardHeader className="p-0 pb-2"><CardTitle className="text-base">Previous Job Summary</CardTitle></CardHeader>
                      <CardContent className="p-0 text-sm space-y-1">
                        <p><strong>Model:</strong> {selectedPreviousJobDetails.parameters.modelName}</p>
                        <p><strong>Accuracy:</strong> {selectedPreviousJobDetails.accuracy.toFixed(2)}%</p>
                        <p><strong>ZPE Effects:</strong> [{selectedPreviousJobDetails.zpe_effects.map(z => z.toFixed(3)).join(', ')}]</p>
                        <details className="mt-2 text-xs">
                            <summary className="cursor-pointer hover:underline text-muted-foreground">View All Previous Parameters</summary>
                            <ScrollArea className="h-32 mt-1 border p-2 rounded-md bg-background">
                               <ParamList params={selectedPreviousJobDetails.parameters} title="Previous Parameters"/>
                            </ScrollArea>
                        </details>
                      </CardContent>
                    </Card>
                  )}

                  <div>
                    <Label htmlFor="adviceObjective">Objective for Next HNN Step:</Label>
                    <Textarea
                      id="adviceObjective"
                      value={adviceObjective}
                      onChange={(e) => setAdviceObjective(e.target.value)}
                      rows={4}
                      placeholder="e.g., Maximize accuracy while exploring higher ZPE for layer 3..."
                    />
                  </div>

                  <Button
                    onClick={handleGetSpecificAdvice}
                    className="w-full"
                    disabled={isLoadingSpecificAdvice || !selectedPreviousJobDetails || (selectedPreviousJobDetails && selectedPreviousJobDetails.status !== "completed")}
                  >
                    {isLoadingSpecificAdvice && !specificAdviceResult ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="mr-2 h-4 w-4" />
                    )}
                    Get HNN Advice
                  </Button>

                  {specificAdviceError && (
                    <Alert variant="destructive">
                      <Terminal className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{specificAdviceError}</AlertDescription>
                    </Alert>
                  )}

                  {isLoadingSpecificAdvice && specificAdviceResult && (
                     <div className="text-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                        <p className="text-muted-foreground mt-2">Loading advice...</p>
                    </div>
                  )}

                  {adviceResult && !isLoadingSpecificAdvice && (
                    <div className="mt-6 space-y-4">
                      <Card>
                        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><SlidersHorizontal className="h-5 w-5"/>Suggested Parameters for Next Job</CardTitle></CardHeader>
                        <CardContent>
                           <ScrollArea className="h-48">
                              <ParamList params={adviceResult.suggestedNextTrainingParameters} title="Suggested Changes"/>
                               <p className="text-xs text-muted-foreground mt-2">
                                Note: AI suggested changes are shown. Other parameters will typically be inherited from the previous job.
                                A new model name ({adviceResult.suggestedNextTrainingParameters?.modelName || `${selectedPreviousJobDetails?.parameters?.modelName}_hnn`}) will be used. BaseConfigId will be set to the previous job's ID.
                              </p>
                           </ScrollArea>
                        </CardContent>
                        <CardFooter>
                          <Button onClick={handleLoadSuggestionInTrainer} className="w-full" disabled={!selectedPreviousJobDetails || !adviceResult?.suggestedNextTrainingParameters}>
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
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle>AI Chat Assistant</CardTitle>
                <CardDescription>
                  Interact with the ZPE Quantum Physicist AI for real-time guidance and explanations.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col h-[600px]">
                <ScrollArea className="flex-grow pr-4 mb-4">
                  <div ref={chatContainerRef} className="space-y-4">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.type === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`rounded-lg px-4 py-3 max-w-[85%] shadow-sm ${
                            msg.type === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className="text-xs mt-1 opacity-70 text-right">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {isChatLoading && (
                        <div className="flex justify-start">
                             <div className="rounded-lg px-4 py-3 max-w-[85%] shadow-sm bg-muted">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                             </div>
                        </div>
                    )}
                  </div>
                </ScrollArea>
                <div className="mt-auto flex gap-2">
                  <Textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSubmit();}}}
                    placeholder="Ask about ZPE, model optimization, or quantum concepts..."
                    rows={2}
                    className="flex-grow"
                  />
                  <Button onClick={handleChatSubmit} disabled={isChatLoading || !userInput.trim()} className="self-end">
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function AIAnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">
            Loading AI Analysis Dashboard...
          </span>
        </div>
      }
    >
      <AIAnalysisPageComponent />
    </Suspense>
  );
}


    