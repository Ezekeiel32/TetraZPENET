"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Signal, Activity, SlidersHorizontal, Radio, Zap, Rss } from 'lucide-react';

// Helper to generate waveform data
const generateWaveData = (params: RfParamsType) => {
  const data = [];
  const points = 200;
  // const period = 1 / params.frequency; // Not directly used for x-axis scaling here for simplicity

  for (let i = 0; i < points; i++) {
    const x = (i / (points -1 )) * 2 * Math.PI * params.cyclesToDisplay;
    let yBase;

    switch (params.waveform) {
      case 'sine': yBase = Math.sin(x); break;
      case 'square': yBase = Math.sin(x) >= 0 ? 1 : -1; break;
      case 'sawtooth': yBase = 2 * ( (x / (2*Math.PI*params.cyclesToDisplay) * params.cyclesToDisplay) - Math.floor(0.5 + (x / (2*Math.PI*params.cyclesToDisplay) * params.cyclesToDisplay) ) ); break;
      case 'triangle': yBase = Math.abs( ( (x / Math.PI) % 2) - 1) * 2 - 1; break;
      default: yBase = Math.sin(x);
    }
    
    let y = params.amplitude * yBase;

    if (params.modulationType !== 'none') {
      const modSignal = Math.sin(x * (params.modulationFrequency / params.frequency) * 0.2);
      if (params.modulationType === 'AM') {
        y *= (1 + params.modulationDepth * modSignal);
      } else if (params.modulationType === 'FM') {
        y = params.amplitude * Math.sin(x + params.modulationDepth * Math.cos(x * (params.modulationFrequency / params.frequency) * 0.2));
      }
    }
    data.push({ name: i, value: y });
  }
  return data;
};

interface RfParamsType {
  frequency: number;
  amplitude: number;
  waveform: 'sine' | 'square' | 'sawtooth' | 'triangle';
  modulationType: 'none' | 'AM' | 'FM';
  modulationFrequency: number;
  modulationDepth: number;
  cyclesToDisplay: number;
  pulseWidth: number; 
  dutyCycle: number; 
}

export default function RfWaveGeneratorPage() {
  const [rfParams, setRfParams] = useState<RfParamsType>({
    frequency: 1,
    amplitude: 0.8,
    waveform: 'sine',
    modulationType: 'none',
    modulationFrequency: 0.1,
    modulationDepth: 0.5,
    cyclesToDisplay: 3,
    pulseWidth: 0.5, 
    dutyCycle: 0.5,  
  });
  const [waveData, setWaveData] = useState<{name: number, value: number}[]>([]);
  const [applicationLog, setApplicationLog] = useState<string[]>([]);
  const [conceptualEffect, setConceptualEffect] = useState("Nominal");

  useEffect(() => {
    setWaveData(generateWaveData(rfParams));
  }, [rfParams]);

  const handleParamChange = (param: keyof RfParamsType, value: any) => {
    setRfParams(prev => ({ ...prev, [param]: value }));
  };
  
  const handleSliderChange = (param: keyof RfParamsType, valueArray: number[]) => {
    handleParamChange(param, valueArray[0]);
  };

  const applyRfSignature = () => {
    const logEntry = `Applied RF Signature: Freq=${rfParams.frequency.toFixed(2)}, Amp=${rfParams.amplitude.toFixed(2)}, Wave=${rfParams.waveform}, Mod=${rfParams.modulationType}`;
    setApplicationLog(prev => [logEntry, ...prev.slice(0, 4)]);
    
    let effectScore = rfParams.amplitude * 10;
    if (rfParams.waveform === 'square') effectScore *= 1.2;
    if (rfParams.modulationType !== 'none') effectScore *= (1 + rfParams.modulationDepth);
    
    if (effectScore > 12) setConceptualEffect("High Perturbation");
    else if (effectScore > 7) setConceptualEffect("Moderate Perturbation");
    else if (effectScore > 3) setConceptualEffect("Low Perturbation");
    else setConceptualEffect("Minimal Perturbation");

    console.log("Applying RF Signature:", rfParams);
  };

  const parameterControls = [
    { id: "frequency" as keyof RfParamsType, label: "Frequency (Relative Units)", min: 0.1, max: 10, step: 0.1, value: rfParams.frequency, type: "slider"},
    { id: "amplitude" as keyof RfParamsType, label: "Amplitude", min: 0, max: 1, step: 0.01, value: rfParams.amplitude, type: "slider"},
    { id: "waveform" as keyof RfParamsType, label: "Waveform", value: rfParams.waveform, options: ["sine", "square", "sawtooth", "triangle"], type: "select"},
    { id: "cyclesToDisplay" as keyof RfParamsType, label: "Cycles to Display", min: 1, max: 10, step: 1, value: rfParams.cyclesToDisplay, type: "slider"},
    { id: "modulationType" as keyof RfParamsType, label: "Modulation", value: rfParams.modulationType, options: ["none", "AM", "FM"], type: "select"},
  ];

  const modulationControls = [
    { id: "modulationFrequency" as keyof RfParamsType, label: "Mod. Frequency (Relative)", min: 0.01, max: 2, step: 0.01, value: rfParams.modulationFrequency, type: "slider"},
    { id: "modulationDepth" as keyof RfParamsType, label: "Mod. Depth", min: 0, max: 1, step: 0.01, value: rfParams.modulationDepth, type: "slider"},
  ];

  return (
    <div className="p-6 bg-background text-foreground">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Signal className="h-8 w-8 text-primary"/>RF Wave Generator</h1>
            <p className="text-muted-foreground">Configure and visualize radio frequency wave characteristics for conceptual network influence.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><SlidersHorizontal className="h-5 w-5 text-primary"/>RF Parameters</CardTitle>
              <CardDescription>Adjust the properties of the generated RF wave.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {parameterControls.map(p => (
                <div key={p.id} className="space-y-1">
                  <Label htmlFor={p.id} className="text-sm">{p.label}</Label>
                  {p.type === "slider" && <div className="flex items-center gap-2"><Slider id={p.id} min={p.min} max={p.max} step={p.step} value={[p.value]} onValueChange={(v) => handleSliderChange(p.id, v)} /><span className="text-xs font-mono w-12 text-right">{p.value.toFixed(p.step < 0.1 ? 2:1)}</span></div>}
                  {p.type === "select" && <Select value={p.value} onValueChange={(v) => handleParamChange(p.id,v)}><SelectTrigger id={p.id}><SelectValue/></SelectTrigger><SelectContent>{(p.options as string[]).map(opt => <SelectItem key={opt} value={opt} className="capitalize">{opt}</SelectItem>)}</SelectContent></Select>}
                </div>
              ))}
              {rfParams.modulationType !== 'none' && (
                <>
                  <div className="pt-2 border-t"><Label className="text-sm font-medium text-primary">Modulation Settings</Label></div>
                  {modulationControls.map(p => (
                    <div key={p.id} className="space-y-1">
                      <Label htmlFor={p.id} className="text-sm">{p.label}</Label>
                      <div className="flex items-center gap-2"><Slider id={p.id} min={p.min} max={p.max} step={p.step} value={[p.value]} onValueChange={(v) => handleSliderChange(p.id, v)} /><span className="text-xs font-mono w-12 text-right">{p.value.toFixed(2)}</span></div>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={applyRfSignature}>
                <Radio className="h-4 w-4 mr-2"/>Generate & Apply Signature
              </Button>
            </CardFooter>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary"/>Waveform Visualization</CardTitle>
                <CardDescription>Live preview of the configured RF wave.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] pl-0 pr-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={waveData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={false} label={{ value: "Time (Arbitrary)", position: 'insideBottomRight', offset: 0, fontSize:12, fill:"hsl(var(--muted-foreground))" }} />
                    <YAxis domain={[-1, 1]} tickFormatter={(val) => val.toFixed(1)} tick={{fontSize:10}}/>
                    <Tooltip wrapperStyle={{fontSize:"12px"}}/>
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary"/>Conceptual Network Effect</CardTitle>
                  <CardDescription>Simulated impact on the ZPE network based on RF parameters.</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className={`text-2xl font-bold mb-2 ${
                    conceptualEffect.includes("High") ? "text-red-500" :
                    conceptualEffect.includes("Moderate") ? "text-orange-500" :
                    conceptualEffect.includes("Low") ? "text-yellow-500" :
                    "text-green-500"
                  }`}>{conceptualEffect}</div>
                  <p className="text-xs text-muted-foreground">
                    This is a conceptual representation. Actual effects would depend on model architecture and RF-coupling mechanisms.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Rss className="h-5 w-5 text-primary"/>Application Log</CardTitle>
                   <CardDescription>Recent RF signatures applied.</CardDescription>
                </CardHeader>
                <CardContent className="max-h-[150px] overflow-y-auto">
                  {applicationLog.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No signatures applied yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {applicationLog.map((log, index) => (
                        <li key={index} className="text-xs p-2 bg-muted rounded text-muted-foreground truncate" title={log}>
                          {log}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
