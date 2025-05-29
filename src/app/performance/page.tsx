"use client";
import React, { useState, useEffect, useCallback } from "react";
import { TrainingJob, TrainingJobSummary } from "@/types/training";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { CalendarDays, TrendingUp, RefreshCw, Info, Eye } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart, BarChart } from 'recharts';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export default function PerformancePage() {
  const [jobsList, setJobsList] = useState<TrainingJobSummary[]>([]);
  const [selectedJob, setSelectedJob] = useState<TrainingJob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  const fetchJobsList = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/jobs?limit=50`);
      if (!response.ok) throw new Error("Failed to fetch jobs list");
      const data = await response.json();
      const completedJobs = (data.jobs || []).filter(job => job.status === "completed")
        .sort((a,b) => new Date(b.start_time || 0).getTime() - new Date(a.start_time || 0).getTime());
      setJobsList(completedJobs);
      if (completedJobs.length > 0) {
        handleSelectJob(completedJobs[0].job_id); // Auto-select the latest completed job
      }
    } catch (error: any) {
      toast({ title: "Error fetching jobs", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobsList();
  }, [fetchJobsList]);

  const handleSelectJob = async (jobId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/status/${jobId}`);
      if (!response.ok) throw new Error("Failed to fetch job details");
      const jobData: TrainingJob = await response.json();
      setSelectedJob(jobData);

      // The FastAPI simulation stores logs per epoch. We need to parse them for chart data.
      // This is a placeholder; a real backend might provide structured epoch data.
      const parsedChartData = jobData.log_messages
        .map(log => {
          const match = log.match(/Epoch (\d+)\/\d+ - Accuracy: ([\d.]+)\%, Loss: ([\d.]+)/);
          if (match) {
            return {
              epoch: parseInt(match[1]),
              accuracy: parseFloat(match[2]),
              loss: parseFloat(match[3]),
              // Assuming ZPE effects for this epoch are stored with the final job status
              // For simplicity, we'll use the final ZPE effects for all chart points
              avg_zpe: jobData.zpe_effects.reduce((a,b) => a+b,0) / (jobData.zpe_effects.length || 1)
            };
          }
          return null;
        })
        .filter(Boolean)
        .sort((a,b) => a!.epoch - b!.epoch);
      
      // If no per-epoch logs provide data, use the final job status as a single point
      if (parsedChartData.length === 0 && jobData.status === "completed") {
        parsedChartData.push({
          epoch: jobData.current_epoch,
          accuracy: jobData.accuracy,
          loss: jobData.loss,
          avg_zpe: jobData.zpe_effects.reduce((a,b)=>a+b,0) / (jobData.zpe_effects.length || 1)
        });
      }
      setChartData(parsedChartData as any[]);

    } catch (error: any) {
      toast({ title: "Error fetching job details", description: error.message, variant: "destructive" });
      setSelectedJob(null);
      setChartData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const summaryStats = selectedJob ? {
    bestAccuracy: selectedJob.accuracy,
    finalLoss: selectedJob.loss,
    totalEpochs: selectedJob.total_epochs,
    modelName: selectedJob.parameters.modelName,
    quantumMode: selectedJob.parameters.quantumMode,
    avgZPE: selectedJob.zpe_effects.reduce((a,b)=>a+b,0) / (selectedJob.zpe_effects.length || 1)
  } : null;

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Model Performance</h1>
          <p className="text-muted-foreground">Analyze performance metrics of completed training jobs.</p>
        </div>
        <div className="flex items-center gap-2">
           <Select 
            onValueChange={(jobId) => handleSelectJob(jobId)} 
            value={selectedJob?.job_id || ""}
            disabled={isLoading || jobsList.length === 0}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select a completed job..." />
            </SelectTrigger>
            <SelectContent>
              {jobsList.map(job => (
                <SelectItem key={job.job_id} value={job.job_id}>
                  {job.model_name} ({job.job_id.replace('zpe_job_','')}) - {job.accuracy.toFixed(2)}%
                </SelectItem>
              ))}
              {jobsList.length === 0 && <div className="p-2 text-sm text-muted-foreground">No completed jobs.</div>}
            </SelectContent>
          </Select>
          <Button onClick={fetchJobsList} variant="outline" size="icon" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {isLoading && !selectedJob && <div className="flex justify-center py-10"><RefreshCw className="h-8 w-8 animate-spin text-primary" /></div>}
      
      {!isLoading && !selectedJob && jobsList.length > 0 && (
        <Card className="text-center py-10">
          <CardHeader><CardTitle className="flex items-center gap-2 justify-center"><Eye className="h-8 w-8 text-primary"/>Select a Job</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">Please select a completed training job from the dropdown to view its performance details.</p></CardContent>
        </Card>
      )}

      {!isLoading && !selectedJob && jobsList.length === 0 && (
        <Card className="text-center py-10">
          <CardHeader><CardTitle className="flex items-center gap-2 justify-center"><Info className="h-8 w-8 text-primary"/>No Data</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">No completed training jobs found. Please run some trainings first.</p></CardContent>
        </Card>
      )}

      {selectedJob && summaryStats && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Model</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold truncate" title={summaryStats.modelName}>{summaryStats.modelName}</div><p className="text-xs text-muted-foreground">Job ID: {selectedJob.job_id.replace('zpe_job_','')}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Final Accuracy</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-green-500">{summaryStats.bestAccuracy.toFixed(2)}%</div><p className="text-xs text-muted-foreground">Quantum Mode: {summaryStats.quantumMode ? "On" : "Off"}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Final Loss</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{summaryStats.finalLoss.toFixed(4)}</div><p className="text-xs text-muted-foreground">Avg ZPE: {summaryStats.avgZPE.toFixed(3)}</p></CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Performance Metrics Over Epochs</CardTitle>
              <CardDescription>Accuracy and Loss for {selectedJob.parameters.modelName}</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] pl-2">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="epoch" name="Epoch" />
                    <YAxis yAxisId="left" label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft', fill:'hsl(var(--primary))' }} stroke="hsl(var(--primary))" domain={[Math.min(80, ...chartData.map(d=>d.accuracy))-5 , 100]}/>
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Loss', angle: 90, position: 'insideRight', fill:'hsl(var(--destructive))' }} stroke="hsl(var(--destructive))" domain={[0, 'auto']}/>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}/>
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="accuracy" name="Accuracy" stroke="hsl(var(--primary))" strokeWidth={2} dot={{r:2}} activeDot={{r:4}} />
                    <Line yAxisId="right" type="monotone" dataKey="loss" name="Loss" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{r:2}} activeDot={{r:4}} />
                    <Bar yAxisId="left" dataKey="avg_zpe" name="Avg ZPE Effect" fill="hsl(var(--accent))" barSize={10} opacity={0.6} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-muted-foreground pt-10">Detailed epoch data not available for chart.</p>}
            </CardContent>
          </Card>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader><CardTitle>ZPE Effects by Layer (Final Epoch)</CardTitle></CardHeader>
                <CardContent className="h-[300px]">
                {selectedJob.zpe_effects && selectedJob.zpe_effects.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={selectedJob.zpe_effects.map((eff, i) => ({name: `L${i+1}`, value: eff}))} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={40} />
                        <Tooltip />
                        <Bar dataKey="value" fill="hsl(var(--accent))" />
                    </BarChart>
                    </ResponsiveContainer>
                ): <p className="text-center text-muted-foreground pt-10">No ZPE layer data.</p>}
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Training Logs</CardTitle><CardDescription>Key messages from the training process.</CardDescription></CardHeader>
                <CardContent>
                  <ScrollArea className="h-[260px] border rounded-md p-3 bg-muted/30">
                    {selectedJob.log_messages.length > 0 ? selectedJob.log_messages.map((log, index) => (
                      <p key={index} className="text-xs font-mono mb-1 last:mb-0">{log}</p>
                    )) : <p className="text-muted-foreground">No logs available.</p>}
                  </ScrollArea>
                </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
