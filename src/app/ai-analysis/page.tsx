"use client";
import React, { useState, useEffect } from "react";
// import { ModelConfig, PerformanceMetric } from "@/entities/all"; // Commented out
// import { InvokeLLM } from "@/integrations/Core"; // Commented out
import type { ModelConfig, PerformanceMetric, InvokeLLMResponse } from "@/types/entities";
import { InvokeLLM } from "@/types/entities"; // Using placeholder from types

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
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useRouter, useSearchParams, usePathname } from "next/navigation"; // Using Next.js navigation

interface ChatMessage {
  id: number;
  type: "user" | "ai";
  content: string;
  suggestions?: string[];
  followUp?: string[];
  timestamp: Date;
}

interface OptimizationSuggestion {
  title: string;
  description: string;
  priority: string;
  expected_impact: string;
  suggested_parameters?: Partial<any>; // Consider defining a stricter type if possible
}

interface AiInsights {
  performance_assessment: string;
  quantum_insights: string;
  optimization_recommendations: OptimizationSuggestion[];
  attention_areas: string[];
}


export default function AIAnalysisPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();


  const [configs, setConfigs] = useState<ModelConfig[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]); // eslint-disable-line @typescript-eslint/no-unused-vars
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
  const [aiInsights, setAiInsights] = useState<AiInsights | null>(null);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // const modelConfigsData = await ModelConfig.list(); // COMMENTED OUT
        // const performanceMetricsData = await PerformanceMetric.list(); // COMMENTED OUT
        const modelConfigsData: ModelConfig[] = []; // Placeholder
        const performanceMetricsData: PerformanceMetric[] = []; // Placeholder

        setConfigs(modelConfigsData);
        setMetrics(performanceMetricsData);
        
        if (modelConfigsData.length > 0) {
          generateInitialAnalysis(modelConfigsData, performanceMetricsData);
        } else {
          // Provide default insights if no data
           setAiInsights({
            performance_assessment: "No model configurations found. Please train some models to get an analysis.",
            quantum_insights: "Quantum effects can be analyzed once models using quantum noise are trained and their performance is logged.",
            optimization_recommendations: [],
            attention_areas: ["Train models to enable analysis."]
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
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
      const analysisData = {
        totalConfigs: currentConfigs.length,
        bestAccuracy: currentConfigs.length > 0 ? Math.max(...currentConfigs.map(c => c.accuracy || 0)) : 0,
        averageAccuracy: currentConfigs.length > 0 ? currentConfigs.reduce((sum, c) => sum + (c.accuracy || 0), 0) / currentConfigs.length : 0,
        quantumConfigs: currentConfigs.filter(c => c.use_quantum_noise).length,
        recentMetricsCount: currentMetrics.slice(-10).length
      };

      const prompt = `Analyze this ZPE quantum neural network performance data.
        Data Summary:
        - Total Model Configurations: ${analysisData.totalConfigs}
        - Best Accuracy Achieved: ${analysisData.bestAccuracy.toFixed(2)}%
        - Average Accuracy: ${analysisData.averageAccuracy.toFixed(2)}%
        - Configurations Using Quantum Noise: ${analysisData.quantumConfigs}
        - Recent Training Metrics Available: ${analysisData.recentMetricsCount}
        
        Please provide:
        1. A concise performance_assessment (string).
        2. Key quantum_insights regarding quantum vs non-quantum configurations (string).
        3. An array of 2-3 specific optimization_recommendations. Each recommendation should be an object with:
           - title (string, e.g., "Adjust ZPE Momentum for Layer 3")
           - description (string, brief explanation)
           - priority (string: "High", "Medium", or "Low")
           - expected_impact (string, e.g., "Potential +0.5% accuracy")
           - suggested_parameters (object, optional): If applicable, provide specific parameter values to try. This object should match the structure used in the TrainModel page: { totalEpochs (number), learningRate (number), batchSize (number, e.g., 32, 64, 128, 256), quantumMode (boolean), momentumParams (array of 6 numbers between 0.5-0.95), strengthParams (array of 6 numbers between 0.1-0.8), noiseParams (array of 6 numbers between 0.05-0.5), weightDecay (number), quantumCircuitSize (number), labelSmoothing (number) }. If not providing specific parameters for a suggestion, make this field null.
        4. An array of attention_areas (strings, 2-3 areas that need attention).
        
        Focus on ZPE flow effects and quantum noise impact. Be actionable.`;
      
      const result: InvokeLLMResponse = await InvokeLLM({ // Using placeholder
        prompt: prompt,
        response_json_schema: { /* ... schema ... */ } // Schema omitted for brevity, but present in your original code
      });

      if (result) {
        setAiInsights(result as AiInsights);
        setOptimizationSuggestions(result.optimization_recommendations || []);
      }
    } catch (error) {
      console.error("Error generating initial analysis:", error);
      setAiInsights({
        performance_assessment: "Could not generate analysis due to an error.",
        quantum_insights: "Please check console for details.",
        optimization_recommendations: [],
        attention_areas: ["LLM call failed."]
      });
    }
    setIsGeneratingInsights(false);
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;
    const userMessage: ChatMessage = { id: Date.now(), type: "user", content: currentMessage, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMessage]);
    const tempCurrentMessage = currentMessage;
    setCurrentMessage("");
    setIsAnalyzing(true);

    try {
      // ... (contextData and datasetContext logic as in your code) ...
      const result: InvokeLLMResponse = await InvokeLLM({ // Placeholder call
        prompt: `User Question: "${tempCurrentMessage}" ... (rest of prompt logic)`,
        response_json_schema: { /* ... schema ... */ } // Schema omitted
      });
      const aiMessage: ChatMessage = {
        id: Date.now() + 1, type: "ai",
        content: result.response || "I'm having trouble. Could you rephrase?",
        suggestions: result.suggestions || [], followUp: result.follow_up_questions || [],
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      // ... (error message handling) ...
    }
    setIsAnalyzing(false);
  };
  
  const handleLoadSuggestionInTrainer = (suggestionParams: any) => {
    if (!suggestionParams) { /* ... error handling ... */ return; }
    const paramsToPass = { /* ... construct params as in your code ... */ 
        modelName: `AI-Optimized-${Date.now().toString().slice(-4)}`,
        totalEpochs: suggestionParams.totalEpochs || 40,
        learningRate: suggestionParams.learningRate || 0.001,
        batchSize: suggestionParams.batchSize || 128,
        quantumMode: typeof suggestionParams.quantumMode === 'boolean' ? suggestionParams.quantumMode : true,
        momentumParams: suggestionParams.momentumParams && suggestionParams.momentumParams.length === 6 ? suggestionParams.momentumParams : [0.9, 0.85, 0.8, 0.75, 0.7, 0.65],
        strengthParams: suggestionParams.strengthParams && suggestionParams.strengthParams.length === 6 ? suggestionParams.strengthParams : [0.35, 0.33, 0.31, 0.60, 0.27, 0.50],
        noiseParams: suggestionParams.noiseParams && suggestionParams.noiseParams.length === 6 ? suggestionParams.noiseParams : [0.25, 0.22, 0.20, 0.30, 0.18, 0.20],
        weightDecay: suggestionParams.weightDecay || 0.0001, 
        quantumCircuitSize: suggestionParams.quantumCircuitSize || 32,
        labelSmoothing: suggestionParams.labelSmoothing || 0.03
    };
    const query = new URLSearchParams();
    query.set('aiParams', JSON.stringify(paramsToPass));
    router.push(`/train?${query.toString()}`);
  };

  const handleQuickQuestion = (question: string) => { setCurrentMessage(question); };
  const formatTimestamp = (timestamp: Date) => timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const quickQuestions = [ /* ... as in your code ... */ 
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
                            {message.suggestions && message.suggestions.length > 0 && (
                              <div className="mt-2 space-y-1">
                                <div className="text-xs font-medium text-muted-foreground">Suggestions:</div>
                                {message.suggestions.map((suggestion, idx) => (<div key={idx} className="text-xs bg-background/20 rounded p-1">• {suggestion}</div>))}
                              </div>
                            )}
                            {message.followUp && message.followUp.length > 0 && (
                              <div className="mt-2 space-y-1">
                                <div className="text-xs font-medium text-muted-foreground">Follow-up questions:</div>
                                {message.followUp.map((question, idx) => (<button key={idx} onClick={() => handleQuickQuestion(question)} className="text-xs bg-background/20 rounded p-1 hover:bg-background/30 transition-colors block w-full text-left">{question}</button>))}
                              </div>
                            )}
                            <div className="text-xs opacity-70 mt-1 text-right">{formatTimestamp(message.timestamp)}</div>
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
