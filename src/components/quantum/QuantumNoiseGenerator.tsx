"use client";
import React, { useEffect, useRef } from 'react';
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface QuantumNoiseGeneratorProps {
  values: number[];
  isGenerating: boolean;
  viewMode?: "distribution" | "waveform";
}

export default function QuantumNoiseGenerator({ 
  values = [], 
  isGenerating,
  viewMode = "distribution" 
}: QuantumNoiseGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current || values.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    if (viewMode === "distribution") {
      drawDistribution(ctx, width, height, values);
    } else {
      drawWaveform(ctx, width, height, values);
    }
  }, [values, viewMode]);
  
  const drawDistribution = (ctx: CanvasRenderingContext2D, width: number, height: number, dataValues: number[]) => {
    const numBins = 20;
    const bins = Array(numBins).fill(0);
    const min = -1; const max = 1;
    const binWidth = (max - min) / numBins;
    
    dataValues.forEach(val => {
      const binIndex = Math.min(numBins - 1, Math.max(0, Math.floor((val - min) / binWidth)));
      bins[binIndex]++;
    });
    
    const maxBinCount = Math.max(...bins, 1); // Avoid division by zero
    const barWidth = width / numBins;
    ctx.fillStyle = 'hsl(var(--primary))';
    
    bins.forEach((count, i) => {
      const barHeight = (count / maxBinCount) * (height - 40);
      const x = i * barWidth;
      const y = height - barHeight - 20;
      
      // Using a simple rect for broader compatibility, roundRect might not be on all CanvasRenderingContext2D types
      ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
    });
    
    ctx.strokeStyle = 'hsl(var(--muted-foreground))';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, height - 20); ctx.lineTo(width, height - 20); ctx.stroke();
    
    ctx.fillStyle = 'hsl(var(--muted-foreground))';
    ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
    for (let i = 0; i <= numBins; i += 4) {
      const value = min + i * binWidth;
      ctx.fillText(value.toFixed(1), i * barWidth, height - 5);
    }
    
    ctx.strokeStyle = 'hsla(var(--accent-foreground), 0.6)'; // Use HSL variable
    ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < width; i++) {
      const xVal = min + (i / width) * (max - min);
      const yVal = normalDist(xVal, 0, 0.4); // Assuming normalDist is defined
      const scaledY = height - 20 - (yVal / normalDist(0, 0, 0.4)) * (height - 40) * 0.8;
      if (i === 0) ctx.moveTo(i, scaledY); else ctx.lineTo(i, scaledY);
    }
    ctx.stroke();
  };
  
  const drawWaveform = (ctx: CanvasRenderingContext2D, width: number, height: number, dataValues: number[]) => {
    if (dataValues.length === 0) return;
    const step = width / dataValues.length;
    ctx.strokeStyle = 'hsl(var(--muted-foreground))'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2); ctx.stroke();
    
    ctx.strokeStyle = 'hsl(var(--primary))'; ctx.lineWidth = 2; ctx.beginPath();
    dataValues.forEach((val, i) => {
      const x = i * step;
      const y = height / 2 - val * (height / 2 - 20);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    for (let i = 0; i < 30; i++) {
      const index = Math.floor(Math.random() * dataValues.length);
      const val = dataValues[index];
      const x = index * step;
      const y = height / 2 - val * (height / 2 - 20);
      const size = 2 + Math.random() * 3;
      const alpha = 0.4 + Math.random() * 0.4;
      ctx.fillStyle = `hsla(var(--primary-foreground), ${alpha})`; // Use HSL variable
      ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
    }
  };
  
  const normalDist = (x: number, mean: number, stdDev: number) => {
    return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
  };

  return (
    <div className="h-full w-full relative flex items-center justify-center">
      {isGenerating ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
          <p className="text-muted-foreground text-sm">Executing quantum circuit...</p>
        </div>
      ) : values.length === 0 ? (
        <div className="text-center text-muted-foreground">No quantum noise data available</div>
      ) : (
        <motion.canvas
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          ref={canvasRef}
          width={600} // Intrinsic width for canvas drawing
          height={400} // Intrinsic height
          className="w-full h-full" // Tailwind classes for responsive display
        />
      )}
    </div>
  );
}
