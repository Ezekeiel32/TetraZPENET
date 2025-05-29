
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Zap, Thermometer, BarChartHorizontalBig, Cpu, AlertCircle, Power, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { GpuInfo } from '@/types/training'; // Assuming GpuInfo is defined here
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

// Helper to format MB to GB if large enough
const formatMemory = (mb?: number) => {
  if (typeof mb !== 'number') return 'N/A';
  if (mb > 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${mb.toFixed(0)} MB`;
};

export default function GpuMonitorPage() {
  const [gpuData, setGpuData] = useState<GpuInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchGpuData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/gpu-stats`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to fetch GPU stats" }));
        throw new Error(errorData.detail || `HTTP error ${response.status}`);
      }
      const data: GpuInfo = await response.json();
      setGpuData(data);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
      setGpuData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGpuData(); // Initial fetch
    const intervalId = setInterval(fetchGpuData, 5000); // Poll every 5 seconds
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [fetchGpuData]);

  const renderMetricCard = (title: string, value: string | number | undefined, unit: string, Icon: React.ElementType, progressValue?: number) => {
    const displayValue = (typeof value === 'number' && !isNaN(value)) ? `${value.toFixed(1)}${unit}` : (value || 'N/A');
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{displayValue}</div>
          {typeof progressValue === 'number' && progressValue >= 0 && progressValue <= 100 && (
            <Progress value={progressValue} className="mt-2 h-2" />
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center">
            <Cpu className="mr-3 h-8 w-8" /> GPU Monitor
          </h1>
          <p className="text-muted-foreground">Live statistics for your primary GPU.</p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
            {lastUpdated && (
                <p className="text-xs text-muted-foreground">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
            )}
            <Button onClick={fetchGpuData} variant="outline" size="icon" disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
        </div>
      </div>

      {isLoading && !gpuData && (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading GPU data...
        </div>
      )}

      {error && (
        <Card className="bg-destructive/10 border-destructive text-destructive-foreground">
          <CardHeader className="flex flex-row items-center gap-3">
            <AlertCircle className="h-6 w-6" />
            <CardTitle>Error Fetching GPU Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <p className="mt-2 text-sm">Please ensure your backend is running and the `/api/gpu-stats` endpoint is available and provides data for the primary GPU.</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && gpuData && gpuData.error && (
         <Card className="bg-destructive/10 border-destructive text-destructive-foreground">
          <CardHeader className="flex flex-row items-center gap-3">
            <AlertCircle className="h-6 w-6" />
            <CardTitle>GPU Monitoring Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{gpuData.error}</p>
            <p className="mt-2 text-sm">This might indicate an issue with NVML on the backend or driver problems.</p>
          </CardContent>
        </Card>
      )}
      
      {!isLoading && gpuData && gpuData.info && !gpuData.error && (
         <Card className="bg-muted/50">
          <CardHeader className="flex flex-row items-center gap-3">
            <Info className="h-6 w-6 text-muted-foreground" />
            <CardTitle>GPU Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{gpuData.info}</p>
          </CardContent>
        </Card>
      )}


      {!error && gpuData && !gpuData.error && !gpuData.info && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">GPU Overview</CardTitle>
              <CardDescription>{gpuData.name || 'NVIDIA GPU'}</CardDescription>
            </CardHeader>
          </Card>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {renderMetricCard(
              "GPU Utilization",
              gpuData.utilization_gpu_percent,
              "%",
              Zap,
              gpuData.utilization_gpu_percent
            )}
            {renderMetricCard(
              "Memory Utilization",
              gpuData.memory_used_percent,
              "%",
              BarChartHorizontalBig,
              gpuData.memory_used_percent
            )}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">GPU Memory</CardTitle>
                <BarChartHorizontalBig className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatMemory(gpuData.memory_used_mb)} / {formatMemory(gpuData.memory_total_mb)}
                </div>
                <Progress value={gpuData.memory_used_percent} className="mt-2 h-2" />
              </CardContent>
            </Card>
            {renderMetricCard(
              "Temperature",
              gpuData.temperature_c,
              "°C",
              Thermometer
            )}
            {renderMetricCard(
              "Power Draw",
              gpuData.power_draw_w,
              " W",
              Power
            )}
             {renderMetricCard(
              "Memory I/O Utilization",
              gpuData.utilization_memory_io_percent,
              "%",
              Zap, // Re-using Zap, consider a different icon if available for I/O
              gpuData.utilization_memory_io_percent
            )}
          </div>
        </>
      )}
       {!isLoading && !gpuData && !error && (
        <Card className="text-center py-10">
            <CardHeader><CardTitle className="flex items-center gap-2 justify-center"><Info className="h-8 w-8 text-primary"/>No GPU Data</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">No GPU data received from the backend. Ensure the `/api/gpu-stats` endpoint is working.</p></CardContent>
        </Card>
      )}
    </div>
  );
}
