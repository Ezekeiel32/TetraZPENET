"use client";
import React, { useEffect, useRef } from 'react';
import { motion } from "framer-motion";

interface QuantumDistributionProps {
  values: number[];
}

export default function QuantumDistribution({ values = [] }: QuantumDistributionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current || values.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    drawQuantumDistribution(ctx, width, height, values);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, canvasRef.current?.width, canvasRef.current?.height]); // Redraw if canvas size changes
  
  const drawQuantumDistribution = (ctx: CanvasRenderingContext2D, width: number, height: number, dataValues: number[]) => {
    const gridSize = 50;
    const cellWidth = width / gridSize;
    const cellHeight = height / gridSize;
    const densityMap = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));
    
    dataValues.forEach((val, idx) => {
      const normVal = (val + 1) / 2;
      const phase = (idx % dataValues.length) / dataValues.length;
      const x = Math.floor(normVal * (gridSize - 1));
      const y = Math.floor(phase * (gridSize - 1));
      if (x >= 0 && x < gridSize && y >=0 && y < gridSize) {
        densityMap[y][x] += 1;
      }
    });
    
    let maxDensity = 0;
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        maxDensity = Math.max(maxDensity, densityMap[y][x]);
      }
    }
    if (maxDensity === 0) maxDensity = 1; // Avoid division by zero

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const density = densityMap[y][x] / maxDensity;
        if (density > 0) {
          const h = 270 - (x / gridSize) * 60; // purple to blue
          const s = 70 + (y / gridSize) * 30;
          const l = 100 - density * 50;
          ctx.fillStyle = `hsl(${h}, ${s}%, ${l}%)`;
          ctx.globalAlpha = 0.7 * density + 0.3;
          ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
        }
      }
    }
    
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = 'hsla(var(--primary-foreground), 0.3)'; // Use HSL variable
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const centerX = width * (0.3 + Math.random() * 0.4);
      const centerY = height * (0.3 + Math.random() * 0.4);
      const maxRadius = width * (0.2 + Math.random() * 0.2);
      const numCircles = 10 + Math.floor(Math.random() * 10);
      for (let j = 0; j < numCircles; j++) {
        const radius = (j / numCircles) * maxRadius;
        ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, Math.PI * 2); ctx.stroke();
      }
    }
    
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * width; const y = Math.random() * height;
      const gridX = Math.floor((x / width) * gridSize);
      const gridY = Math.floor((y / height) * gridSize);
      let density = 0;
      if (gridX >= 0 && gridX < gridSize && gridY >= 0 && gridY < gridSize) {
        density = densityMap[gridY][gridX] / maxDensity;
      }
      if (Math.random() < density * 0.7 + 0.1) {
        const size = 1 + Math.random() * 2 * density;
        const alpha = 0.3 + Math.random() * 0.7 * density;
        ctx.fillStyle = `hsla(var(--primary), ${alpha})`; // Use HSL variable
        ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
      }
    }
    
    ctx.fillStyle = 'hsl(var(--muted-foreground))';
    ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('-1.0', 20, height - 5); // Adjusted for better visibility
    ctx.fillText('0.0', width / 2, height - 5);
    ctx.fillText('1.0', width - 20, height - 5); // Adjusted for better visibility
    ctx.fillText('Quantum Probability Density', width / 2, 15);
  };

  return (
    <motion.canvas
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      ref={canvasRef}
      width={500} // Intrinsic width
      height={350} // Intrinsic height
      className="w-full h-full" // Tailwind for responsive display
    />
  );
}
