"use client";

import React, { useState, useEffect, Suspense, useCallback, useRef } from "react";
import type { ModelConfig, PerformanceMetric } from "@/types/entities";
import {
  getInitialZpeAnalysis,
  type GetInitialZpeAnalysisInput,
  type GetInitialZpeAnalysisOutput,
} from "@/ai/flows/get-initial-zpe-analysis-flow";
import {
  getZpeChatResponseFlow,
  type GetZpeChatResponseInput,
  type GetZpeChatResponseOutput,
} from "@/ai/flows/get-zpe-chat-response-flow";
import {
  adviseHSQNNParameters,
  type HSQNNAdvisorInput,
  type HSQNNAdvisorOutput,
} from "@/ai/flows/hs-qnn-parameter-advisor";
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

interface ChatMessage {
  id: number;
  type: "user" | "ai";
  content: string;
  followUp?: string[];
  timestamp: Date;
  formattedTimestamp?: string;
}

function AIAnalysisPageComponent() {
  const router = useRouter();
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const [configs, setConfigs] = useState<ModelConfig[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      type: "ai",
      content:
        "Welcome to the ZPE Quantum Neural Network AI Assistant! How can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [aiInsights, setAiInsights] = useState<GetInitialZpeAnalysisOutput>({
    performance_assessment: "Analyzing...",
    quantum_insights: "Processing...",
    optimization_recommendations: [],
    attention_areas: [],
  });
  const [selectedJobIdForAdvice, setSelectedJobIdForAdvice] = useState<
    string | null
  >(null);
  const [specificAdviceResult, setSpecificAdviceResult] =
    useState<HSQNNAdvisorOutput | null>(null);
  const [specificAdviceError, setSpecificAdviceError] = useState<string | null>(
    null
  );
  const [adviceObjective, setAdviceObjective] = useState<string>("");
  const [isLoadingSpecificAdvice, setIsLoadingSpecificAdvice] = useState(false);
  const [completedJobsList, setCompletedJobsList] = useState<
    TrainingJobSummary[]
  >([]);
  const [selectedPreviousJobDetails, setSelectedPreviousJobDetails] =
    useState<TrainingJob | null>(null);

  const fetchCompletedJobsList = useCallback(async () => {
    try {
      // Fetch completed jobs logic here
      const jobs: TrainingJobSummary[] = []; // Replace with actual API call
      jobs.sort(
        (a: TrainingJobSummary, b: TrainingJobSummary) =>
          new Date(b.start_time || 0).getTime() -
          new Date(a.start_time || 0).getTime()
      );
      setCompletedJobsList(jobs);
      if (jobs.length > 0 && !selectedJobIdForAdvice) {
        setSelectedJobIdForAdvice(jobs[0].job_id);
      }
    } catch (e: any) {
      setSpecificAdviceError("Failed to fetch jobs: " + String(e.message));
      toast({
        title: "Error fetching jobs",
        description: String(e.message),
        variant: "destructive",
      });
    } finally {
      setIsLoadingSpecificAdvice(false);
    }
  }, [selectedJobIdForAdvice]);

  useEffect(() => {
    fetchCompletedJobsList();
  }, [fetchCompletedJobsList]);

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!selectedJobIdForAdvice) return;

      try {
        const jobDetails: TrainingJob = {}; // Replace with actual API call
        setSelectedPreviousJobDetails(jobDetails);
      } catch (e: any) {
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
      toast({
        title: "Error",
        description: "Previous job details not loaded. Please select a job.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPreviousJobDetails.parameters) {
      toast({
        title: "Error",
        description: "Selected job is missing training parameters.",
        variant: "destructive",
      });
      return;
    }

    if (selectedPreviousJobDetails.status !== "completed") {
      toast({
        title: "Invalid Job",
        description: "Please select a 'completed' job for HNN advice.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingSpecificAdvice(true);
    setSpecificAdviceError(null);
    setSpecificAdviceResult(null);

    const validationResult = TrainingParametersSchema.safeParse(
      selectedPreviousJobDetails.parameters
    );

    if (!validationResult.success) {
      console.error(
        "Validation error for previousTrainingParameters:",
        validationResult.error
      );
      const errorDetails =
        validationResult.error.errors
          ?.map((err) => `${err.path.join(".") || "parameter"}: ${err.message}`)
          .join("; ") || "Unknown validation error.";
      setSpecificAdviceError(
        "Previous job parameters are invalid or incomplete. Details: " +
          errorDetails
      );
      toast({
        title: "Parameter Validation Failed",
        description: "Previous job parameters are invalid. " + errorDetails,
        variant: "destructive",
        duration: 7000,
      });
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
    } catch (e: any) {
      setSpecificAdviceError(String(e.message));
      toast({
        title: "Specific Advice Failed",
        description: String(e.message),
        variant: "destructive",
      });
    } finally {
      setIsLoadingSpecificAdvice(false);
    }
  };

  const handleLoadSuggestionInTrainer = async (
    suggestionParams: Partial<TrainingParameters> | undefined
  ) => {
    if (!suggestionParams) {
      toast({
        title: "Error",
        description: "No parameters provided for suggestion.",
        variant: "destructive",
      });
      return;
    }

    const baseParamsForRouter = selectedPreviousJobDetails?.parameters
      ? { ...selectedPreviousJobDetails.parameters }
      : {};

    const query = new URLSearchParams();
    Object.entries(suggestionParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query.set(String(key), JSON.stringify(value));
        } else {
          query.set(String(key), String(value));
        }
      }
    });

    router.push(`/train?${query.toString()}`);
  };

  interface ParamListProps {
    params: Partial<TrainingParameters> | null;
    title: string;
  }

  const ParamList = ({ params, title }: ParamListProps) => {
    if (!params || Object.keys(params).length === 0) {
      let message = `${title}: No parameters to display or not applicable.`;
      if (
        title === "Suggested Changes" &&
        selectedPreviousJobDetails &&
        (!params || Object.keys(params).length === 0)
      ) {
        message = `${title}: AI suggests inheriting most parameters. Model Name will be updated. BaseConfigID will link to previous job.`;
      }
      return <p className="text-sm text-muted-foreground italic">{message}</p>;
    }

    const orderedKeys = [
      "modelName",
      "totalEpochs",
      "batchSize",
      "learningRate",
      "weightDecay",
      "quantumCircuitSize",
      "labelSmoothing",
      "quantumMode",
      "momentumParams",
      "strengthParams",
      "noiseParams",
      "baseConfigId",
    ];

    return (
      <div className="space-y-1 text-sm">
        <h4 className="font-semibold text-muted-foreground">{title}:</h4>
        <ul className="list-disc list-inside pl-4 space-y-1 bg-background/50 p-2 rounded">
          {orderedKeys.map((key) => {
            const value = params[key as keyof typeof params];
            if (value === undefined || value === null) return null;
            return (
              <li key={key}>
                <span className="font-medium">{key}:</span>{" "}
                {Array.isArray(value)
                  ? `[${value
                      .map((v) =>
                        typeof v === "number" ? v.toFixed(4) : String(v)
                      )
                      .join(", ")}]`
                  : String(value)}
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  const generateInitialAnalysis = async (
    currentConfigs: ModelConfig[],
    currentMetrics: PerformanceMetric[]
  ) => {
    setIsGeneratingInsights(true);
    try {
      const analysisData: GetInitialZpeAnalysisInput = {
        totalConfigs: currentConfigs.length,
        bestAccuracy: currentConfigs.length > 0 ? Math.max(...currentConfigs.map((c) => c.accuracy || 0)) : 0,
        worstAccuracy: currentConfigs.length > 0 ? Math.min(...currentConfigs.map((c) => c.accuracy || 0)) : 0,
        averageAccuracy:
          currentConfigs.length > 0
            ? currentConfigs.reduce((sum, c) => sum + (c.accuracy || 0), 0) /
              currentConfigs.length
            : 0,
        topQuantumEffects: currentMetrics.flatMap((m) => m.quantum_effects || []),
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
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="specific-advice">Specific Advice</TabsTrigger>
            <TabsTrigger value="chat">AI Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Model Performance Analysis</CardTitle>
                <CardDescription>
                  Insights into your recent models and their performance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingInitialData ? (
                  <div className="text-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground mt-2">
                      Loading performance insights...
                    </p>
                  </div>
                ) : (
                  <>
                    <p>{aiInsights.performance_assessment}</p>
                    <Separator className="my-4" />
                    <p>{aiInsights.quantum_insights}</p>
                    <Separator className="my-4" />
                    <h3 className="font-semibold">Optimization Recommendations:</h3>
                    <ul className="list-disc list-inside pl-4">
                      {aiInsights.optimization_recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                    <Separator className="my-4" />
                    <h3 className="font-semibold">Attention Areas:</h3>
                    <ul className="list-disc list-inside pl-4">
                      {aiInsights.attention_areas.map((area, idx) => (
                        <li key={idx}>{area}</li>
                      ))}
                    </ul>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specific-advice">
            <Card>
              <CardHeader>
                <CardTitle>Get Specific Advice</CardTitle>
                <CardDescription>
                  Select a previous job and provide an objective to receive
                  tailored advice.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="jobSelection">Select a Completed Job:</Label>
                    <Select
                      value={selectedJobIdForAdvice || ""}
                      onValueChange={(value) => setSelectedJobIdForAdvice(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a job..." />
                      </SelectTrigger>
                      <SelectContent>
                        {completedJobsList.map((job) => (
                          <SelectItem key={job.job_id} value={job.job_id}>
                            {job.job_name || job.job_id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="adviceObjective">
                      Objective for Advice:
                    </Label>
                    <Textarea
                      id="adviceObjective"
                      value={adviceObjective}
                      onChange={(e) => setAdviceObjective(e.target.value)}
                      rows={3}
                      placeholder="e.g., Maximize accuracy while exploring higher ZPE for layer 3..."
                    />
                  </div>

                  <Button
                    onClick={handleGetSpecificAdvice}
                    className="w-full"
                    disabled={
                      isLoadingSpecificAdvice ||
                      !selectedJobIdForAdvice ||
                      !selectedPreviousJobDetails ||
                      selectedPreviousJobDetails.status !== "completed"
                    }
                  >
                    {isLoadingSpecificAdvice ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Lightbulb className="mr-2 h-4 w-4" />
                    )}
                    Get Specific Advice
                  </Button>

                  {specificAdviceError && (
                    <Alert variant="destructive">
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{specificAdviceError}</AlertDescription>
                    </Alert>
                  )}

                  {specificAdviceResult && (
                    <div className="mt-6 space-y-4">
                      <h3 className="font-semibold">Suggested Changes:</h3>
                      <ParamList
                        params={specificAdviceResult.suggestedParameters}
                        title="Suggested Changes"
                      />

                      <Button
                        onClick={() =>
                          handleLoadSuggestionInTrainer(
                            specificAdviceResult.suggestedParameters
                          )
                        }
                        className="w-full"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Load these Parameters in Trainer
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle>AI Chat</CardTitle>
                <CardDescription>
                  Interact with the AI assistant for real-time guidance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div ref={chatContainerRef} className="space-y-4">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.type === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`rounded-lg px-4 py-2 max-w-[80%] ${
                            msg.type === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="mt-4">
                  <Textarea
                    placeholder="Type your message here..."
                    rows={3}
                  />
                  <Button className="w-full mt-2">
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
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
            Loading AI Analysis Dashboard... (Suspense Active)
          </span>
        </div>
      }
    >
      <AIAnalysisPageComponent />
    </Suspense>
  );
}