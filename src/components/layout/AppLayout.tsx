"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PanelLeft, Home, Cpu, Zap, Atom, BarChart3, Settings, PlayCircle, Lightbulb, 
  Replace, Cog, Scaling, Box, Share2, Wrench, Moon, Sun, BrainCircuit, Globe, 
  ScatterChart, IterationCw, Database, MessageSquare, Signal, SlidersHorizontal, Monitor, TrendingUp // Added Monitor and TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/train", label: "Train Model", icon: PlayCircle },
  { href: "/model-configs", label: "Model Configs", icon: Settings },
  { href: "/configurations", label: "Job History", icon: BarChart3 }, 
  { href: "/performance", label: "Performance Analysis", icon: TrendingUp },
  { href: "/architecture", label: "Architecture", icon: Cpu },
  { href: "/gpu-monitor", label: "GPU Monitor", icon: Monitor },
];

const advancedToolsNavItems = [
  { href: "/zpe-flow-analysis", label: "ZPE Flow Analysis", icon: SlidersHorizontal },
  { href: "/hnn-advisor", label: "HNN Advisor", icon: BrainCircuit }, 
  { href: "/quantum-noise", label: "Quantum Noise", icon: Atom },
  { href: "/rf-generator", label: "RF Generator", icon: Signal },
  { href: "/ai-analysis", label: "AI Analysis", icon: MessageSquare },
];

const visNavItems = [
  { href: "/vis/bloch-sphere", label: "Bloch Sphere", icon: Globe },
  { href: "/vis/dynamic-formation", label: "Dynamic Formation", icon: IterationCw }, 
  { href: "/vis/zpe-particle-simulation", label: "ZPE Particle Sim", icon: ScatterChart },
];

const aiFlowsNavItems = [
  { href: "/ai/implement-zpe", label: "Simulate ZPE", icon: Lightbulb },
  { href: "/ai/approximate-zpe", label: "Approximate Flow", icon: Replace },
  { href: "/ai/adapt-zpe", label: "Adapt ZPE", icon: Cog },
  { href: "/ai/show-scaled-output", label: "Scaled Output", icon: Scaling },
  { href: "/ai/quantize-model", label: "Quantize Model", icon: Box },
  { href: "/ai/extract-components", label: "Extract Components", icon: Share2 },
  { href: "/ai/configure-model", label: "Configure Model", icon: Wrench },
];


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); 

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  
  const NavLinkContent = ({ item }: { item: { label: string, icon: React.ElementType } }) => (
    <>
      <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
      {item.label}
    </>
  );

  const renderNavSection = (title: string, items: Array<{ href: string; label: string; icon: React.ElementType }>) => (
    <>
      <div className="pt-3 pb-1 px-2">
        <span className="text-xs font-semibold uppercase text-muted-foreground">{title}</span>
      </div>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
            (pathname === item.href || (item.href && pathname.startsWith(item.href + '/') && item.href !== "/"))
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
          onClick={() => setIsMobileNavOpen(false)}
        >
          <NavLinkContent item={item} />
        </Link>
      ))}
    </>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold text-primary" onClick={() => setIsMobileNavOpen(false)}>
          <Atom className="h-6 w-6" />
          <span>TetraZPE.com</span>
        </Link>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-0 overflow-y-auto">
        {renderNavSection("Main", mainNavItems)}
        {renderNavSection("Advanced Tools", advancedToolsNavItems)}
        {renderNavSection("Visualizations", visNavItems)}
        {renderNavSection("AI Flows", aiFlowsNavItems)}
      </nav>
      <div className="p-4 border-t border-border">
        <Button variant="outline" className="w-full justify-start" onClick={toggleDarkMode}>
          {isDarkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          {isDarkMode ? "Light Mode" : "Dark Mode"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden md:flex md:flex-col md:w-72 border-r border-border bg-card">
        <SidebarContent />
      </aside>
      <div className="flex flex-col flex-1 w-full">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 md:hidden">
           <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 w-72">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold text-primary md:hidden" onClick={() => setIsMobileNavOpen(false)}>
            <Atom className="h-6 w-6" />
            <span className="sr-only">TetraZPE.com</span>
          </Link>
          <div className="ml-auto">
             <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="md:hidden">
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
