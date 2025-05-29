"use client";
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Atom, BarChart3, Cpu, TrendingUp, Zap, Activity } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Button } from "@/components/ui/button";

const summaryData = [
  { title: "Active Models", value: "3", icon: Cpu, trend: "+1 this week" },
  { title: "Avg. Accuracy", value: "97.5%", icon: TrendingUp, trend: "+0.5% vs last model" },
  { title: "Quantum Simulations", value: "128", icon: Atom, trend: "24 active" },
  { title: "ZPE Effect Range", value: "0.8 - 1.2", icon: Zap, trend: "Optimal" },
];

const placeholderChartData = [
  { name: 'Jan', accuracy: 95, loss: 0.15 },
  { name: 'Feb', accuracy: 95.5, loss: 0.14 },
  { name: 'Mar', accuracy: 96.2, loss: 0.12 },
  { name: 'Apr', accuracy: 97.0, loss: 0.10 },
  { name: 'May', accuracy: 97.5, loss: 0.09 },
  { name: 'Jun', accuracy: 97.3, loss: 0.095 },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {summaryData.map((item) => (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground">{item.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary"/>Model Performance Trend</CardTitle>
            <CardDescription>Accuracy and Loss over time (Placeholder Data)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={placeholderChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis yAxisId="left" stroke="hsl(var(--primary))" fontSize={12} domain={[90, 100]}/>
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--destructive))" fontSize={12} domain={[0, 0.2]}/>
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="accuracy" stroke="hsl(var(--primary))" name="Accuracy (%)" activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="loss" stroke="hsl(var(--destructive))" name="Loss" activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Training Jobs</CardTitle>
            <CardDescription>Overview of the latest training activity (Placeholder)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "ZPE-Optimized-Gamma", status: "Completed", accuracy: "98.1%" },
                { name: "QuantumFlow-Test-7", status: "Running", epoch: "7/20" },
                { name: "Baseline-CNN-Ref", status: "Failed", error: "CUDA OOM" },
              ].map((job, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <div>
                    <p className="font-medium">{job.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Status: {job.status} {job.epoch ? `(Epoch ${job.epoch})` : job.accuracy ? `(${job.accuracy})` : job.error ? `(${job.error})` : ''}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
