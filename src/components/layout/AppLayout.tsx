"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PanelLeft,
  Home,
  Cpu, // For Architecture
  Zap, // For ZPE Flow
  Atom, // For Quantum Noise
  BarChart3, // For Performance
  Settings, // For Configurations
  PlayCircle, // For Train Model
  Lightbulb, // For Implement ZPE
  Replace, // For Approximate ZPE
  Cog, // For Adapt ZPE
  Scaling, // For Show Scaled Output
  Box, // For Quantize Model
  Share2, // For Extract Components
  Moon,
  Sun,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/architecture", label: "Architecture", icon: Cpu },
  { href: "/train", label: "Train Model", icon: PlayCircle },
  { href: "/configurations", label: "Job History", icon: Settings },
  { href: "/performance", label: "Performance", icon: BarChart3 },
  { type: "divider", label: "ZPE Analysis" },
  { href: "/zpe-flow", label: "ZPE Flow", icon: Zap },
  { href: "/quantum-noise", label: "Quantum Noise", icon: Atom },
  { type: "divider", label: "AI Flows" },
  { href: "/ai/implement-zpe", label: "Simulate ZPE", icon: Lightbulb },
  { href: "/ai/approximate-zpe", label: "Approximate Flow", icon: Replace },
  { href: "/ai/adapt-zpe", label: "Adapt ZPE", icon: Cog },
  { href: "/ai/show-scaled-output", label: "Scaled Output", icon: Scaling },
  { href: "/ai/quantize-model", label: "Quantize Model", icon: Box },
  { href: "/ai/extract-components", label: "Extract Components", icon: Share2 },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Ensure theme matches state on initial load
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };
  
  const NavLinkContent = ({ item }) => (
    <>
      <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
      {item.label}
    </>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold text-primary">
          <Atom className="h-6 w-6" />
          <span>QuantumLeap</span>
        </Link>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item, index) =>
          item.type === "divider" ? (
            <div key={`divider-${index}`} className="pt-2 pb-1 px-2">
              <span className="text-xs font-semibold uppercase text-muted-foreground">{item.label}</span>
            </div>
          ) : (
            <Link
              key={item.href}
              href={item.href || "#"}
              className={cn(
                "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              onClick={() => setIsMobileNavOpen(false)}
            >
              <NavLinkContent item={item} />
            </Link>
          )
        )}
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
      <aside className="hidden md:flex md:flex-col md:w-64 border-r border-border bg-card">
        <SidebarContent />
      </aside>
      <div className="flex flex-col flex-1 w-full">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 md:hidden">
           <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 w-64">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold text-primary md:hidden">
            <Atom className="h-6 w-6" />
            <span className="sr-only">QuantumLeap</span>
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
