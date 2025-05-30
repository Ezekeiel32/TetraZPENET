"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { invokeGenericLlm, type InvokeGenericLlmInput, type InvokeGenericLlmOutput } from "@/ai/flows/invoke-generic-llm-flow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Terminal, Wand2 } from "lucide-react";

const formSchema = z.object({
  prompt: z.string().min(5, "Prompt must be at least 5 characters long."),
});

type FormValues = z.infer<typeof formSchema>;

export default function InvokeLlmPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<InvokeGenericLlmOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "Explain the concept of Zero-Point Energy in simple terms.",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const inputForAI: InvokeGenericLlmInput = { prompt: data.prompt };
      const output = await invokeGenericLlm(inputForAI);
      setResult(output);
      toast({ title: "LLM Invoked Successfully" });
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred while invoking the LLM.");
      toast({ title: "LLM Invocation Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wand2 className="h-6 w-6 text-primary" />Invoke Generic LLM</CardTitle>
          <CardDescription>
            Send a custom prompt to the configured Large Language Model (e.g., Gemini via Genkit) and view its response.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle>Your Prompt</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="prompt">Enter Prompt</Label>
                <Controller
                  name="prompt"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      id="prompt"
                      rows={10}
                      placeholder="Type your prompt for the LLM here..."
                      className="min-h-[200px]"
                    />
                  )}
                />
                {errors.prompt && <p className="text-xs text-destructive mt-1">{errors.prompt.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Terminal className="mr-2 h-4 w-4 animate-spin" /> Invoking LLM...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Send to LLM
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle>LLM Response</CardTitle></CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {isLoading && !result && (
                 <div className="flex items-center justify-center h-64">
                    <Terminal className="h-8 w-8 text-primary animate-spin" />
                    <p className="ml-2 text-muted-foreground">Waiting for LLM response...</p>
                 </div>
            )}
            {result ? (
              <ScrollArea className="h-[400px] p-4 border rounded-md bg-muted/30">
                <pre className="text-sm whitespace-pre-wrap">{result.response}</pre>
              </ScrollArea>
            ) : (
              !isLoading && <p className="text-muted-foreground text-center py-10">Submit a prompt to see the LLM's response.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
