
"use client";
import React, { useState, useEffect, Suspense, useCallback } from "react";
import type { ModelConfig, PerformanceMetric } from "@/types/entities"; // Using existing types
import { getInitialZpeAnalysis, type GetInitialZpeAnalysisInput, type GetInitialZpeAnalysisOutput } from "@/ai/flows/get-initial-zpe-analysis-flow";
import { getZpeChatResponseFlow, type GetZpeChatResponseInput, type GetZpeChatResponseOutput } from "@/ai/flows/get-zpe-chat-response-flow";
import { adviseHSQNNParameters, type HSQNNAdvisorInput, type HSQNNAdvisorOutput } from "@/ai/flows/hs-qnn-parameter-advisor";
import type { TrainingParameters, TrainingJob, TrainingJobSummary } from "@/types/training";


import {
  Brain, Sparkles, TrendingUp, Lightbulb, MessageSquare, Send, Loader2,
  BarChart3, AlertCircle, CheckCircle, Target, Zap, Play, SlidersHorizontal, Wand2, RefreshCw, ArrowRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { ai } from '@/ai/genkit';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

// Local Zod schema for validating previous job parameters before sending to AI flow
const TrainingParametersSchema = z.object({
  totalEpochs: z.number().int().min(1).max(200),
  batchSize: z.number().int().min(8).max(256),
  learningRate: z.number().min(0.00001).max(0.1),
  weightDecay: z.number().min(0).max(0.1),
  momentumParams: z.array(z.number().min(0).max(1)).length(6, "Must have 6 momentum parameters"),
  strengthParams: z.array(z.number().min(0).max(1)).length(6, "Must have 6 strength parameters"),
  noiseParams: z.array(z.number().min(0).max(1)).length(6, "Must have 6 noise parameters"),
  quantumCircuitSize: z.number().int().min(4).max(64),
  labelSmoothing: z.number().min(0).max(0.5),
  quantumMode: z.boolean(),
  modelName: z.string().min(3, "Model name must be at least 3 characters"),
  baseConfigId: z.string().optional(),
});


interface ChatMessage {
  id: number;
  type: "user" | "ai";
  content: string;
  suggestions?: string[];
  followUp?: string[];
  timestamp: Date;
  formattedTimestamp?: string;
}

function AIAnalysisPageComponent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [configs, setConfigs] = useState<ModelConfig[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      type: "ai",
      content: "Welcome to the ZPE Quantum Neural Network AI Assistant! I can help you analyze your model performance, suggest optimizations, and answer questions about quantum effects in neural networks. What would you like to explore?",
      timestamp: new Date()
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [aiInsights, setAiInsights] = useState<GetInitialZpeAnalysisOutput | null>(null);
  const [generalOptimizationSuggestions, setGeneralOptimizationSuggestions] = useState<GetInitialZpeAnalysisOutput['optimization_recommendations']>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for specific job advice
  const [completedJobsList, setCompletedJobsList] = useState<TrainingJobSummary[]>([]);
  const [selectedJobIdForAdvice, setSelectedJobIdForAdvice] = useState<string>("");
  const [adviceObjective, setAdviceObjective] = useState<string>("Maximize validation accuracy while maintaining ZPE effects for all layers between 0.05 and 0.15. Explore slight increase in learning rate if previous accuracy was high.");
  const [selectedPreviousJobDetails, setSelectedPreviousJobDetails] = useState<TrainingJob | null>(null);
  const [specificAdviceResult, setSpecificAdviceResult] = useState<HSQNNAdvisorOutput | null>(null);
  const [isLoadingSpecificAdvice, setIsLoadingSpecificAdvice] = useState<boolean>(false);
  const [specificAdviceError, setSpecificAdviceError] = useState<string | null>(null);


  const fetchCompletedJobsList = useCallback(async () => {
    setIsLoadingSpecificAdvice(true); // Use specific loading for this part
    setSpecificAdviceError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/jobs?limit=50`);
      if (!response.ok) throw new Error("Failed to fetch jobs list from backend.");
      const data = await response.json();
      const jobs = (data.jobs || []).filter((job: TrainingJobSummary) => job.status === "completed")
        .sort((a: TrainingJobSummary, b: TrainingJobSummary) => new Date(b.start_time || 0).getTime() - new Date(a.start_time || 0).getTime());
      setCompletedJobsList(jobs);
      if (jobs.length > 0 && !selectedJobIdForAdvice) {
        setSelectedJobIdForAdvice(jobs[0].job_id);
      }
    } catch (e: any) {
      setSpecificAdviceError("Failed to fetch jobs: " + e.message);
      toast({ title: "Error fetching jobs", description: e.message, variant: "destructive" });
    } finally {
      setIsLoadingSpecificAdvice(false);
    }
  }, [selectedJobIdForAdvice]);

  useEffect(() => {
    fetchCompletedJobsList();
  }, [fetchCompletedJobsList]);

  useEffect(() => {
    if (selectedJobIdForAdvice) {
      const fetchJobDetails = async () => {
        setIsLoadingSpecificAdvice(true);
        setSpecificAdviceResult(null);
        setSpecificAdviceError(null);
        try {
          const response = await fetch(`${API_BASE_URL}/status/${selectedJobIdForAdvice}`);
          if (!response.ok) throw new Error(`Failed to fetch details for job ${selectedJobIdForAdvice}. Status: ${response.status}`);
          const data: TrainingJob = await response.json();
          setSelectedPreviousJobDetails(data);
        } catch (e: any) {
          setSelectedPreviousJobDetails(null);
          setSpecificAdviceError("Failed to fetch selected job details: " + e.message);
          toast({ title: "Error fetching job details", description: e.message, variant: "destructive" });
        } finally {
          setIsLoadingSpecificAdvice(false);
        }
      };
      fetchJobDetails();
    } else {
      setSelectedPreviousJobDetails(null);
      setSpecificAdviceResult(null);
    }
  }, [selectedJobIdForAdvice]);


  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const modelConfigsData: ModelConfig[] = [];
        const performanceMetricsData: PerformanceMetric[] = [];
        setConfigs(modelConfigsData);
        setMetrics(performanceMetricsData);
        await generateInitialAnalysis(modelConfigsData, performanceMetricsData);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setAiInsights({
          performance_assessment: "Error fetching model data. Cannot perform analysis.",
          quantum_insights: "N/A",
          optimization_recommendations: [],
          attention_areas: ["Data fetching failed."]
        });
      }
      setIsLoading(false);
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateInitialAnalysis = async (currentConfigs: ModelConfig[], currentMetrics: PerformanceMetric[]) => {
    setIsGeneratingInsights(true);
    try {
      const analysisData: GetInitialZpeAnalysisInput = {
        totalConfigs: currentConfigs.length,
        bestAccuracy: currentConfigs.length > 0 ? Math.max(...currentConfigs.map(c => c.accuracy || 0)) : 0,
        averageAccuracy: currentConfigs.length > 0 ? currentConfigs.reduce((sum, c) => sum + (c.accuracy || 0), 0) / currentConfigs.length : 0,
        quantumConfigs: currentConfigs.filter(c => c.use_quantum_noise).length,
        recentMetricsCount: currentMetrics.slice(-10).length
      };
      const result = await getInitialZpeAnalysis(analysisData);
      if (result) {
        setAiInsights(result);
        setGeneralOptimizationSuggestions(result.optimization_recommendations || []);
      } else {
        throw new Error("AI analysis returned no result.");
      }
    } catch (error: any) {
      console.error("Error generating initial analysis:", error);
      toast({ title: "Error", description: "Could not generate initial analysis: " + error.message, variant: "destructive" });
      setAiInsights({
        performance_assessment: "Could not generate analysis due to an error.",
        quantum_insights: "Please check console for details.",
        optimization_recommendations: [],
        attention_areas: ["AI flow call failed."]
      });
    }
    setIsGeneratingInsights(false);
  };

  useEffect(() => {
    if (chatMessages.some(msg => !msg.formattedTimestamp)) {
      setChatMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.formattedTimestamp
            ? msg
            : { ...msg, formattedTimestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        )
      );
    }
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;
    const userMessage: ChatMessage = { id: Date.now(), type: "user", content: currentMessage, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMessage]);
    const tempCurrentMessage = currentMessage;
    setCurrentMessage("");
    setIsAnalyzing(true);
    try {
      const inputForAI: GetZpeChatResponseInput = { userPrompt: tempCurrentMessage };
      const result = await getZpeChatResponseFlow(inputForAI);
      const aiMessage: ChatMessage = {
        id: Date.now() + 1, type: "ai",
        content: result.response || "I'm having trouble. Could you rephrase?",
        suggestions: [],
        followUp: [],
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("Error getting AI response:", error);
      const aiErrorMessage: ChatMessage = {
        id: Date.now() + 1, type: "ai",
        content: "Sorry, I encountered an error trying to respond: " + error.message,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiErrorMessage]);
      toast({ title: "Error", description: "Could not get AI response: " + error.message, variant: "destructive" });
    }
    setIsAnalyzing(false);
  };

  const handleGetSpecificAdvice = async () => {
    if (!selectedPreviousJobDetails) {
      toast({ title: "Error", description: "Previous job details not loaded. Please select a job.", variant: "destructive" });
      return;
    }
    if (selectedPreviousJobDetails.status !== 'completed') {
      toast({ title: "Invalid Job", description: "Please select a 'completed' job for HNN advice.", variant: "destructive" });
      return;
    }
    setIsLoadingSpecificAdvice(true);
    setSpecificAdviceError(null);
    setSpecificAdviceResult(null);
    let validatedPreviousParams: TrainingParameters;
    try {
        const paramsToValidate = {
            ...selectedPreviousJobDetails.parameters,
            totalEpochs: selectedPreviousJobDetails.parameters.totalEpochs || 0,
            batchSize: selectedPreviousJobDetails.parameters.batchSize || 0,
            learningRate: selectedPreviousJobDetails.parameters.learningRate || 0,
            weightDecay: selectedPreviousJobDetails.parameters.weightDecay || 0,
            momentumParams: selectedPreviousJobDetails.parameters.momentumParams || Array(6).fill(0.8),
            strengthParams: selectedPreviousJobDetails.parameters.strengthParams || Array(6).fill(0.4),
            noiseParams: selectedPreviousJobDetails.parameters.noiseParams || Array(6).fill(0.2),
            quantumCircuitSize: selectedPreviousJobDetails.parameters.quantumCircuitSize || 0,
            labelSmoothing: selectedPreviousJobDetails.parameters.labelSmoothing || 0,
            quantumMode: selectedPreviousJobDetails.parameters.quantumMode || false,
            modelName: selectedPreviousJobDetails.parameters.modelName || "DefaultModel",
        };
        validatedPreviousParams = TrainingParametersSchema.parse(paramsToValidate);
    } catch (validationError: any) {
        console.error("Validation error for previousTrainingParameters:", validationError);
        setSpecificAdviceError("Previous job parameters are not in the expected format. Check console. Error: " + validationError.message);
        toast({ title: "Parameter Mismatch", description: "Previous job parameters invalid. " + validationError.message, variant: "destructive" });
        setIsLoadingSpecificAdvice(false);
        return;
    }
    const inputForAI: HSQNNAdvisorInput = {
      previousJobId: selectedPreviousJobDetails.job_id,
      previousZpeEffects: selectedPreviousJobDetails.zpe_effects,
      previousTrainingParameters: validatedPreviousParams,
      hnnObjective: adviceObjective,
    };
    try {
      const output = await adviseHSQNNParameters(inputForAI);
      setSpecificAdviceResult(output);
      toast({ title: "Specific Advice Generated", description: "AI has provided suggestions for the selected job." });
    } catch (e: any) {
      setSpecificAdviceError("AI advice generation failed: " + e.message);
      toast({ title: "Specific Advice Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsLoadingSpecificAdvice(false);
    }
  };

  const handleLoadSuggestionInTrainer = (suggestionParams: Partial<TrainingParameters> | undefined) => {
    if (!suggestionParams) { toast({ title: "Error", description: "No parameters provided for suggestion.", variant: "destructive" }); return; }
    const baseParams = selectedPreviousJobDetails ? { ...selectedPreviousJobDetails.parameters } : {};
    const combinedParams: Partial<TrainingParameters> = { ...baseParams };

    for (const key in suggestionParams) {
      if (Object.prototype.hasOwnProperty.call(suggestionParams, key)) {
        (combinedParams as any)[key] = (suggestionParams as any)[key];
      }
    }
    if (suggestionParams.modelName) {
        combinedParams.modelName = suggestionParams.modelName;
    } else if (baseParams.modelName) {
        combinedParams.modelName = `${baseParams.modelName}_hnn_advised`;
    } else {
        combinedParams.modelName = `HNN_Advised_Model_${Date.now().toString().slice(-4)}`;
    }
    combinedParams.baseConfigId = selectedPreviousJobDetails?.job_id;

    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(combinedParams)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query.append(String(key), JSON.stringify(value));
        } else {
          query.append(String(key), String(value));
        }
      }
    }
    router.push(`/train?${query.toString()}`);
  };

  const handleQuickQuestion = (question: string) => { setCurrentMessage(question); };

  const ParamList = ({ params, title }: { params: Partial<TrainingParameters> | undefined, title: string }) => {
    if (!params || Object.keys(params).length === 0) {
      return <p className="text-sm text-muted-foreground italic">{title}: No parameters to display.</p>;
    }
    const entries = Object.entries(params);
    return (
      <div className="space-y-1 text-sm">
         <h4 className="font-semibold text-muted-foreground">{title}:</h4>
         <ul className="list-disc list-inside pl-4 space-y-1 bg-background/50 p-2 rounded">
            {entries.map(([key, value]) => {
              if (value === undefined || value === null) return null;
              return (
                <li key={key}>
                  <span className="font-medium">{key}:</span>{' '}
                  {Array.isArray(value) ? `[${value.map(v => typeof v === 'number' ? v.toFixed(4) : String(v)).join(', ')}]` : String(value)}
                </li>
              );
            })}
         </ul>
      </div>
    );
  };

  return (
    <div className="p-6 bg-background text-foreground">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col space-y-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" /> AI Analysis & Assistant
          </h1>
          <p className="text-muted-foreground">
            Get intelligent insights, optimization suggestions, and ask questions about your ZPE quantum neural network
          </p>
        </div>

        <Tabs defaultValue="chat" className="space-y-4">
          <TabsList>
            <TabsTrigger value="chat">AI Chat</TabsTrigger>
            <TabsTrigger value="insights">Auto Analysis</TabsTrigger>
            <TabsTrigger value="optimize">Optimization Suggestions</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-4">
            {/* Chat UI remains the same */}
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" />AI Assistant Chat</CardTitle>
                  <CardDescription>Ask questions about your model performance, get optimization advice, or explore quantum effects</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[500px] p-4">
                    <div className="space-y-4">
                      {chatMessages.map((message) => (
                        <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-lg p-3 ${message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                            <div className="text-xs opacity-70 mt-1 text-right">{message.formattedTimestamp || "..."}</div>
                          </div>
                        </div>
                      ))}
                      {isAnalyzing && (<div className="flex justify-start"><div className="bg-muted rounded-lg p-3"><div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm">AI is analyzing...</span></div></div></div>)}
                    </div>
                  </ScrollArea>
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Textarea placeholder="Ask about model performance, optimization strategies, quantum effects, or dataset characteristics..." value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}} className="flex-1" rows={2}/>
                      <Button onClick={handleSendMessage} disabled={!currentMessage.trim() || isAnalyzing} size="sm"><Send className="h-4 w-4 mr-1" /> Send</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="space-y-4">
                <Card><CardHeader><CardTitle className="text-sm">Quick Questions</CardTitle></CardHeader><CardContent className="space-y-2">{quickQuestions.map((question, idx) => (<Button key={idx} variant="outline" size="sm" className="w-full text-left justify-start h-auto p-2 text-xs" onClick={() => handleQuickQuestion(question)}>{question}</Button>))}</CardContent></Card>
                <Card><CardHeader><CardTitle className="text-sm">System Status</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm"><span>Model Configs:</span><Badge variant="outline">{configs.length}</Badge></div>
                    <div className="flex justify-between text-sm"><span>Best Accuracy:</span><Badge variant="outline">{configs.length > 0 ? Math.max(...configs.map(c => c.accuracy || 0)).toFixed(1) : 0}%</Badge></div>
                    <div className="flex justify-between text-sm"><span>Quantum Enabled:</span><Badge variant="outline">{configs.filter(c => c.use_quantum_noise).length}/{configs.length}</Badge></div>
                    <div className="flex justify-between text-sm"><span>Training Metrics:</span><Badge variant="outline">{metrics.length}</Badge></div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            {/* Auto Analysis UI remains the same */}
             {isLoading || isGeneratingInsights ? (<Card><CardContent className="flex items-center justify-center h-64"><div className="flex items-center gap-2"><Loader2 className="h-6 w-6 animate-spin" /><span>{isLoading ? "Loading model data..." : "AI generating insights..."}</span></div></CardContent></Card>)
            : aiInsights ? (
              <div className="grid md:grid-cols-2 gap-6">
                <Card><CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-green-500" />Performance Assessment</CardTitle></CardHeader><CardContent><p className="text-sm leading-relaxed whitespace-pre-wrap">{aiInsights.performance_assessment}</p></CardContent></Card>
                <Card><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-purple-500" />Quantum Effects Analysis</CardTitle></CardHeader><CardContent><p className="text-sm leading-relaxed whitespace-pre-wrap">{aiInsights.quantum_insights}</p></CardContent></Card>
                {aiInsights.attention_areas && aiInsights.attention_areas.length > 0 && (
                  <Card className="md:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-orange-500" />Areas Requiring Attention</CardTitle></CardHeader>
                    <CardContent><ul className="space-y-2">{aiInsights.attention_areas.map((area, idx) => (<li key={idx} className="flex items-start gap-2"><AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" /><span className="text-sm">{area}</span></li>))}</ul></CardContent>
                  </Card>)}
              </div>
            ) : (<Card><CardContent className="flex items-center justify-center h-64"><div className="text-center"><Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No model data available for analysis</p><p className="text-sm text-muted-foreground mt-2">Train some models first to get AI insights</p></div></CardContent></Card>)}
          </TabsContent>

          <TabsContent value="optimize" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-primary"/>Get Specific Advice for a Completed Job</CardTitle>
                <CardDescription>Select a job and define an objective for targeted parameter suggestions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="specificJobSelect">Select Previous Completed Job</Label>
                  <Select onValueChange={setSelectedJobIdForAdvice} value={selectedJobIdForAdvice} disabled={isLoadingSpecificAdvice || completedJobsList.length === 0}>
                    <SelectTrigger id="specificJobSelect">
                      <SelectValue placeholder={isLoadingSpecificAdvice ? "Loading jobs..." : completedJobsList.length === 0 ? "No completed jobs" : "Select a completed job"} />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingSpecificAdvice && <SelectItem value="loading" disabled>Loading jobs...</SelectItem>}
                      {!isLoadingSpecificAdvice && completedJobsList.length === 0 && <SelectItem value="no-jobs" disabled>No completed jobs found.</SelectItem>}
                      {completedJobsList.map(job => (
                        <SelectItem key={job.job_id} value={job.job_id}>
                          {job.model_name} ({job.job_id.slice(-6)}) - Acc: {job.accuracy.toFixed(2)}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedPreviousJobDetails && (
                    <Card className="bg-muted/30 p-3 text-xs">
                        <p><strong>Selected:</strong> {selectedPreviousJobDetails.parameters.modelName}</p>
                        <p><strong>ZPE Effects:</strong> [{selectedPreviousJobDetails.zpe_effects.map(z => z.toFixed(3)).join(', ')}]</p>
                    </Card>
                )}
                <div>
                  <Label htmlFor="adviceObjective">HNN Objective for Next Step</Label>
                  <Textarea id="adviceObjective" value={adviceObjective} onChange={(e) => setAdviceObjective(e.target.value)} rows={3} placeholder="e.g., Maximize accuracy while exploring higher ZPE for layer 3..." />
                </div>
                <Button onClick={handleGetSpecificAdvice} className="w-full" disabled={isLoadingSpecificAdvice || !selectedJobIdForAdvice || !selectedPreviousJobDetails || selectedPreviousJobDetails.status !== 'completed'}>
                  {isLoadingSpecificAdvice ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                  Get Specific Advice
                </Button>
              </CardContent>
              {specificAdviceError && (
                <CardFooter>
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{specificAdviceError}</AlertDescription>
                  </Alert>
                </CardFooter>
              )}
              {specificAdviceResult && (
                <CardContent className="mt-4 border-t pt-4 space-y-4">
                  <Card>
                     <CardHeader><CardTitle className="text-base flex items-center gap-2"><SlidersHorizontal className="h-5 w-5"/>Suggested Changes</CardTitle></CardHeader>
                     <CardContent><ScrollArea className="h-32"><ParamList params={specificAdviceResult.suggestedNextTrainingParameters} title="Parameters"/></ScrollArea></CardContent>
                      <CardFooter>
                        <Button onClick={() => handleLoadSuggestionInTrainer(specificAdviceResult.suggestedNextTrainingParameters)} className="w-full"><Play className="mr-2 h-4 w-4"/>Use in Trainer</Button>
                      </CardFooter>
                  </Card>
                   <Card>
                     <CardHeader><CardTitle className="text-base">Reasoning</CardTitle></CardHeader>
                     <CardContent><ScrollArea className="h-32"><p className="text-sm whitespace-pre-wrap">{specificAdviceResult.reasoning}</p></ScrollArea></CardContent>
                  </Card>
                </CardContent>
              )}
            </Card>
            
            <Separator className="my-8"/>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary"/>General Optimization Suggestions</CardTitle>
                <CardDescription>Based on the overall summary of your training runs.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading || isGeneratingInsights ? (<div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin" /></div>)
                : generalOptimizationSuggestions && generalOptimizationSuggestions.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {generalOptimizationSuggestions.map((suggestion, idx) => (
                      <Card key={idx}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="flex items-center gap-2 text-base"><Target className="h-5 w-5 text-blue-500" />{suggestion.title}</CardTitle>
                            <Badge variant={suggestion.priority === 'High' ? 'destructive' : suggestion.priority === 'Medium' ? 'default' : 'secondary'}>{suggestion.priority} Priority</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">{suggestion.description}</p>
                          {suggestion.expected_impact && (<div className="flex items-center gap-2 text-sm mb-3"><Zap className="h-4 w-4 text-green-500" /><span className="font-medium">Expected Impact:</span><span>{suggestion.expected_impact}</span></div>)}
                          {suggestion.suggested_parameters && (<Button size="sm" variant="outline" onClick={() => handleLoadSuggestionInTrainer(suggestion.suggested_parameters)} className="w-full"><Play className="h-4 w-4 mr-2" />Load these Parameters in Trainer</Button>)}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (<div className="text-center py-10"><Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No general suggestions available.</p></div>)}
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
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading AI Analysis Dashboard...</span></div>}>
      <AIAnalysisPageComponent />
    </Suspense>
  );
}

    