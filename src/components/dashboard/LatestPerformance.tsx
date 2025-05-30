"use client";
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function LatestPerformance() {
  const generatePerformanceData = () => {
    const result = [];
    for (let epoch = 1; epoch <= 6; epoch++) {
      result.push({
        epoch,
        train_acc: 95 + (epoch / 6) * 4 + Math.random() * 0.5,
        val_acc: 94 + (epoch / 6) * 4.5 + Math.random() * 0.7,
        train_loss: 0.4 - (epoch / 6) * 0.35 + Math.random() * 0.05,
        val_loss: 0.5 - (epoch / 6) * 0.35 + Math.random() * 0.08,
        zpe_effect: 0.2 + (epoch / 6) * 0.3 + Math.random() * 0.05
      });
    }
    return result;
  };

  const performanceData = generatePerformanceData();
  const lastEpoch = performanceData[performanceData.length - 1];

  return (
    <div className="grid gap-4 md:grid-cols-5">
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Training Metrics</CardTitle>
          <CardDescription>
            Latest performance across epochs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={performanceData.map(p => ({
                  name: `Epoch ${p.epoch}`,
                  "Train Acc": p.train_acc,
                  "Val Acc": p.val_acc
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Train Acc" stroke="hsl(var(--primary))" />
                <Line type="monotone" dataKey="Val Acc" stroke="hsl(var(--chart-2))" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Latest Results</CardTitle>
          <CardDescription>Epoch {lastEpoch.epoch} performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Training Accuracy</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30 border-0 text-foreground">
                      {lastEpoch.train_acc.toFixed(2)}%
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Validation Accuracy</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 border-0 text-foreground">
                      {lastEpoch.val_acc.toFixed(2)}%
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Training Loss</TableCell>
                  <TableCell className="text-right">
                    {lastEpoch.train_loss.toFixed(4)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Validation Loss</TableCell>
                  <TableCell className="text-right">
                    {lastEpoch.val_loss.toFixed(4)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">ZPE Effect</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900/30 border-0 text-foreground">
                      {lastEpoch.zpe_effect.toFixed(3)}
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            
            <div className="pt-4">
              <h3 className="text-sm font-medium mb-2">ZPE Effects by Layer</h3>
              <div className="grid grid-cols-6 gap-2">
                {[0.12, 0.18, 0.24, 0.35, 0.11, 0.09].map((value, i) => (
                  <div key={i} className="text-center">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${(value / 0.35) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-muted-foreground">{i+1}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-2">
              <h3 className="text-sm font-medium mb-2">Test Time Augmentation</h3>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Validation:</span>
                <span className="font-medium">{lastEpoch.val_acc.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">With TTA:</span>
                <span className="font-medium">{(lastEpoch.val_acc + 0.6 + Math.random() * 0.2).toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
