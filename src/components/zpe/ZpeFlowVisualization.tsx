"use client";
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { cn } from "@/lib/utils";

interface ZpeFlowVisualizationProps {
  values: number[];
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  paramType: "momentum" | "strength" | "noise" | "coupling" | string; // Allow string for safety
}

export default function ZpeFlowVisualization({ 
  values = [], // Default to empty array
  activeIndex, 
  setActiveIndex,
  paramType 
}: ZpeFlowVisualizationProps) {
  
  const getColor = (type: string) => {
    switch (type) {
      case "momentum": return "hsl(var(--chart-1))"; 
      case "strength": return "hsl(var(--chart-2))";
      case "noise": return "hsl(var(--chart-3))";  
      case "coupling": return "hsl(var(--chart-4))"; 
      default: return "hsl(var(--chart-5))";       
    }
  };

  const getBgClass = (type: string, isActive: boolean) => {
    if (!isActive) return "hover:bg-muted";
    switch (type) {
      case "momentum": return "bg-blue-100 dark:bg-blue-900/30";
      case "strength": return "bg-purple-100 dark:bg-purple-900/30";
      case "noise": return "bg-orange-100 dark:bg-orange-900/30";
      case "coupling": return "bg-green-100 dark:bg-green-900/30";
      default: return "bg-gray-100 dark:bg-gray-800/30";
    }
  };

  const getBorderClass = (type: string) => {
    switch (type) {
      case "momentum": return "border-blue-500";
      case "strength": return "border-purple-500";
      case "noise": return "border-orange-500";
      case "coupling": return "border-green-500";
      default: return "border-gray-500";
    }
  };

  const getTextClass = (type: string) => {
    switch (type) {
      case "momentum": return "text-blue-600 dark:text-blue-400";
      case "strength": return "text-purple-600 dark:text-purple-400";
      case "noise": return "text-orange-600 dark:text-orange-400";
      case "coupling": return "text-green-600 dark:text-green-400";
      default: return "text-gray-600 dark:text-gray-400";
    }
  };

  const chartData = values.map((value, index) => ({
    name: `Layer ${index + 1}`,
    value
  }));

  return (
    <div className="space-y-6">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 1]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke={getColor(paramType)} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {values.map((value, index) => (
          <div
            key={index}
            className={cn(
              "flex flex-col items-center p-3 border rounded-lg transition-colors cursor-pointer",
              activeIndex === index ? getBgClass(paramType, true) : "hover:bg-muted",
              activeIndex === index ? getBorderClass(paramType) : "border-border"
            )}
            onClick={() => setActiveIndex(index)}
          >
            <span className="text-xs text-muted-foreground mb-1">Layer {index + 1}</span>
            <span className={cn(
              "font-mono font-medium text-sm",
              activeIndex === index ? getTextClass(paramType) : ""
            )}>
              {value.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
