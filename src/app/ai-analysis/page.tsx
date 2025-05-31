
"use client";
import React, { useState, useEffect, Suspense } from "react";
import type { ModelConfig, PerformanceMetric } from "@/types/entities"; // Using existing types
import { getInitialZpeAnalysis, type GetInitialZpeAnalysisInput, type GetInitialZpeAnalysisOutput } from "@/ai/flows/get-initial-zpe-analysis-flow"; // Corrected import name
import { getZpeChatResponseFlow, type GetZpeChatResponseInput, type GetZpeChatResponseOutput } from "@/ai/flows/get-zpe-chat-response-flow";

import {
  Brain, Sparkles, TrendingUp, Lightbulb, MessageSquare, Send, Loader2,
  BarChart3, AlertCircle, CheckCircle, Target, Zap, Play
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "@/hooks/use-toast";
// Zod and ai from Genkit are used within the flows themselves.

interface ChatMessage {
  id: number;
  type: "user" | "ai";
  content: string;
  suggestions?: string[]; // Added from simplified flow
  followUp?: string[]; // Added from simplified flow, original was follow_up_questions
  timestamp: Date;
  formattedTimestamp?: string;
}

// OptimizationSuggestion is part of GetInitialZpeAnalysisOutput type from the flow

function AIAnalysisPageComponent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams(); // This hook requires <Suspense>

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
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<GetInitialZpeAnalysisOutput['optimization_recommendations']>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Simulate fetching data or use placeholders
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
      const analysisData: GetInitialZpeAnalysisInput = { // Ensure type matches the flow input
        totalConfigs: currentConfigs.length,
        bestAccuracy: currentConfigs.length > 0 ? Math.max(...currentConfigs.map(c => c.accuracy || 0)) : 0,
        averageAccuracy: currentConfigs.length > 0 ? currentConfigs.reduce((sum, c) => sum + (c.accuracy || 0), 0) / currentConfigs.length : 0,
        quantumConfigs: currentConfigs.filter(c => c.use_quantum_noise).length,
        recentMetricsCount: currentMetrics.slice(-10).length
      };

      const result = await getInitialZpeAnalysis(analysisData); // Corrected function call

      if (result) {
        setAiInsights(result);
        setOptimizationSuggestions(result.optimization_recommendations || []);
      } else {
        throw new Error("AI analysis returned no result.");
      }
    } catch (error: any) {
      console.error("Error generating initial analysis:", error);
      toast({title: "Error", description: "Could not generate initial analysis: " + error.message, variant: "destructive"});
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
      // Using the simplified input for the diagnostic version of the chat flow
      const inputForAI: GetZpeChatResponseInput = {
          userPrompt: tempCurrentMessage,
      };

      const result = await getZpeChatResponseFlow(inputForAI); // Call the imported flow function

      const aiMessage: ChatMessage = {
        id: Date.now() + 1, type: "ai",
        content: result.response || "I'm having trouble. Could you rephrase?",
        // Suggestions and followUp are not part of the simplified output schema
        suggestions: [], // Default to empty
        followUp: [],    // Default to empty
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
       toast({title: "Error", description: "Could not get AI response: " + error.message, variant: "destructive"});
    }
    setIsAnalyzing(false);
  };

  const handleLoadSuggestionInTrainer = (suggestionParams: any) => {
    if (!suggestionParams) { toast({title: "Error", description: "No parameters provided for suggestion.", variant: "destructive"}); return; }

    const paramsToPass: any = {
        modelName: `AI-Optimized-${Date.now().toString().slice(-4)}`,
        totalEpochs: 40, learningRate: 0.001, batchSize: 128, quantumMode: true,
        momentumParams: [0.9, 0.85, 0.8, 0.75, 0.7, 0.65],
        strengthParams: [0.35, 0.33, 0.31, 0.60, 0.27, 0.50],
        noiseParams: [0.25, 0.22, 0.20, 0.30, 0.18, 0.20],
        weightDecay: 0.0001, quantumCircuitSize: 32, labelSmoothing: 0.03,
        ...suggestionParams
    };

    const query = new URLSearchParams();
    const knownKeys: (keyof typeof paramsToPass)[] = [
      'modelName', 'totalEpochs', 'learningRate', 'batchSize', 'quantumMode',
      'momentumParams', 'strengthParams', 'noiseParams', 'weightDecay',
      'quantumCircuitSize', 'labelSmoothing', 'baseConfigId'
    ];

    knownKeys.forEach(key => {
      if (paramsToPass[key] !== undefined) {
        if (Array.isArray(paramsToPass[key])) {
          query.set(String(key), JSON.stringify(paramsToPass[key])); // Fixed: Ensure key is string
        } else {
          query.set(String(key), String(paramsToPass[key])); // Fixed: Ensure key is string
        }
      }
    });

    router.push(`/train?${query.toString()}`);
  };

  const handleQuickQuestion = (question: string) => { setCurrentMessage(question); };
  const quickQuestions = [
    "How can I improve my model's accuracy?",
    "What's the optimal ZPE momentum configuration?",
    "How does quantum noise affect convergence?",
    "Analyze my best performing configuration",
    "Suggest parameters for a new experiment"
  ];

  return (
    <div className="p-6 bg-background text-foreground">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col space-y-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            AI Analysis & Assistant
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
                            {/* Suggestions and followUp UI removed for diagnostic version */}
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

          <TabsContent value="optimize" className="space-y-4">
            {isLoading || isGeneratingInsights ? (<Card><CardContent className="flex items-center justify-center h-64"><div className="flex items-center gap-2"><Loader2 className="h-6 w-6 animate-spin" /><span>{isLoading ? "Loading model data..." : "AI generating suggestions..."}</span></div></CardContent></Card>)
            : optimizationSuggestions && optimizationSuggestions.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {optimizationSuggestions.map((suggestion, idx) => (
                  <Card key={idx}><CardHeader><div className="flex items-start justify-between"><CardTitle className="flex items-center gap-2 text-base"><Target className="h-5 w-5 text-blue-500" />{suggestion.title}</CardTitle><Badge variant={suggestion.priority === 'High' ? 'destructive' : suggestion.priority === 'Medium' ? 'default' : 'secondary'}>{suggestion.priority} Priority</Badge></div></CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">{suggestion.description}</p>
                      {suggestion.expected_impact && (<div className="flex items-center gap-2 text-sm mb-3"><Zap className="h-4 w-4 text-green-500" /><span className="font-medium">Expected Impact:</span><span>{suggestion.expected_impact}</span></div>)}
                      {suggestion.suggested_parameters && (<Button size="sm" variant="outline" onClick={() => handleLoadSuggestionInTrainer(suggestion.suggested_parameters)} className="w-full"><Play className="h-4 w-4 mr-2" />Load these Parameters in Trainer</Button>)}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (<Card><CardContent className="flex items-center justify-center h-64"><div className="text-center"><Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No optimization suggestions available yet.</p><p className="text-sm text-muted-foreground mt-2">Insights are being generated. If data is available, check back shortly or refresh the analysis.</p></div></CardContent></Card>)}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// This component will be wrapped by Suspense
export default function AIAnalysisPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading AI Analysis Dashboard... (Suspense Active)</span></div>}>
      <AIAnalysisPageComponent />
    </Suspense>
  );
}
